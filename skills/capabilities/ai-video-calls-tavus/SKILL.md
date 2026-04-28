---
name: ai-video-calls-tavus
description: AI video conversations - create real-time video calls with AI personas
source: orthogonal
---


# Tavus - AI Video Conversations

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Create real-time video conversations with AI-powered digital personas.

## Capabilities

- **List Personas**: This endpoint returns a list of all Personas
- **Create Conversation**: This endpoint starts a real-time video conversation with your AI replica, powered by a persona that allows it to see, hear, and respond like a human

## Usage

### List Personas
This endpoint returns a list of all Personas. You can first list the Personas to choose which one you'd like to create a conversation with. Then, using the Create Conversation endpoint, you can start a conversation with that persona providing the persona ID.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavus","path":"/v2/personas"}'
```

### Create Conversation
This endpoint starts a real-time video conversation with your AI replica, powered by a persona that allows it to see, hear, and respond like a human. Provide the most relevant persona_id obtained from the List Personas endpoint.

Parameters:
- persona_id* (string) - p1b06420cfdc

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavus","path":"/v2/conversations"}'
  "persona_id": "your-persona-id",
  "conversation_name": "Customer Support Call"
}'
```

## Use Cases

1. **Customer Support**: AI-powered video support agents
2. **Sales Demos**: Personalized video product demos
3. **Training**: Interactive video training sessions
4. **Onboarding**: Automated new user onboarding calls
5. **Interviews**: AI-assisted screening interviews

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"tavus API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"tavus","path":"/v2/personas"}'   # Get endpoint details
```
