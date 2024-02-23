import { crypto } from "crypto/mod.ts";
import { cors } from "hono/middleware.ts";
import { type Context, Hono } from "hono/mod.ts";
import { Base } from "@/types.ts";
import { validateRequest as validateBase } from "@/middleware/validateBaseRequest.ts";

const app = new Hono();

const PORT = 3000; // 80 for production
const PATH = "./db.sqlite";
const db = await Deno.openKv(PATH);

app.use("*", cors());

app.get("/", (c: Context) => c.text("Hello world!"));

app.put("base/:id", validateBase, async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<Base>();
  const res = await db.set([id], body);
  return c.json({ id, kv: res });
});

app.get(
  "/base/:id/:sn",
  // cache({
  //   cacheName: "token-metadata",
  //   cacheControl: "max-age=3600",
  //   wait: true,
  // }),
  async (c: Context) => {
    const id = c.req.param("id");
    const sn = c.req.param("sn");
    const base = await db.get<Base>([id]);

    if (!base.value) {
      return c.text("Not found", 404);
    }

    const { value } = base;

    const encoded = new TextEncoder().encode(sn);
    const hash = await crypto.subtle.digest("KECCAK-256", encoded);

    const data: Base = {
      name: `${value.name} #${sn}`,
      description: value.description,
      image: "",
      animation_url: `${value.animation_url}/?hash=${hash}`,
      external_url: "https://kodadot.xyz/",
    };

    return c.json(data);
  },
);

app.get("/image/:id/:sn", async (c: Context) => {
  const id = c.req.param("id");
  const sn = c.req.param("sn");
  const base = await db.get<Base>([id]);
  const encoded = new TextEncoder().encode(sn);
  const hash = await crypto.subtle.digest("KECCAK-256", encoded);
  //  call fetch at capturegl.vercel.app/api/screenshot, POST body: {url: "https://kodadot.xyz/"}
  const resp = await fetch("https://capturegl.vercel.app/api/screenshot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://kodadot.xyz/",
    }),
  });

  if (!resp.ok) {
    return c.text("Unable to get image", resp);
  }

  return resp;
});

Deno.serve({ port: PORT }, app.fetch);
