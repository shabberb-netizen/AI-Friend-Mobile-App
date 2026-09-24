import { Router, type IRouter } from "express";
import { GenerateAiAssetBody } from "@workspace/api-zod";
import {
  AiProviderError,
  generateAsset,
  streamChat,
  type AiMessage,
} from "../lib/ai";

const router: IRouter = Router();

function isChatBody(value: unknown): value is { messages: AiMessage[] } {
  if (!value || typeof value !== "object" || !Array.isArray((value as { messages?: unknown }).messages)) return false;
  const messages = (value as { messages: unknown[] }).messages;
  return messages.length > 0 && messages.length <= 40 && messages.every((message) => {
    if (!message || typeof message !== "object") return false;
    const candidate = message as { role?: unknown; content?: unknown };
    return (
      (candidate.role === "user" || candidate.role === "assistant") &&
      typeof candidate.content === "string" &&
      candidate.content.trim().length > 0 &&
      candidate.content.length <= 4000
    );
  });
}

router.post("/ai/chat", async (req, res) => {
  if (!isChatBody(req.body)) {
    res.status(400).json({ error: "Please send a valid chat history." });
    return;
  }

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    await streamChat(req.body.messages, (content) => {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    const providerError = error instanceof AiProviderError ? error : new AiProviderError("Online AI could not answer.");
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: providerError.message })}\n\n`);
      res.end();
      return;
    }
    res.status(providerError.code === "unavailable" ? 503 : 502).json({ error: providerError.message });
  }
});

router.post("/ai/generate", async (req, res) => {
  const result = GenerateAiAssetBody.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Please include a type and describe what you want to make." });
    return;
  }
  try {
    const asset = await generateAsset(result.data.type, result.data.prompt, result.data.action);
    res.json(asset);
  } catch (error) {
    const providerError = error instanceof AiProviderError ? error : new AiProviderError("Online generation failed.");
    res.status(providerError.code === "unavailable" ? 503 : 502).json({ error: providerError.message });
  }
});

export default router;