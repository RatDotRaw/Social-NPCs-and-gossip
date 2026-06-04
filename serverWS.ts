import { Application, Router } from "@oak/oak";
import { oakCors } from "@tajpouria/cors";
import GameState from "./utils/gamestate.ts";
import { messageHandlers } from "./utils/messageHandler.ts";
import { loadAllPersonas } from "./utils/promptLoader.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000", 10);
const HOSTNAME = Deno.env.get("HOSTNAME") || "0.0.0.0";
const OLLAMA_HOST = Deno.env.get("OLLAMA_HOST") || "http://localhost:11434";

const personas = await loadAllPersonas()
const gameSessions: GameState[] = [];

gameSessions.push(new GameState("0", personas));

const router = new Router();

router
  // Keep lobby creation as HTTP for simple initialization
  .post("/create_lobby", (context) => {
    const newSession = new GameState(crypto.randomUUID(), personas);
    gameSessions.push(newSession);
    console.info("New session created:", newSession.id);
    context.response.body = { id: newSession.id };
  })
  
  // WebSocket endpoint for real-time interaction
  .get("/ws/:id", async (ctx) => {
    console.log("something happening")
    const id = ctx.params.id;
    const gameSession = gameSessions.find((s) => s.id === id);

    //#region authentication
    if (!id) {
      ctx.response.status = 404;
      ctx.response.body = { error: "No id found" };
      return;
    }

    // upgrade connection to WebSocket
    const socket = await ctx.upgrade();

    // check if session exist
    if (!gameSession) {
      console.warn(`connection attempted for non-existent session: ${id}`);
      
      // Send the error as a WS message so Godot can catch it
      socket.onopen = () => {
        socket.send(JSON.stringify({ error: "Session not found", code: 404 }));
        socket.close(1008, "Session not found"); // 1008 is policy violation
      };
      return;
    }
    //#endregion

    socket.onopen = () => {
      console.log(`Socket connected for session: ${id}`);
      // Send initial state upon connection
      // socket.send(JSON.stringify({
      //   type: "initial_state",
      //   court_messages: gameSession.courtMem.toJSON()
      // }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const type: string = data.type;

        // send error if requests not allowed // Don't really know why i wrote this
        if (!gameSession.allow_request) {
          console.warn(`Ignored request ${type}: Session is busy.`);
          socket.send(JSON.stringify({
              type: "error",
              message: "Server currently does not accept requests.",
              done: false, // Keep the client locked
          }));
          return;
        }

        const handler = messageHandlers[type];
        if (handler) {
          await handler(socket, gameSession, data);
        } else {
          console.warn(`Handler "${type}" does not exist`);
        }
      } catch (err) {
        console.error("### failed to process message", err);
      }
    };

    socket.onclose = () => {
      console.log(`Socket closed for session: ${id}`);
    };

    socket.onerror = (e) => {
      // ignoring for now
      console.error("WebSocket error:", e);
    };
  });

const app = new Application();
app.use(oakCors({ origin: "*" }));
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Model selected: ", Deno.env.get("OLLAMA_MODEL"))

console.log(`Server running on http://${HOSTNAME}:${PORT}`);
await app.listen({ port: PORT, hostname: HOSTNAME });
