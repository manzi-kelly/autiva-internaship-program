import { io, Socket } from "socket.io-client";
import { env } from "./env";

let socket: Socket | null = null;

export function getStudentSocket() {
  if (!socket) {
    socket = io(env.API_BASE_URL, {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
