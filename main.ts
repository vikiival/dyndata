import { crypto } from "crypto/mod.ts";
import { cors } from "hono/middleware.ts";
import { type Context, Hono } from "hono/mod.ts";
import { Base } from "@/types.ts";
import { validateRequest as validateBase } from "@/middleware/validateBaseRequest.ts";
import { CAPTURE_URL, PATH, PORT } from "@/constants.ts";
// import { IPFS_GW } from "@/constants.ts";

const app = new Hono();

const db = await Deno.openKv(PATH);

app.use("*", cors());

app.get("/", (c: Context) => c.text("Hello world!"));

app.put("/:chain/base/:id", validateBase, async (c: Context) => {
  const id = c.req.param("id");
  const chain = c.req.param("chain");
  const body = await c.req.json<Base>();
  const res = await db.set([chain, id], body);
  return c.json({ id, kv: res });
});

app.get(
  "/:chain/base/:id/:sn",
  // cache({
  //   cacheName: "token-metadata",
  //   cacheControl: "max-age=3600",
  //   wait: true,
  // }),
  async (c: Context) => {
    const id = c.req.param("id");
    const chain = c.req.param("chain");
    const sn = c.req.param("sn");
    const { value: base } = await db.get<Base>([chain, id]);

    if (!base) {
      return c.text(`[API] BASE on Chain ${chain} with ID: ${id} found`, 404);
    }

    const encoded = new TextEncoder().encode(sn);
    const hash = await crypto.subtle.digest("KECCAK-256", encoded);

    // const image = await fetch(`/image/${id}/${sn}`); //?

    const data: Base = {
      name: `${base.name} #${sn}`,
      description: base.description,
      image: "",
      animation_url: `${base.animation_url}/?hash=${hash}`,
      external_url: "https://kodadot.xyz/",
    };

    return c.json(data);
  },
);

app.get("/:chain/image/:id/:sn", async (c: Context) => {
  const id = c.req.param("id");
  const chain = c.req.param("chain");
  const sn = c.req.param("sn");
  // const { value: base } = await db.get<Base>([chain, id]);
  // if (!base) {
  //   return c.text(`[API] BASE on Chain ${chain} with ID: ${id} found`, 404);
  // }
  const encoded = new TextEncoder().encode(sn);
  const hash = await crypto.subtle.digest("KECCAK-256", encoded);
  const url = // base.animation_url.replace("ipfs://", IPFS_GW) + `?hash=${hash}`;
    `https://nftstorage.link/ipfs/bafybeibc4bhdksstboetdg7q7dzzbxl6ynqmhjdifukm3hxirqvebxefea/?hash=${hash}`;
  //  call fetch at capturegl.vercel.app/api/screenshot, POST body: {url: "https://kodadot.xyz/"}
  const resp = await fetch(CAPTURE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!resp.ok) {
    return c.text("Unable to get image", resp);
  }

  const blob = await resp.arrayBuffer();

  return c.body(blob, { headers: resp.headers });
});

Deno.serve({ port: PORT }, app.fetch);
