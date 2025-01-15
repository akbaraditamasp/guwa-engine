import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import env from "../utils/env";
import whatsapp from "./whatsapp";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export default class Server {
  private hono = new Hono();

  constructor() {
    if (env.get("API_KEY")) {
      this.hono.use(bearerAuth({ token: env.get("API_KEY")! }));
    }

    this.hono.post(
      "/:id/send",
      zValidator(
        "json",
        z.object({
          to: z.string(),
          text: z.string(),
        })
      ),
      async (c) => {
        const instance = whatsapp.get(c.req.param("id"));

        if (!instance || instance.status.connection !== "CONNECTED") {
          return c.json(
            {
              error: "Instance not connected",
            },
            400
          );
        }

        const { to, text } = c.req.valid("json");
        const [id] = await instance.sock.onWhatsApp(to);

        if (!id.exists) {
          return c.json(
            {
              error: "Target not in whatsapp",
            },
            400
          );
        }

        instance.throttledSend(id.jid, { text });

        return c.json({
          message: "Whatsapp queued",
        });
      }
    );

    this.hono.get("/:id", (c) => {
      const instance = whatsapp.get(c.req.param("id"));

      if (!instance) {
        return c.json(
          {
            error: "Instance not found",
          },
          404
        );
      }

      return c.json({
        id: instance.id,
        status: instance.status,
      });
    });

    this.hono.post("/:id", async (c) => {
      if (whatsapp.get(c.req.param("id"))) {
        return c.json(
          {
            error: "Instance already created",
          },
          400
        );
      }

      const instance = await whatsapp.add(c.req.param("id"));

      return c.json({
        id: instance.id,
        status: instance.status,
      });
    });
  }

  static serve() {
    const { hono } = new Server();

    Bun.serve({
      port: env.get("PORT", 3000),
      fetch: hono.fetch,
    });

    console.log(
      "GUWA Engine running on http://localhost:" + env.get("PORT", 3000)
    );
  }
}
