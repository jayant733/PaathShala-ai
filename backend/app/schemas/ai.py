from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class TokenUsage(BaseModel):
    input: int
    output: int

class ChatResponse(BaseModel):
    response: str
    model: str
    tokens: TokenUsage
