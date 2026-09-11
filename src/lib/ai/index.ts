import type { AIProvider } from "./provider";
import { aiReplyFor, generateDraftMock, parsePreferencesMock, searchBookingsMock } from "./mock";
import type { StructuredPrefs } from "../types";

/**
 * Client-side AI facade.
 *
 * Every call first tries `/api/ai`, which uses Gemini when GEMINI_API_KEY is set.
 * When the key is missing (or the call fails) we fall back to the local heuristic
 * planner so the whole product works with zero configuration.
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
    onProgress?.("Warming up the planner…");
    const remote = await callApi<Awaited<ReturnType<typeof generateDraftMock>>>("draft", { trip, inputs, members });
    if (remote) return remote;
    return generateDraftMock(trip, inputs, members, onProgress);
  },

  async searchBookings(trip, items, memberCount, onProgress) {
    // Booking search is always local: it produces real, pre-filled provider search links.
    return searchBookingsMock(trip, items, memberCount, onProgress);
  },
};

export { mergePrefs } from "./mock";
