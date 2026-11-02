import Dexie, { type Table } from "dexie";

export type TopicStatus = "Not started" | "In progress" | "Complete";
export type Topic = { id: string; trackId: string; subject: string; title: string; status: TopicStatus; updatedAt: string; nextRevision?: string; note?: string };
export type OperationKind = "topic_created" | "status_changed" | "revision_scheduled" | "undo";
export type ProgressEvent = { operationId: string; trackId: string; entityId: string; kind: OperationKind; createdAt: string; before: Topic | null; after: Topic | null; undoneBy?: string };
export type OutboxItem = { operationId: string; trackId: string; createdAt: string; state: "pending"; event: ProgressEvent };

class SyllaDatabase extends Dexie {
  topics!: Table<Topic, string>;
  progressEvents!: Table<ProgressEvent, string>;
  syncOutbox!: Table<OutboxItem, string>;
  constructor() {
    super("syllakeep-prototype");
    this.version(1).stores({ topics: "id, trackId, subject, status, nextRevision" });
    this.version(2).stores({
      topics: "id, trackId, subject, status, nextRevision",
      progressEvents: "operationId, trackId, entityId, createdAt, kind, undoneBy",
      syncOutbox: "operationId, trackId, createdAt, state"
    });
  }
}
export const db = new SyllaDatabase();
const makeOperationId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

export async function recordTopicOperation(before: Topic | null, after: Topic | null, kind: OperationKind) {
  if (!before && !after) throw new Error("A progress operation must include a topic snapshot.");
  const topic = after ?? before!;
  const operationId = makeOperationId();
  const createdAt = new Date().toISOString();
  const event: ProgressEvent = { operationId, trackId: topic.trackId, entityId: topic.id, kind, createdAt, before, after };
  const outbox: OutboxItem = { operationId, trackId: topic.trackId, createdAt, state: "pending", event };
  await db.transaction("rw", db.topics, db.progressEvents, db.syncOutbox, async () => {
    if (after) await db.topics.put(after); else await db.topics.delete(topic.id);
    await db.progressEvents.add(event);
    await db.syncOutbox.add(outbox);
  });
  return event;
}

export async function getLedgerStatus() {
  const [pending, events] = await Promise.all([db.syncOutbox.count(), db.progressEvents.toArray()]);
  const latestUndoable = events.filter((event) => event.kind !== "undo" && !event.undoneBy).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  return { pending, canUndo: Boolean(latestUndoable) };
}

export async function undoLatestOperation() {
  return db.transaction("rw", db.topics, db.progressEvents, db.syncOutbox, async () => {
    const events = await db.progressEvents.toArray();
    const original = events.filter((event) => event.kind !== "undo" && !event.undoneBy).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!original) return null;
    const undoId = makeOperationId();
    const createdAt = new Date().toISOString();
    const restored = original.before;
    if (restored) await db.topics.put(restored); else await db.topics.delete(original.entityId);
    const event: ProgressEvent = { operationId: undoId, trackId: original.trackId, entityId: original.entityId, kind: "undo", createdAt, before: original.after, after: restored };
    await db.progressEvents.put({ ...original, undoneBy: undoId });
    await db.progressEvents.add(event);
    await db.syncOutbox.add({ operationId: undoId, trackId: original.trackId, createdAt, state: "pending", event });
    return { topicId: original.entityId, restoredTopic: restored };
  });
}
