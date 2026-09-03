import { Role } from "@/types";

type Listener = () => void;

let accessToken: string | null = null;
let role: Role | null = null;
const listeners = new Set<Listener>();

export const tokenStore = {
  get: () => accessToken,
  getRole: () => role,
  set: (token: string, r: Role) => {
    accessToken = token;
    role = r;
    listeners.forEach((l) => l());
  },
  clear: () => {
    accessToken = null;
    role = null;
    listeners.forEach((l) => l());
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
