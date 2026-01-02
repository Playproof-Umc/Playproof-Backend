// src/app.ts
import "reflect-metadata"; 
import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "./build/routes"; 
import swaggerDocument from "./build/swagger.json"; 
import { globalErrorHandler } from "./common/middlewares/error.handler";

export const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// TSOA Routes 등록
RegisterRoutes(app);

// Global Error Handler (반드시 라우트 등록 뒤에!)
app.use(globalErrorHandler);