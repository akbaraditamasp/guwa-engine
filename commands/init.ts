import { input } from "@inquirer/prompts";
import { createId } from "@paralleldrive/cuid2";
import type { GuwaEnv } from "../types/env";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

export default async function init() {
  const config: GuwaEnv = {
    APP_NAME: await input({
      message: "What is the name of your application?",
      default: "GUWA Engine",
      required: true,
    }),
    API_KEY: await input({
      message: "What is the API Key for authorization to access your API?",
      default: createId(),
      required: false,
    }),
    PORT: Number(
      await input({
        message: "What port would you like to use?",
        default: "3000",
        required: true,
      })
    ),
    AUTH_PATH: await input({
      message: "Where would you like to store your authentication files?",
      default: resolve("auth"),
      required: true,
    }),
    CALLBACK_URL: await input({
      message: "What is the callback URL?",
      required: false,
    }),
    THROTTLE_INTERVAL: Number(
      await input({
        message:
          "How long should the interval be, in milliseconds, between each message sent?",
        default: "0",
        required: true,
      })
    ),
    LOG_PATH: await input({
      message: "Where would you like to store your log files?",
      default: resolve("logs"),
      required: true,
    }),
  };

  writeFileSync("./config.json", JSON.stringify(config));
}
