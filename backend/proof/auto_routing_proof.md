# Auto-Routing AI Proof Report

This report proves that the AI Auto-Router is dynamically switching between local LLMs (Ollama) and cloud models (Gemini) based on task complexity.

## Routing Statistics
- **Total AI Responses:** 3
- **Gemini (Complex tasks):** 1
- **Ollama / Local (Simpler tasks):** 2
- **Other:** 0

## Message Routing Details

### Conversation: write code for a complex web server in python
| Prompt | Provider | Model | Latency (ms) | Response Preview |
|--------|----------|-------|--------------|------------------|
| write code for a complex web server in python | **gemini** | `gemini-flash-latest` | N/A | %%%PAATHSHALA:code%%% {"title":"Production-Ready Asynchronous Web Server in Python","summary":"A ful... |

### Conversation: Compare PostgreSQL vs MongoDB
| Prompt | Provider | Model | Latency (ms) | Response Preview |
|--------|----------|-------|--------------|------------------|
| Compare PostgreSQL vs MongoDB | **ollama** | `llama3:latest` | N/A | %%%PAATHSHALA:comparison%%% {"title":"PostgreSQL vs MongoDB Comparison","summary":"Comparing the str... |

### Conversation: What is RAG? Explain it simply
| Prompt | Provider | Model | Latency (ms) | Response Preview |
|--------|----------|-------|--------------|------------------|
| What is RAG? Explain it simply | **ollama** | `llama3:latest` | N/A | %%%PAATHSHALA:concept%%% {"title":"RAG Pipeline","summary":"Retrieval-augmented generation for accur... |

