import { readdirSync } from "node:fs";
import env from "../utils/env";
import WhatsappInstance from "../utils/whatsapp";

class Whatsapp {
  private instances: Map<string, WhatsappInstance> = new Map();

  async resurrect() {
    const instances = readdirSync(env.get("AUTH_PATH", "./auth"));

    instances.forEach((id) => {
      this.add(id);
    });
  }

  async add(id: string) {
    const instance = new WhatsappInstance(id);
    await instance.start();

    this.instances.set(id, instance);

    return instance;
  }

  get(id: string) {
    return this.instances.get(id);
  }
}

export default new Whatsapp();
