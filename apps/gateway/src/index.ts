import { Hono } from "hono";
import type { Env } from "./env";
import { health } from "./routes/health";
import { payment } from "./routes/payment";

const app = new Hono<{ Bindings: Env }>();

app.route("/", health);
app.route("/", payment);

export default app;
