import { type Context } from "hono/mod.ts"
import { minLength, object, parse, startsWith, string } from "valibot/mod.ts"

const baseSchema = object({
  name: string([minLength(3, "Valid name is required")]),
  description: string([minLength(3, "Valid description is required")]),
  animationUrl: string([
    startsWith("ipfs://", "possibly not ipfs"),
    minLength(30, "Valid hash is required"),
  ]),
});

export const validateRequest = async <T>(
  c: Context,
  // deno-lint-ignore ban-types
  next: Function,
) => {
  const body: T = await c.req.json<T>();

  try {
    parse(baseSchema, body);
  } catch (e) {
    return c.text((e as Error).message, 400);
  }

  await next();
};
