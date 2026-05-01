import express from "express";
import cors from "cors";
import path from "path";
import { createApiRouter } from "./routes/index.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { loadEnv } from "../config/env.js";
import { requestContextMiddleware } from "../utils/logger.js";

const env = loadEnv();
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestContextMiddleware);

const staticDir = path.resolve(env.LOCAL_IMAGE_STORAGE_DIR);
app.use("/static/images", express.static(staticDir));

app.use("/api", createApiRouter());
app.use(errorHandlerMiddleware);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${String(env.PORT)}`);
});
