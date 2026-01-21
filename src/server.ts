// src/server.ts
import "dotenv/config";
import http from "http";
import { app } from "./app";
import { redisClient } from "./common/config/database";
import { SocketServer } from "./socket/socket";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Redis 연결
    await redisClient.connect(); 

    const httpServer: http.Server = http.createServer(app);
    new SocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📋 Swagger Docs: http://localhost:${PORT}/docs`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); 
  }
}

startServer();