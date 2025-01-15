import Server from "../modules/server";
import whatsapp from "../modules/whatsapp";
import env from "../utils/env";

export default async function run({ config }: { config?: string }) {
  if (config) {
    await env.loadFromJson(config);
  } else {
    env.load();
  }

  whatsapp.resurrect().then(() => {
    Server.serve();
  });
}
