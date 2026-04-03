import { Hono } from "hono";
import type { Env } from "./env";
import { health } from "./routes/health";

const app = new Hono<{ Bindings: Env }>();

app.route("/", health);

export default app;
