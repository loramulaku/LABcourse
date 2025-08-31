// src/utils/jwt.js
import { getAccessToken } from "../api";

export function getUserFromToken() {
  const t = getAccessToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    // prishet nëse payload s’i ka këto fusha – rregullo sipas backend-it tënd
    return { name: payload.name || "", email: payload.email || "", id: payload.id };
  } catch {
    return null;
  }
}
