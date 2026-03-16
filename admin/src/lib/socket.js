import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket;

export function getAdminSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
