import type { AIProvider, DraftResult } from "./provider";
import { aiReplyFor, generateDraftMock, parsePreferencesMock, searchBookingsMock } from "./mock";
import type { StructuredPrefs } from "../types";

/**
 * Client-side AI facade.
 *
 * Every call goes to `/api/ai`, where Gemini does the work when GEMINI_API_KEY is
 * set. If the key is missing or Gemini fails, we fall back to the local heuristic
 * planner so the product keeps working.
 */

let geminiAvailable: boolean | null = null;

async function callApi<T>(task: string, payload: unknown): Promise<T | null> {
  if (geminiAvailable === false) return null;
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task, payload }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { fallback?: boolean; result?: T };
    if (json.fallback) {
      geminiAvailable = false;
      return null;
    }
    geminiAvailable = true;
    return json.result ?? null;
  } catch {
    return null;
  }
}

type DraftEvent = { type: "progress"; message: string } | { type: "result"; result: DraftResult } | { type: "fallback"; reason?: string };

/** Streams the draft task: progress lines arrive as Gemini works, then the result. */
async function streamDraft(payload: unknown, onProgress?: (m: string) => void): Promise<DraftResult | null> {
  if (geminiAvailable === false) return null;
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task: "draft", payload }),
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result: DraftResult | null = null;
    let fellBack = false;
    const handle = (line: string) => {
      if (!line.trim()) return;
      const ev = JSON.parse(line) as DraftEvent;
      if (ev.type === "progress") onProgress?.(ev.message);
      else if (ev.type === "result") result = ev.result;
      else if (ev.type === "fallback") fellBack = true;
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        handle(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 1);
      }
    }
    if (buffer.trim()) handle(buffer);
    if (fellBack) {
      geminiAvailable = null; // a one-off failure; try again next time
      return null;
    }
    if (result) geminiAvailable = true;
    return result;
  } catch {
    return null;
  }
}

export const ai: AIProvider = {
  get name() {
    return geminiAvailable ? "Gemini" : "Local planner";
  },

  async parsePreferences(text, memberName) {
    const remote = await callApi<{ prefs: StructuredPrefs; reply: string }>("parse", { text, memberName });
    if (remote) return remote;
    // Small delay so the assistant feels like it's thinking.
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    const prefs = parsePreferencesMock(text);
    return { prefs, reply: aiReplyFor(prefs, memberName) };
  },

  async generateDraft(trip, inputs, members, onProgress) {
    const remote = await streamDraft({ trip, inputs, members }, onProgress);
    if (remote) return remote;
    onProgress?.("Gemini unavailable — using the local planner…");
    return generateDraftMock(trip, inputs, members, onProgress);
  },

  async searchBookings(trip, items, memberCount, onProgress) {
    // Booking search stays local: it produces real, pre-filled provider search links.
    return searchBookingsMock(trip, items, memberCount, onProgress);
  },
};

export { mergePrefs } from "./mock";
