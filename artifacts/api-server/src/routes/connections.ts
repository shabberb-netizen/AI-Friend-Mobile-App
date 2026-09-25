import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, aiFriendConnectionsTable } from "@workspace/db";
import {
  ListSocialConnectionsResponse,
  UpdateSocialConnectionBody,
  UpdateSocialConnectionResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
const providers = {
  facebook: {
    displayName: "Facebook",
    description: "Use approved Meta Graph APIs for your profile and Pages you authorize.",
    readCapabilities: ["Basic profile details", "Approved Page activity"],
    sendCapabilities: ["Messages through approved Page integrations"],
    scopes: ["facebook_basic_profile", "facebook_page_messaging"],
  },
  messenger: {
    displayName: "Messenger",
    description: "Connect a Messenger conversation through an approved Meta messaging integration.",
    readCapabilities: ["Messages in the connected conversation"],
    sendCapabilities: ["Replies to that connected conversation"],
    scopes: ["messenger_conversation_read", "messenger_conversation_send"],
  },
  telegram: {
    displayName: "Telegram",
    description: "Connect a Telegram bot chat; AI Friend never receives your other Telegram chats.",
    readCapabilities: ["Messages sent to the connected bot chat"],
    sendCapabilities: ["Replies to the connected bot chat"],
    scopes: ["telegram_bot_chat_read", "telegram_bot_chat_send"],
  },
  instagram: {
    displayName: "Instagram",
    description: "Use approved Instagram APIs for the account and conversations you authorize.",
    readCapabilities: ["Basic profile and approved media", "Messages in an approved conversation"],
    sendCapabilities: ["Replies through the approved Instagram Messaging API"],
    scopes: ["instagram_basic_profile", "instagram_messaging"],
  },
} as const;

type Provider = keyof typeof providers;

function isProvider(value: string): value is Provider {
  return value in providers;
}

async function listForUser(userId: string) {
  const rows = await db
    .select()
    .from(aiFriendConnectionsTable)
    .where(eq(aiFriendConnectionsTable.userId, userId));
  const connected = new Map(rows.map((row) => [row.provider, row]));
  return Object.entries(providers).map(([provider, details]) => {
    const record = connected.get(provider);
    return {
      provider,
      ...details,
      connected: record?.enabled ?? false,
      authorizedAt: record?.authorizedAt?.toISOString() ?? null,
    };
  });
}

router.get("/connections", requireAuth, async (_req, res): Promise<void> => {
  const userId = res.locals.userId as string;
  res.json(ListSocialConnectionsResponse.parse(await listForUser(userId)));
});

router.post("/connections/:provider/consent", requireAuth, async (req, res): Promise<void> => {
  const providerValue = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
  if (!isProvider(providerValue)) {
    res.status(404).json({ error: "That connection is not supported." });
    return;
  }
  const parsed = UpdateSocialConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose whether to allow this connection." });
    return;
  }

  const userId = res.locals.userId as string;
  const details = providers[providerValue];
  const now = new Date();
  await db
    .insert(aiFriendConnectionsTable)
    .values({
      userId,
      provider: providerValue,
      enabled: parsed.data.enabled,
      grantedScopes: parsed.data.enabled ? [...details.scopes] : [],
      authorizedAt: parsed.data.enabled ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [aiFriendConnectionsTable.userId, aiFriendConnectionsTable.provider],
      set: {
        enabled: parsed.data.enabled,
        grantedScopes: parsed.data.enabled ? [...details.scopes] : [],
        authorizedAt: parsed.data.enabled ? now : null,
        updatedAt: now,
      },
    });

  const connection = (await listForUser(userId)).find((item) => item.provider === providerValue);
  res.json(UpdateSocialConnectionResponse.parse(connection));
});

router.delete("/connections/:provider", requireAuth, async (req, res): Promise<void> => {
  const providerValue = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
  if (!isProvider(providerValue)) {
    res.status(404).json({ error: "That connection is not supported." });
    return;
  }
  await db
    .delete(aiFriendConnectionsTable)
    .where(
      and(
        eq(aiFriendConnectionsTable.userId, res.locals.userId as string),
        eq(aiFriendConnectionsTable.provider, providerValue),
      ),
    );
  res.sendStatus(204);
});

export default router;