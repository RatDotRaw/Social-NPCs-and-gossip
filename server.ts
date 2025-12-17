import { api } from "@dialogic";
import { Application, Router } from "@oak/oak";
import GameState from "./utils/gamestate.ts";

const gameSessions: GameState[] = [];

// create api provider
const prov = api.APIFactory.createAPI({
  type: "Ollama",
  model: "ministral-3:8b",
  baseURL: "http://localhost:11434",
});

gameSessions.push(new GameState("0", prov));

const router = new Router();
router
  .post("/create_lobby", (context) => {
    const newSession = new GameState(crypto.randomUUID(), prov);
    gameSessions.push(newSession);
    console.info("new session created:", newSession.id);

    context.response.body = { id: newSession.id };
  })
  .post("/court_resp", async (context) => {
    const body = context.request.body;

    if (!body.has) {
      context.response.status = 400;
      context.response.body = { error: "Missing body" };
      return;
    }

    const json = await body.json();
    console.log(json);

    if (json.id === undefined) {
      context.response.status = 400;
      context.response.body = { error: "Expected session id" };
      return;
    }

    const courtSession = gameSessions.find(
      (s) => s.id == json.id
    );
    if (!courtSession) {
      context.response.status = 400;
      context.response.body = { error: "Session id not found" };
      return;
    }

    // optionally add new message
    if (json.userMessage) {
      courtSession.courtAddMsg(json.userMessage)
      console.log(`adding message to ${json.id}`)
      
    } 

    // send all court messages back
    context.response.body = {
      courtMessages: courtSession.courtMem.toJSON()
    }

  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
