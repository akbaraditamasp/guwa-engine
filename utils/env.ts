import type { GuwaEnv } from "../types/env";

class Env {
  private data!: GuwaEnv;

  load(data: GuwaEnv = process.env as unknown as GuwaEnv) {
    this.data = data;
  }

  async loadFromJson(path: string) {
    const file = Bun.file(path);

    if (await file.exists()) {
      this.data = JSON.parse(await file.text());
      return;
    }

    throw new Error("Config not found");
  }

  get<T extends keyof GuwaEnv>(key: T, defaultValue: GuwaEnv[T]): GuwaEnv[T];
  get<T extends keyof GuwaEnv>(
    key: T,
    defaultValue?: undefined
  ): GuwaEnv[T] | undefined;
  get<T extends keyof GuwaEnv>(
    key: T,
    defaultValue?: GuwaEnv[T]
  ): GuwaEnv[T] | undefined {
    if (!this.data[key]) return defaultValue;

    const stringValue = `${this.data[key]}`;
    const numberValue = Number(stringValue);
    const booleanValue =
      stringValue.toLowerCase() === "true"
        ? true
        : stringValue.toLowerCase() === "false"
        ? false
        : undefined;

    if (typeof booleanValue !== "undefined")
      return booleanValue as unknown as GuwaEnv[T];

    if (!isNaN(numberValue)) return numberValue as unknown as GuwaEnv[T];

    return stringValue as unknown as GuwaEnv[T];
  }
}

export default new Env();
