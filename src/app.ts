// src/app.ts
import "reflect-metadata"; 
import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { RegisterRoutes } from "./build/routes"; 
import * as swaggerJson from "./build/swagger.json";
//import swaggerDocument from "./build/swagger.json"; 
import { globalErrorHandler } from "./common/middlewares/error.handler";
import { optionalAuthMiddleware } from "./common/middlewares/optional-auth.middleware";
import { upload } from "./common/config/multer";

// BigInt JSON 변환 처리
(BigInt.prototype as any).toJSON = function () {
  const n = Number(this);
  return Number.isSafeInteger(n) ? n : this.toString();
};

export const app = express();

const allowedOrigins: Array<string | RegExp> = [
  /^http:\/\/localhost:\d+$/, // 로컬 전체 포트 허용
  /^https:\/\/playproof-frontend(?:[-a-z0-9]+)?\.vercel\.app$/i
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) =>
        typeof allowed === "string" ? allowed === origin : allowed.test(origin)
      );

      return callback(null, isAllowed);
    },
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const asyncapiSpecPath = path.resolve(process.cwd(), "asyncapi.yaml");
const asyncapiHtmlPath = path.resolve(process.cwd(), "public", "asyncapi.html");
const swaggerDocument = "default" in swaggerJson ? (swaggerJson as any).default : swaggerJson;
const swaggerDocumentWithBase = {
  ...swaggerDocument,
  servers: [{ url: "/api" }, ...(swaggerDocument.servers ?? [])]
};

// Swagger UI
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocumentWithBase));
app.get("/asyncapi.yaml", (_req, res) => res.sendFile(asyncapiSpecPath));
app.get("/async-docs", (_req, res) => res.sendFile(asyncapiHtmlPath));

// TSOA Routes 등록 (커스텀 multer 사용)
const apiRouter = express.Router();
apiRouter.use(optionalAuthMiddleware);
RegisterRoutes(apiRouter, { multer: upload });
app.use("/api", apiRouter);

// Global Error Handler (반드시 라우트 등록 뒤에!)
app.use(globalErrorHandler);
