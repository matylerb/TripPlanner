import { NextResponse } from "next/server";
import { draftWithGemini, geminiConfigured, parseWithGemini } from "@/lib/ai/gemini";
import type { Member, PreferenceInput, Trip } from "@/lib/types";

/**
 * Gemini agent endpoint.
 *
 *   POST { task: "parse", payload: { text, memberName } }   -> JSON { result } | { fallback: true }
 *   POST { task: "draft", payload: { trip, inputs, members } } -> NDJSON stream of
 *        { type: "progress", message } lines, ending with { type: "result", result }
 *        or { type: "fallback" } when Gemini is unavailable or fails.
 *
 * When GEMINI_API_KEY is absent every task answers with a fallback and the client
 * uses the local planner, so the app still works with no configuration.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

interface ParsePayload {
  text: string;
  memberName: string;
}
interface DraftPayload {
  trip: Trip;
  inputs: PreferenceInput[];
  members: Member[];
}

export async function POST(req: Request) {
  let body: { task: string; payload: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (body.task === "draft") return streamDraft(body.payload as DraftPayload);

  if (!geminiConfigured()) return NextResponse.json({ fallback: true });

  try {
    if (body.task === "parse") {
      const { text, memberName } = body.payload as ParsePayload;
      const result = await parseWithGemini(text, memberName);
      return NextResponse.json({ result });
    }
    return NextResponse.json({ fallback: true });
  } catch (err) {
    console.error("[ai] gemini failed, falling back", err);
    return NextResponse.json({ fallback: true });
  }
}

function streamDraft(payload: DraftPayload) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      if (!geminiConfigured()) {
        send({ type: "fallback", reason: "no key" });
        controller.close();
        return;
      }
      try {
        const result = await draftWithGemini(payload.trip, payload.inputs, payload.members, (message) => send({ type: "progress", message }));
        send({ type: "result", result });
      } catch (err) {
        console.error("[ai] gemini draft failed, falling back", err);
        send({ type: "fallback", reason: err instanceof Error ? err.message : "unknown" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
