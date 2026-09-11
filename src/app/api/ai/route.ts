import { NextResponse } from "next/server";

/**
 * Gemini proxy. When GEMINI_API_KEY is absent it returns `{ fallback: true }`
 * and the client uses the local planner instead. Only the preference parser is
 * wired to Gemini here; drafting and booking search fall back to the local planner
 * until their prompts are tuned. Swap in richer prompts in ./prompts.ts later.
 */

export const runtime = "nodejs";

interface ParsePayload {
  text: string;
  memberName: string;
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  let body: { task: string; payload: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!key) return NextResponse.json({ fallback: true });

  try {
    if (body.task === "parse") {
      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({ apiKey: key });
      const { text, memberName } = body.payload as ParsePayload;
      const prompt = `You extract travel preferences from a group chat message into JSON.
Message from ${memberName}: """${text}"""
Return ONLY JSON with optional keys: destination (string), surpriseMe (bool), origin (one of nyc,sfo,lax,ord,bos,sea,aus,den,atl,mia,yyz,lhr), month (lowercase english), startDate, endDate (YYYY-MM-DD), flexibleDates, nights (int), budgetPerPerson (USD int), pace (slow|balanced|packed), interests (array from: food,beach,nature,culture,art,nightlife,adventure,history,wellness,romantic,luxury,budget,city), climate (warm|cold|mild), mustHaves (string[]), dealBreakers (string[]), reply (one warm sentence acknowledging what you captured, under 30 words).`;
      const res = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      const parsed = JSON.parse(res.text ?? "{}") as Record<string, unknown> & { reply?: string };
      const { reply, ...prefs } = parsed;
      return NextResponse.json({ result: { prefs, reply: reply ?? "Got it — added to the group's preferences." } });
    }
    // Draft + bookings use the local planner for now.
    return NextResponse.json({ fallback: true });
  } catch (err) {
    console.error("[ai] gemini failed, falling back", err);
    return NextResponse.json({ fallback: true });
  }
}
