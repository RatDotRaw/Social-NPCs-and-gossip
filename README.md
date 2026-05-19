# Social-NPCs-and-gossip

A LLM network to simulate social circles and gossip.

## Prerequisites

- [Deno](https://deno.com/) (latest)
- [Godot 4.6](https://godotengine.org/download/archive/4.6-stable/)
- [Ollama](https://ollama.com/) with the `qwen3.5:4b` model pulled (`ollama pull qwen3.5:4b`)

## Up & running

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env to match your setup (defaults work for local development)
```

### 2. Start Ollama

```bash
ollama serve
```

### 3. Start the Deno server

```bash
# Install dependencies
deno cache serverWS.ts

# Run the WebSocket server
deno run --env-file -A serverWS.ts
```

The server listens on `http://localhost:8000` (configurable via `.env`).

### 4. Run the Godot client

Open `Godot/project.godot` in **Godot 4.6** and press **F5** (Play).

### 5. Enjoy the game!

Godot should automatically connect to the backend on localhost.

## Sources

### Deno

In `demos/NPCtoNPC`
- 23/11/2025 Reading a directory for files
  https://docs.deno.com/api/deno/~/Deno.readDir

in `utils/promptLoader.ts`
- 22/13/2025 Reading the contents of a text file 
  https://docs.deno.com/api/deno/~/Deno.readTextFile

Constructing all NPC profiles:
- 07/12/2025 Simulating Rumor Spreading in Social Networks using LLM Agents
  https://arxiv.org/abs/2502.01450

Creating Deno API endpoints for Godot:
- 10/12/2025 oak Router docs 
  https://deno.com/learn/api-servers
  https://jsr.io/@oak/oak/doc/router
- 17/12/2025 oak cors setup
  https://jsr.io/@tajpouria/cors

every file in `messages/*`
- 11/01/2025 defining zod validation schema's
  https://zod.dev/basics
  https://zod.dev/error-formatting
  https://zod.dev/api#refine
- 15/01/2026 Extending existing z schema's
  https://claude.ai/share/b6869654-718c-49a7-bea2-05cd1e9b1241

All persona JSON data in `personaData/profiles/`
- 16/01/2026 writing the persona prompts 
  https://gemini.google.com/share/342bd6336015
- 24/01/2026 A rewrite to fit the new format
  https://chat.qwen.ai/s/fe2c5d63-5d32-4e97-af54-d6a258ebefab?fev=0.1.34

Dialog manager design idea (files in `dialogManager\*`)
- 15/01/2026 https://chatgpt.com/share/696e28a8-03dc-8012-86f9-bff8fbf36658

in `utils/messageHandler.ts`
- 18/12/2025 Handler Map design pattern & implementation reference
  https://gemini.google.com/share/5a5c214d0325

In `utils/ollamaHelpers.ts`
- 15/03/2026 Help writing the `generateToolCallResponse` function
  https://chat.qwen.ai/s/9c22d28f-ed05-48b3-a3e3-3a4071a853d0?fev=0.2.14

In `gossipEnge/GossipEngine.ts`
- 15/03/2026 Help writing the tool call json
  https://chat.qwen.ai/s/9c22d28f-ed05-48b3-a3e3-3a4071a853d0?fev=0.2.14

In `gossipEnge/GossipEngine.ts` & `utils/gamestate.ts`
- 26/04/2026 Using Iterators to get results ASAP
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*#generator_example
  https://blog.logrocket.com/understanding-typescript-generators/#iterate-large-data-sets

### Godot

`squiggleVision.gdshader`
- 29/12/2025 SquigleVision shader:
  https://godotshaders.com/shader/squigglevision/
in `Godot/scripts/api_client.gd`
- 17/12/2025 Creating API client
  https://docs.godotengine.org/en/4.5/tutorials/networking/http_request_class.html

in `Godot/script/api_client_ws.gd`
- 18/12/2025 Reading & writing a WebSocket client
  https://claude.ai/share/67c80cc1-8092-4461-9712-a65f067fe5a4
- 21/12/2025 A better way of handling async communications over websockets
  https://claude.ai/share/fbc4ea23-b65f-424f-ac99-caa307788cab

in `scripts/scene_manager.gd`
- 07/03/2025 Loading in different scenes
  https://www.gotut.net/loading-screen-in-godot-4/

Godot BBCode effects on various elements
- 21/04/2026
  https://docs.godotengine.org/en/latest/tutorials/ui/bbcode_in_richtextlabel.html

All sound effects
- 07/05/2026 jail and stinky sfx
  https://www.youtube.com/watch?v=6HIPg9iKFSM
  https://www.youtube.com/watch?v=r5pEFAm63NM