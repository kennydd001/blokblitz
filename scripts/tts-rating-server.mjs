import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const port = Number.parseInt(process.env.TTS_RATING_PORT ?? "5391", 10) || 5391;
const outDir = path.resolve(".qa-artifacts", "tts-ratings");
const latestFile = path.join(outDir, "latest.json");

function send(response, status, body, contentType = "application/json") {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": contentType
  });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    send(response, 204, "");
    return;
  }

  try {
    if (request.method === "POST" && request.url === "/ratings") {
      const body = await readBody(request);
      const payload = JSON.parse(body);
      await mkdir(outDir, { recursive: true });
      await writeFile(latestFile, JSON.stringify({ ...payload, savedAt: new Date().toISOString() }, null, 2));
      send(response, 200, JSON.stringify({ ok: true, file: latestFile }));
      return;
    }

    if (request.method === "GET" && request.url === "/ratings") {
      const body = await readFile(latestFile, "utf8").catch(() => null);
      if (!body) {
        send(response, 404, JSON.stringify({ ok: false, error: "No ratings saved yet." }));
        return;
      }
      send(response, 200, body);
      return;
    }

    send(response, 404, JSON.stringify({ ok: false, error: "Not found." }));
  } catch (error) {
    send(response, 500, JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TTS rating server listening on http://127.0.0.1:${port}`);
  console.log(`Writing latest ratings to ${latestFile}`);
});
