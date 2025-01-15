import type { Boom } from "@hapi/boom";
import {
  Browsers,
  DisconnectReason,
  makeWASocket,
  useMultiFileAuthState,
  type AnyMessageContent,
} from "@whiskeysockets/baileys";
import moment from "moment";
import { cancelJob, scheduleJob, type Job } from "node-schedule";
import { rmSync } from "node:fs";
import { join } from "node:path";
import pThrottle from "p-throttle";
import env from "./env";
import pino from "pino";
import PinoPretty from "pino-pretty";
import SonicBoom from "sonic-boom";
import type { EventType } from "../types/event";
import event from "../modules/event";

export default class WhatsappInstance {
  public id!: string;
  public sock!: ReturnType<typeof makeWASocket>;
  public status: EventType["connection"]["status"] = {
    connection: "CONNECTING",
  };
  private throttle = pThrottle({
    limit: 1,
    interval: env.get("THROTTLE_INTERVAL", 0),
  });
  private autoRestart?: Job;

  constructor(id: string) {
    this.id = id;
  }

  async start() {
    if (this.autoRestart) cancelJob(this.autoRestart);

    const auth = await useMultiFileAuthState(
      join(env.get("AUTH_PATH", "./auth"), this.id)
    );

    this.sock = makeWASocket({
      auth: auth.state,
      browser: Browsers.ubuntu(env.get("APP_NAME", "GUWA Engine")),
      logger: pino(
        PinoPretty({
          colorize: false,
          destination: new SonicBoom({
            dest: join(env.get("LOG_PATH", "./logs"), this.id),
            mkdir: true,
          }),
        })
      ) as any,
    });

    this.sock.ev.on("creds.update", auth.saveCreds);

    this.sock.ev.on("connection.update", async (socket) => {
      const { connection, lastDisconnect, qr } = socket;

      this.status.qr = socket.qr;

      if (connection === "close") {
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode ===
          DisconnectReason.loggedOut
        ) {
          rmSync(join(env.get("AUTH_PATH", "./auth"), this.id), {
            recursive: true,
          });
          this.remove();
        }

        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.connectionReplaced &&
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.connectionLost
        ) {
          await this.start();
        }
      } else if (connection === "open") {
        this.status.connection = "CONNECTED";
      }

      event.ev.emit("connection", {
        id: this.id,
        status: this.status,
      });
    });

    this.sock.ev.on("messages.upsert", (data) => {
      data.messages.forEach((data) => {
        event.ev.emit("message", {
          id: this.id,
          from: data.key.remoteJid!.split("@")[0],
          text:
            data.message?.conversation ||
            data.message?.extendedTextMessage?.text ||
            "",
        });
      });
    });

    this.autoRestart = scheduleJob(
      moment().add(30, "minutes").toDate(),
      async () => {
        this.autoRestart = undefined;
        await this.start();
      }
    );
  }

  remove() {
    this.status.connection = "DISCONNECTED";

    this.sock.ev.removeAllListeners("connection.update");
    this.sock.ev.removeAllListeners("creds.update");
    this.sock.ev.removeAllListeners("messages.upsert");

    this.sock.end(undefined);
  }

  public throttledSend = this.throttle(
    async (to: string, data: AnyMessageContent) =>
      this.sock.sendMessage(to, data)
  );
}
