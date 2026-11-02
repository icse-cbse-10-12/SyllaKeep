import "fake-indexeddb/auto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, getLedgerStatus, recordTopicOperation, undoLatestOperation, type Topic } from "./offline-ledger";

const topic = (overrides: Partial<Topic> = {}): Topic => ({ id: "physics-1", trackId: "school-isc-11", subject: "Physics", title: "Motion", status: "Not started", updatedAt: "2026-11-02", ...overrides });

beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterAll(async () => { await db.delete(); });

describe("offline progress ledger", () => {
  it("stores topic changes, immutable events and an outbox item atomically", async () => {
    const initial = topic();
    const updated = topic({ status: "In progress" });
    const event = await recordTopicOperation(initial, updated, "status_changed");
    expect((await db.topics.get(initial.id))?.status).toBe("In progress");
    expect(await db.progressEvents.get(event.operationId)).toMatchObject({ operationId: event.operationId, before: initial, after: updated });
    expect(await db.syncOutbox.get(event.operationId)).toMatchObject({ operationId: event.operationId, state: "pending" });
  });

  it("uses monotonic sequence numbers when multiple operations share a timestamp", async () => {
    const first = topic();
    const second = topic({ status: "In progress" });
    const one = await recordTopicOperation(first, second, "status_changed");
    const third = topic({ status: "Complete" });
    const two = await recordTopicOperation(second, third, "status_changed");
    expect(two.createdAt).toBe(one.createdAt);
    expect(two.sequence).toBeGreaterThan(one.sequence);
    await undoLatestOperation();
    expect((await db.topics.get(first.id))?.status).toBe("In progress");
  });

  it("undoes a creation without deleting its audit history", async () => {
    const created = topic();
    const operation = await recordTopicOperation(null, created, "topic_created");
    const undone = await undoLatestOperation();
    expect(undone?.topicId).toBe(created.id);
    expect(await db.topics.get(created.id)).toBeUndefined();
    expect((await db.progressEvents.get(operation.operationId))?.undoneBy).toBeTruthy();
    expect(await db.progressEvents.count()).toBe(2);
    expect(await db.syncOutbox.count()).toBe(2);
  });

  it("rejects empty operations without writing data", async () => {
    await expect(recordTopicOperation(null, null, "undo")).rejects.toThrow("must include a topic snapshot");
    expect(await db.progressEvents.count()).toBe(0);
    expect(await db.syncOutbox.count()).toBe(0);
  });

  it("reports only locally queued work and available undo", async () => {
    expect(await getLedgerStatus()).toEqual({ pending: 0, canUndo: false });
    await recordTopicOperation(null, topic(), "topic_created");
    expect(await getLedgerStatus()).toEqual({ pending: 1, canUndo: true });
  });
});
