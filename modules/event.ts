import axios, { type AxiosResponse } from "axios";
import GuwaEvent from "../utils/event";
import env from "../utils/env";

class Event {
  public ev = new GuwaEvent();

  boot() {
    if (!env.get("CALLBACK_URL")) return;

    const client = <T>(data: T) =>
      axios.post(env.get("CALLBACK_URL")!, data, {
        headers: {
          Authorization: env.get("API_KEY")
            ? `Bearer ${env.get("API_KEY")}`
            : undefined,
        },
      });

    this.ev.on("connection", (data) => {
      client({
        data,
        event: "connection",
      }).catch(() => {});
    });

    this.ev.on("message", (data) => {
      client({
        data,
        event: "message",
      }).catch(() => {});
    });
  }
}

export default new Event();
