// src/server.ts
import { app } from "./app";
import { redisClient } from "./common/config/database";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Redis 연결
    await redisClient.connect(); 

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📋 Swagger Docs: http://localhost:${PORT}/docs`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1); 
  }
}

startServer();