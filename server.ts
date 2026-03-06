import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import os from "os";
import { Bonjour } from "bonjour-service";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const bonjour = new Bonjour();

// Broadcast mDNS service for local discovery
try {
  bonjour.publish({
    name: 'BibleSlide Remote',
    type: 'http',
    port: PORT,
    txt: {
      app: 'bibleslide',
      version: '1.0'
    }
  });
  console.log('mDNS service published: BibleSlide Remote');
} catch (err) {
  console.warn('Failed to publish mDNS service (this is expected in some environments):', err);
}

app.use(express.json());

// Session state storage
const sessions: Record<string, {
  presenter: WebSocket | null;
  clients: Set<WebSocket>;
  state: {
    slideIndex: number;
    totalSlides: number;
    mode: string;
    reference?: string;
    bibleData?: any;
    songData?: any;
  }
}> = {};

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/network-info", (req, res) => {
  const interfaces = os.networkInterfaces();
  let localIp = "localhost";
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
    if (localIp !== "localhost") break;
  }
  
  res.json({ localIp, port: PORT });
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let currentSessionId: string | null = null;
  let isPresenter = false;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, sessionId } = data;

      if (type === "join") {
        currentSessionId = sessionId;
        if (!sessions[sessionId]) {
          sessions[sessionId] = {
            presenter: null,
            clients: new Set(),
            state: { slideIndex: 0, totalSlides: 0, mode: 'bible' }
          };
        }

        if (data.role === "presenter") {
          isPresenter = true;
          sessions[sessionId].presenter = ws;
          if (data.state) {
            sessions[sessionId].state = { ...sessions[sessionId].state, ...data.state };
          }
        } else {
          sessions[sessionId].clients.add(ws);
          // Send current state to new client
          ws.send(JSON.stringify({
            type: "sync",
            state: sessions[sessionId].state
          }));
        }
        
        // Notify presenter about new client
        if (sessions[sessionId].presenter && sessions[sessionId].presenter.readyState === WebSocket.OPEN) {
          sessions[sessionId].presenter.send(JSON.stringify({
            type: "client-count",
            count: sessions[sessionId].clients.size
          }));
        }
      }

      if (type === "update" && currentSessionId && sessions[currentSessionId]) {
        // Only presenter can update state usually, but we allow remote control too
        sessions[currentSessionId].state = { ...sessions[currentSessionId].state, ...data.state };
        
        // Broadcast to all clients and presenter
        const payload = JSON.stringify({
          type: "sync",
          state: sessions[currentSessionId].state,
          sender: isPresenter ? "presenter" : "remote"
        });

        if (sessions[currentSessionId].presenter && ws !== sessions[currentSessionId].presenter) {
          sessions[currentSessionId].presenter.send(payload);
        }
        
        sessions[currentSessionId].clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      }
    } catch (err) {
      console.error("WS error:", err);
    }
  });

  ws.on("close", () => {
    if (currentSessionId && sessions[currentSessionId]) {
      if (isPresenter) {
        sessions[currentSessionId].presenter = null;
        // Optionally notify clients that presenter left
      } else {
        sessions[currentSessionId].clients.delete(ws);
        // Notify presenter about client leaving
        if (sessions[currentSessionId].presenter && sessions[currentSessionId].presenter.readyState === WebSocket.OPEN) {
          sessions[currentSessionId].presenter.send(JSON.stringify({
            type: "client-count",
            count: sessions[currentSessionId].clients.size
          }));
        }
      }
    }
  });
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
