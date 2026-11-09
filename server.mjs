// Optional local server: serves the quiz and privately forwards handwritten-work images
// to an AI vision endpoint. Keep OPENAI_API_KEY in your environment, never in app.js.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 11_000_000) request.destroy();
    });
    request.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON body")); } });
    request.on("error", reject);
  });
}

async function gradeWork(payload) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const prompt = `You are a careful Math 1 teaching assistant. Review the student's handwritten solution image for the question below. Compare the algebra and calculus steps to the supplied correct answer and solution. Be forgiving of handwriting. State whether the final result is correct, identify the first incorrect line or transformation if there is one, then give a short correction. Do not invent text you cannot read; say so clearly. Use concise English.\n\nQuestion: ${payload.question}\nExpected answer: ${payload.expectedAnswer}\nOfficial reasoning: ${payload.explanation}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || "gpt-6-astra", store: false, input: [{ role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: payload.image, detail: "high" }] }] })
  });
  if (!response.ok) throw new Error(`Vision request failed (${response.status})`);
  const data = await response.json();
  const feedback = data.output_text || data.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text).join("\n");
  if (!feedback) throw new Error("No feedback returned by the vision endpoint");
  return feedback;
}

createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/check-work") {
      const payload = await readJson(request);
      const feedback = await gradeWork(payload);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ feedback }));
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405); response.end(); return; }
    const requested = request.url === "/" ? "index.html" : request.url.split("?")[0].replace(/^\//, "");
    const file = normalize(join(root, requested));
    if (!file.startsWith(normalize(root))) { response.writeHead(403); response.end(); return; }
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    if (request.method === "HEAD") response.end(); else response.end(content);
  } catch (error) {
    response.writeHead(request.url === "/api/check-work" ? 503 : 404, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
}).listen(port, () => console.log(`Math 1 Midterm Lab is running at http://localhost:${port}`));
