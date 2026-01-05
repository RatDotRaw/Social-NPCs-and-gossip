import { api } from "@dialogic";
import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import GameState from "./utils/gamestate.ts";
import { messageHandlers } from "./utils/messageHandler.ts";

const gameSessions: GameState[] = [];

const prov = api.APIFactory.createAPI({
  type: "Ollama",
  model: "ministral-3:8b",
  baseURL: "http://localhost:11434",
});

gameSessions.push(new GameState("0", prov));

const router = new Router();

router
  // Keep lobby creation as HTTP for simple initialization
  .post("/create_lobby", (context) => {
    const newSession = new GameState(crypto.randomUUID(), prov);
    gameSessions.push(newSession);
    console.info("New session created:", newSession.id);
    context.response.body = { id: newSession.id };
  })
  
  // WebSocket endpoint for real-time interaction
  .get("/ws/:id", async (ctx) => {
    console.log("something happening")
    const id = ctx.params.id;
    const courtSession = gameSessions.find((s) => s.id === id);

    if (!id) {
      ctx.response.status = 404;
      ctx.response.body = { error: "No id found" };
      return;
    }

    // upgrade connection to WebSocket
    const socket = await ctx.upgrade();

    // check if session exist
    if (!courtSession) {
      console.warn(`connection attempted for non-existent session: ${id}`);
      
      // Send the error as a WS message so Godot can catch it
      socket.onopen = () => {
        socket.send(JSON.stringify({ error: "Session not found", code: 404 }));
        socket.close(1008, "Session not found"); // 1008 is policy violation
      };
      return;
    }

    socket.onopen = () => {
      console.log(`Socket connected for session: ${id}`);
      // Send initial state upon connection
      socket.send(JSON.stringify({
        type: "initial_state",
        court_messages: courtSession.courtMem.toJSON()
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const type: string = data.type;

        if (!courtSession.allow_request) {
          console.warn(`Ignored request ${type}: Session is busy.`);
          socket.send(JSON.stringify({
              type: "error",
              message: "Server is busy processing previous request.",
              done: false, // Keep the client locked
          }));
          return;
        }

        const handler = messageHandlers[type];
        if (handler) {
          const result = handler(socket, courtSession, data);
          if (result instanceof Promise) {
            await handler(socket, courtSession, data);
          }
        } else {
          console.warn(`Handler ${type} does not exist`);
        }
      } catch (err) {
        console.error("failed to preocess message", err);
      }
    };

    socket.onclose = () => {
      console.log(`Socket closed for session: ${id}`);
    };

    socket.onerror = (e) => {
      // ignoring for now
      // console.error("WebSocket error:", e);
    };
  });

const app = new Application();
app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000, hostname: "0.0.0.0" });
