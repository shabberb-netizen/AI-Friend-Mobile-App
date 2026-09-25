import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, aiFriendSyncTable } from "@workspace/db";
import {
  GetSyncStateResponse,
  UpdateSyncStateBody,
  UpdateSyncStateResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/sync/state", requireAuth, async (req, res): Promise<void> => {
  const userId = res.locals.userId as string;
  const [record] = await db
    .select()
    .from(aiFriendSyncTable)
    .where(eq(aiFriendSyncTable.userId, userId))
    .limit(1);

  res.json(
    GetSyncStateResponse.parse({
      enabled: record?.enabled ?? false,
      updatedAt: record?.updatedAt?.toISOString() ?? null,
      state: record?.enabled ? record.snapshot : {},
    }),
  );
});

router.put("/sync/state", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateSyncStateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Send a valid sync preference and snapshot." });
    return;
  }

  const userId = res.locals.userId as string;
  const now = new Date();
  const nextSnapshot = parsed.data.clearCloudCopy ? {} : parsed.data.state ?? {};
  const [record] = await db
    .insert(aiFriendSyncTable)
    .values({
      userId,
      enabled: parsed.data.enabled,
      snapshot: parsed.data.enabled ? nextSnapshot : {},
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: aiFriendSyncTable.userId,
      set: {
        enabled: parsed.data.enabled,
        snapshot: parsed.data.enabled ? nextSnapshot : {},
        updatedAt: now,
      },
    })
    .returning();

  res.json(
    UpdateSyncStateResponse.parse({
      enabled: record.enabled,
      updatedAt: record.updatedAt.toISOString(),
      state: record.enabled ? record.snapshot : {},
    }),
  );
});

export default router;