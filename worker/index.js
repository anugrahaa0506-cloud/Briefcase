const ALLOWED_ORIGIN = "https://anugrahaa0506-cloud.github.io";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
  "Vary": "Origin"
};

function respond(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function makePrompt(action, data) {
  if (action === "brief") return `You are the creative strategist inside Briefcase, a content workflow tool for writers and marketers.
Create a practical, specific content brief. Avoid generic advice. Do not invent product facts or research; mark missing information as a question or assumption.
Project: ${data.project}
Audience: ${data.audience}
Goal: ${data.goal}
Channel: ${data.channel}
Tone: ${data.tone || "Clear, useful and human"}
Raw notes: ${data.notes}
Return sections: project overview, audience insight, objective, core message, recommended angle, content structure, proof points or information needed, tone guidance, CTA, editorial checklist.`;
  if (action === "repurpose") return `You are a creative editor and content strategist.
Repurpose the source into the requested format, adapting structure to the platform. Preserve meaning and factual claims. Do not invent statistics, quotations, examples or results. Avoid clichés and filler.
Destination format: ${data.format}
Voice and constraints: ${data.voice || "Clear, useful and human"}
Source content:
${data.source}
Return a polished, ready-to-edit draft.`;
  if (action === "ideas") return `You are a creative strategist helping a writer move beyond obvious ideas.
Starting prompt: ${data.prompt}
Generate 7 distinct content concepts. For each include a short title, central angle, audience insight, suggested format and possible hook. Make concepts meaningfully different. Avoid generic tips/listicles unless there is an original angle.`;
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (origin && origin !== ALLOWED_ORIGIN) return respond({ error: "Origin not allowed." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST") return respond({ error: "Use POST." }, 405);
    if (!env.GEMINI_API_KEY || !env.APP_ACCESS_CODE) return respond({ error: "Server secrets are not configured." }, 500);
    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 20000) return respond({ error: "Request is too large." }, 413);

    try {
      const data = await request.json();
      if (data.accessCode !== env.APP_ACCESS_CODE) return respond({ error: "Incorrect access code." }, 401);
      if (!["brief", "repurpose", "ideas"].includes(data.action)) return respond({ error: "Unknown action." }, 400);
      const prompt = makePrompt(data.action, data);
      if (!prompt || prompt.length > 16000) return respond({ error: "Input is missing or too long." }, 413);

      const apiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1800 } })
      });
      const result = await apiResponse.json();
      if (!apiResponse.ok) return respond({ error: "AI provider error.", details: result.error?.message || "Please try again later." }, 502);
      const output = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
      if (!output) return respond({ error: "AI returned no text. Please try again." }, 502);
      return respond({ output });
    } catch {
      return respond({ error: "Invalid request or temporary server error." }, 400);
    }
  }
};