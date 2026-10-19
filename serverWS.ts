import { createServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import GameState from "./utils/gamestate.ts";
import { messageHandlers } from "./utils/messageHandler.ts";
import { loadAllPersonas } from "./utils/promptLoader.ts";

const PORT = parseInt(process.env.PORT || "8000", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

const personas = await loadAllPersonas()
const gameSessions: GameState[] = [];

gameSessions.push(new GameState("0", personas));

// handles the websocket protocol once the raw HTTP request has been upgraded
const wss = new WebSocketServer({ noServer: true });

const server = createServer((req, res) => {
  // CORS (replaces oakCors)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    // Keep lobby creation as HTTP for simple initialization
    if (req.method === "POST" && url.pathname === "/create_lobby") {
      const newSession = new GameState(crypto.randomUUID(), personas);
      gameSessions.push(newSession);
      console.info("New session created:", newSession.id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: newSession.id }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (err) {
    console.error("### failed to handle request", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }
    res.end(JSON.stringify({ error: String(err) }));
  }
});

// WebSocket endpoint for real-time interaction: the raw HTTP handshake is
// upgraded here, keeping the regular request pipeline for the API calls
server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);
    if (!wsMatch) {
      socket.destroy();
      return;
    }
    upgradeToWebSocket(req, socket, head, wsMatch[1]);
  } catch (err) {
    console.error("### failed to upgrade connection", err);
    socket.destroy();
  }
});

function upgradeToWebSocket(req: IncomingMessage, netSocket: Duplex, head: Buffer, id: string) {
  const gameSession = gameSessions.find((s) => s.id === id);

  console.log("something happening")
  wss.handleUpgrade(req, netSocket, head, (socket) => {
    // check if session exist
    if (!gameSession) {
      console.warn(`connection attempted for non-existent session: ${id}`);

      // Send the error as a WS message so Godot can catch it
      socket.send(JSON.stringify({ error: "Session not found", code: 404 }));
      socket.close(1008, "Session not found"); // 1008 is policy violation
      return;
    }
    //#endregion

    console.log(`Socket connected for session: ${id}`);
    // Send initial state upon connection
    // socket.send(JSON.stringify({
    //   type: "initial_state",
    //   court_messages: gameSession.courtMem.toJSON()
    // }));

    socket.on("message", async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
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
    });

    socket.on("close", () => {
      console.log(`Socket closed for session: ${id}`);
    });

    socket.on("error", (e) => {
      // ignoring for now
      console.error("WebSocket error:", e);
    });
  });
}

console.log("Model selected: ", process.env.OLLAMA_MODEL)

console.log(`Server running on http://${HOSTNAME}:${PORT}`);
server.listen(PORT, HOSTNAME);
