import Dexie, { type Table } from "dexie";

export type TopicStatus = "Not started" | "In progress" | "Complete";
export type Topic = { id: string; trackId: string; subject: string; title: string; status: TopicStatus; updatedAt: string; nextRevision?: string; note?: string };
export type OperationKind = "topic_created" | "status_changed" | "revision_scheduled" | "undo";
export type ProgressEvent = { operationId: string; sequence: number; trackId: string; entityId: string; kind: OperationKind; createdAt: string; before: Topic | null; after: Topic | null; undoneBy?: string };
export type OutboxItem = { operationId: string; sequence: number; trackId: string; createdAt: string; state: "pending"; event: ProgressEvent };
type LedgerMeta = { key: string; value: number };

class SyllaDatabase extends Dexie {
  topics!: Table<Topic, string>;
  progressEvents!: Table<ProgressEvent, string>;
  syncOutbox!: Table<OutboxItem, string>;
  ledgerMeta!: Table<LedgerMeta, string>;
  constructor() {
    super("syllakeep-prototype");
    this.version(1).stores({ topics: "id, trackId, subject, status, nextRevision" });
    this.version(2).stores({ topics: "id, trackId, subject, status, nextRevision", progressEvents: "operationId, trackId, entityId, createdAt, kind, undoneBy", syncOutbox: "operationId, trackId, createdAt, state" });
    this.version(3).stores({ topics: "id, trackId, subject, status, nextRevision", progressEvents: "operationId, sequence, trackId, entityId, createdAt, kind, undoneBy", syncOutbox: "operationId, sequence, trackId, createdAt, state", ledgerMeta: "key" }).upgrade(async (tx) => {
      const events = await tx.table("progressEvents").orderBy("createdAt").toArray();
      let sequence = 0;
      for (const event of events) {
        sequence += 1;
        await tx.table("progressEvents").update(event.operationId, { sequence });
        await tx.table("syncOutbox").update(event.operationId, { sequence });
      }
      await tx.table("ledgerMeta").put({ key: "sequence", value: sequence });
    });
  }
}
export const db = new SyllaDatabase();
const makeOperationId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
async function nextSequence() {
  const current = await db.ledgerMeta.get("sequence");
  const value = (current?.value ?? 0) + 1;
  await db.ledgerMeta.put({ key: "sequence", value });
  return value;
}

export async function recordTopicOperation(before: Topic | null, after: Topic | null, kind: OperationKind) {
  if (!before && !after) throw new Error("A progress operation must include a topic snapshot.");
  const topic = after ?? before!;
  const operationId = makeOperationId();
  const createdAt = new Date().toISOString();
  return db.transaction("rw", db.topics, db.progressEvents, db.syncOutbox, db.ledgerMeta, async () => {
    const sequence = await nextSequence();
    const event: ProgressEvent = { operationId, sequence, trackId: topic.trackId, entityId: topic.id, kind, createdAt, before, after };
    const outbox: OutboxItem = { operationId, sequence, trackId: topic.trackId, createdAt, state: "pending", event };
    if (after) await db.topics.put(after); else await db.topics.delete(topic.id);
    await db.progressEvents.add(event);
    await db.syncOutbox.add(outbox);
    return event;
  });
}

export async function getLedgerStatus() {
  const [pending, events] = await Promise.all([db.syncOutbox.count(), db.progressEvents.where("kind").notEqual("undo").toArray()]);
  return { pending, canUndo: events.some((event) => !event.undoneBy) };
}

export async function undoLatestOperation() {
  return db.transaction("rw", db.topics, db.progressEvents, db.syncOutbox, db.ledgerMeta, async () => {
    const events = await db.progressEvents.where("kind").notEqual("undo").toArray();
    const original = events.filter((event) => !event.undoneBy).sort((a, b) => b.sequence - a.sequence)[0];
    if (!original) return null;
    const undoId = makeOperationId();
    const createdAt = new Date().toISOString();
    const sequence = await nextSequence();
    const restored = original.before;
    if (restored) await db.topics.put(restored); else await db.topics.delete(original.entityId);
    const event: ProgressEvent = { operationId: undoId, sequence, trackId: original.trackId, entityId: original.entityId, kind: "undo", createdAt, before: original.after, after: restored };
    await db.progressEvents.put({ ...original, undoneBy: undoId });
    await db.progressEvents.add(event);
    await db.syncOutbox.add({ operationId: undoId, sequence, trackId: original.trackId, createdAt, state: "pending", event });
    return { topicId: original.entityId, restoredTopic: restored };
  });
}
