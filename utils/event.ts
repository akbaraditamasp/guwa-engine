import EventEmitter from "node:events";
import type { EventType } from "../types/event";

export default class GuwaEvent extends EventEmitter {
  emit<K extends keyof EventType>(eventName: K, data: EventType[K]) {
    return super.emit(eventName, data);
  }

  on<K extends keyof EventType>(
    eventName: K,
    listener: (data: EventType[K]) => void
  ) {
    return super.on(eventName, listener);
  }
}
