import { randomUUID } from "node:crypto";

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiAssetType = "image" | "story" | "video";

export type GeneratedAsset = {
  id: string;
  type: AiAssetType;
  title: string;
  prompt: string;
  uri?: string;
  text?: string;
  mimeType?: string;
  status: "complete" | "queued";
  provider: string;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "request_failed" | "invalid_response" = "request_failed",
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function openAiConfig() {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new AiProviderError(
      "Online AI is not configured. Switch to Offline mode or provision the Replit-managed AI integration.",
      "unavailable",
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseProviderError(response: Response) {
  const body = await response.text().catch(() => "");
  let detail = "";
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    detail = parsed.error?.message ?? "";
  } catch {
    detail = body.slice(0, 180);
  }
  return detail || `Provider returned HTTP ${response.status}.`;
}

async function openAiRequest(path: string, body: unknown) {
  const { baseUrl, apiKey } = openAiConfig();
  const response = await fetch(endpoint(baseUrl, path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new AiProviderError(await parseProviderError(response));
  }
  return response;
}

export async function streamChat(
  messages: AiMessage[],
  onContent: (content: string) => void,
) {
  const response = await openAiRequest("/chat/completions", {
    model: process.env.AI_INTEGRATIONS_OPENAI_CHAT_MODEL ?? "gpt-5.6-terra",
    messages: [
      {
        role: "system",
        content:
          "You are AI Friend, a warm, concise companion. Be practical, kind, and never claim to be human. Keep replies under 180 words unless the user asks for detail.",
      },
      ...messages,
    ],
    stream: true,
    max_completion_tokens: 8192,
  });

  const reader = response.body?.getReader();
  if (!reader) throw new AiProviderError("Online AI returned no response stream.", "invalid_response");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onContent(content);
        }
      } catch {
        // Provider chunks are allowed to contain comments or partial JSON.
      }
    }
  }

  return fullResponse;
}

async function generateStory(prompt: string): Promise<GeneratedAsset> {
  const response = await openAiRequest("/chat/completions", {
    model: process.env.AI_INTEGRATIONS_OPENAI_CHAT_MODEL ?? "gpt-5.6-terra",
    messages: [
      {
        role: "system",
        content:
          "Write a short, vivid story for a personal creative app. Use a title on the first line, then 3 to 5 short paragraphs. Keep it under 500 words.",
      },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 8192,
  });
  const parsed = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = parsed.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiProviderError("Online AI returned an empty story.", "invalid_response");
  const title = text.split("\n").find(Boolean)?.replace(/^#+\s*/, "")?.slice(0, 80) ?? "A new story";
  return {
    id: randomUUID(),
    type: "story",
    title,
    prompt,
    text,
    status: "complete",
    provider: "Replit AI · OpenAI",
  };
}

async function generateImage(prompt: string, action?: string): Promise<GeneratedAsset> {
  const fullPrompt = action
    ? `${action}. Preserve the subject's identity and proportions. ${prompt}`
    : prompt;
  const response = await openAiRequest("/images/generations", {
    model: "gpt-image-1",
    prompt: fullPrompt,
    size: "1024x1024",
  });
  const parsed = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const image = parsed.data?.[0];
  if (!image?.b64_json && !image?.url) {
    throw new AiProviderError("Online AI returned no image.", "invalid_response");
  }
  return {
    id: randomUUID(),
    type: "image",
    title: action ?? "New image",
    prompt,
    uri: image.url ?? `data:image/png;base64,${image.b64_json}`,
    mimeType: "image/png",
    status: "complete",
    provider: "Replit AI · OpenAI",
  };
}

async function submitVideo(prompt: string): Promise<GeneratedAsset> {
  const baseUrl = process.env.AI_INTEGRATIONS_VIDEO_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_VIDEO_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new AiProviderError(
      "10-second video generation needs a video provider connection. Image and story generation are still available online.",
      "unavailable",
    );
  }
  const response = await fetch(endpoint(baseUrl.replace(/\/+$/, ""), "/videos"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.AI_INTEGRATIONS_VIDEO_MODEL ?? "video-generation",
      prompt,
      duration: 10,
    }),
  });
  if (!response.ok) throw new AiProviderError(await parseProviderError(response));
  const parsed = (await response.json()) as {
    id?: string;
    url?: string;
    video_url?: string;
    status?: string;
  };
  if (!parsed.id && !parsed.url && !parsed.video_url) {
    throw new AiProviderError("Video provider returned no job identifier.", "invalid_response");
  }
  return {
    id: parsed.id ?? randomUUID(),
    type: "video",
    title: "10-second video",
    prompt,
    uri: parsed.url ?? parsed.video_url,
    status: parsed.url || parsed.video_url ? "complete" : "queued",
    provider: "Connected video provider",
  };
}

export async function generateAsset(type: AiAssetType, prompt: string, action?: string) {
  if (type === "story") return generateStory(prompt);
  if (type === "image") return generateImage(prompt, action);
  return submitVideo(prompt);
}