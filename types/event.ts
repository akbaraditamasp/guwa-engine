export type EventType = {
  connection: {
    id: string;
    status: {
      connection: "CONNECTING" | "DISCONNECTED" | "CONNECTED";
      qr?: string;
    };
  };
  message: {
    id: string;
    from: string;
    text: string;
  };
};
