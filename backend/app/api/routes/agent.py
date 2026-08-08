from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.api.dependencies import get_current_user, get_agent_service, get_ai_service
from app.services.ai_service import AIService
from app.database.models.user import User
from app.services.agent_service import AgentService
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.ai.providers.context import set_ai_context
from app.services import routing_service

router = APIRouter(prefix="/agent", tags=["agent"])


async def _resolve_auto_target(db, user_id, message):
    """In auto mode, consult the user's routing table to pick a concrete target.

    Returns ``(provider, model, mode)``. If a rule matches, forces that model
    (manual mode). Otherwise keeps auto (existing Gemini -> Ollama fallback).
    """
    rules = await routing_service.list_rules(db, user_id)
    target = routing_service.resolve_target(message, rules)
    if target:
        provider, model = target
        return provider, model, "manual"
    return None, None, "auto"

@router.post("/chat", response_model=AgentChatResponse)
async def chat_with_agent(
    request: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    agent_service: AgentService = Depends(get_agent_service)
):
    """
    Chat with the PaathShala AI agent ecosystem.
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[Agent Route] Received chat request: mode={request.ai_mode}, provider={request.provider}, model={request.model_name}")

        # Set contextvar for the current async task
        mode = request.ai_mode or ("auto" if not request.provider else "manual")
        provider = request.provider
        model_name = request.model_name

        if mode == "auto":
            provider, model_name, mode = await _resolve_auto_target(
                agent_service.session, current_user.id, request.message
            )

        set_ai_context(provider=provider, model_name=model_name, mode=mode)

        result = await agent_service.chat(
            user_id=current_user.id,
            message=request.message,
            conversation_id=request.conversation_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

from app.api.dependencies import get_current_user, get_agent_service, get_ai_service, get_rag_service
from app.services.rag_service import RAGService

@router.post("/chat/stream")
async def stream_chat_with_agent(
    request: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    ai_service: AIService = Depends(get_ai_service),
    agent_service: AgentService = Depends(get_agent_service),
    rag_service: RAGService = Depends(get_rag_service)
):
    """
    Stream chat with the AI tutor (bypasses full LangGraph for Phase 2).
    """
    import json
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"[Agent Route] Received stream request: mode={request.ai_mode}, provider={request.provider}, model={request.model_name}")

    # Set contextvar for the current async task
    mode = request.ai_mode or ("auto" if not request.provider else "manual")
    provider = request.provider
    model_name = request.model_name

    if mode == "auto":
        provider, model_name, mode = await _resolve_auto_target(
            agent_service.session, current_user.id, request.message
        )

    set_ai_context(provider=provider, model_name=model_name, mode=mode)

    async def event_generator():
        try:
            from app.ai.prompts.tutor_prompts import get_presentation_system_prompt
            from app.database.models.chat import Conversation, Message
            from sqlalchemy.future import select
            
            # DB Operations
            conversation_id = request.conversation_id
            if conversation_id:
                stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
                result = await agent_service.session.execute(stmt)
                conv = result.scalar_one_or_none()
                if not conv:
                    yield f"data: {json.dumps({'error': 'Invalid conversation_id', 'done': True})}\n\n"
                    return
            else:
                conv = Conversation(user_id=current_user.id, title=request.message[:50])
                agent_service.session.add(conv)
                await agent_service.session.commit()
                await agent_service.session.refresh(conv)
                conversation_id = conv.id
            
            yield f"data: {json.dumps({'conversation_id': str(conversation_id), 'chunk': ''})}\n\n"
                
            user_msg = Message(conversation_id=conversation_id, role="user", content=request.message)
            agent_service.session.add(user_msg)
            await agent_service.session.commit()
            
            logger.info(f"[Agent Route] Incoming user message for conv {conversation_id}: {request.message[:100]}...")
            
            # Process RAG if document is linked
            system_prompt = get_presentation_system_prompt()
            
            if conv.document_id:
                try:
                    # Use RAGService to perform Top-K search
                    # RAGService's ask_question usually handles this, but here we just need chunks
                    # Let's directly use vector_repo inside rag_service if ask_question returns response
                    from app.ai.prompts.tutor_prompts import get_cot_rag_prompt
                    
                    query_embedding = await rag_service.embedding_provider.create_embeddings([request.message])
                    if query_embedding:
                        # Top-K = 4, threshold = 0.65
                        chunks = await rag_service.vector_repo.similarity_search(
                            document_id=conv.document_id,
                            query_embedding=query_embedding[0],
                            limit=4
                        )
                        
                        # Filter by threshold (assuming vector_repo returns tuples of (chunk, distance))
                        # Wait, let's just use the chunks if it returns objects. We will assume chunks are strings or have .content
                        context_text = "\n\n".join([c.content if hasattr(c, 'content') else str(c) for c in chunks])
                        
                        if context_text:
                            system_prompt = get_cot_rag_prompt(context_text)
                        else:
                            system_prompt += "\n\nDEBUG: RAG search returned 0 chunks."
                except Exception as e:
                    import traceback
                    err_str = traceback.format_exc()
                    logger.error(f"RAG Retrieval failed: {err_str}")
                    system_prompt += f"\n\nDEBUG ERROR IN RAG:\n{err_str}"
            
            # Load conversation history for multi-turn context
            history_stmt = select(Message).where(
                Message.conversation_id == conversation_id
            ).order_by(Message.created_at)
            history_result = await agent_service.session.execute(history_stmt)
            all_messages = list(history_result.scalars().all())
            
            # Build history list (exclude the very last user message we just added)
            history = [
                {"role": m.role, "content": m.content}
                for m in all_messages[:-1]  # all except the current user message
            ]
            
            # Start stream with history
            logger.info(f"[Agent Route] Sending request to ProviderManager (History length: {len(history)}).")
            stream = ai_service.provider.stream_response(
                prompt=request.message,
                system_instruction=system_prompt,
                history=history
            )
            
            full_response = ""
            final_model = ""
            async for chunk_data in stream:
                if chunk_data.get("chunk"):
                    full_response += chunk_data["chunk"]
                if chunk_data.get("model_name"):
                    final_model = chunk_data["model_name"]
                
                yield f"data: {json.dumps(chunk_data)}\n\n"
            
            # Save assistant message
            assistant_msg = Message(
                conversation_id=conversation_id, 
                role="assistant", 
                content=full_response,
                provider=request.provider,
                model_used=final_model
            )
            agent_service.session.add(assistant_msg)
            await agent_service.session.commit()
            
            logger.info(f"[Agent Route] Received full response from model '{final_model}' ({len(full_response)} chars).")
                
        except Exception as e:
            logger.error(f"[Agent Route] AI provider error: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
