import { PriorityQueue } from '@/systems/tasks/PriorityQueue';
 
export type BotTask = {
    id: string;
    key: string;
    type: string;
    roomName: string;
    priority: number;
    created: number;
    updated: number;
    expireAt?: number;
    claimBy?: string;
    claimUntil?: number;
    attempts?: number;
    cooldownUntil?: number;
    [key: string]: any;
};
 
function ensureTaskQueue(roomName: string): BotTask[] {
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
    const r: any = Memory.rooms[roomName];
    if (!Array.isArray(r.taskQueue)) r.taskQueue = [];
    return r.taskQueue as BotTask[];
}
 
function makeKey(roomName: string, type: string, details?: Record<string, any>): string {
    const d = details || {};
    const target = d.targetId || d.id || '';
    const from = d.from || '';
    const to = d.to || '';
    const res = d.resourceType || d.resource || '';
    const index = d.workLoc !== undefined ? String(d.workLoc) : '';
    return `${roomName}:${type}:${target}:${from}:${to}:${res}:${index}`;
}
 
function generateId(): string {
    return `${Game.time.toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}
 
export const TaskSystem = {
    run(): void {
        for (const roomName of Object.keys(Memory.rooms || {})) {
            const queue = ensureTaskQueue(roomName);
            for (let i = queue.length - 1; i >= 0; i--) {
                const t = queue[i];
                if (!t || !t.type || !t.id) {
                    queue.splice(i, 1);
                    continue;
                }
                if (t.expireAt && t.expireAt <= Game.time) {
                    queue.splice(i, 1);
                    continue;
                }
                if (t.claimUntil && t.claimUntil <= Game.time) {
                    delete t.claimBy;
                    delete t.claimUntil;
                }
            }
        }
    },
 
    upsert(roomName: string, type: string, priority: number, details?: Record<string, any>): BotTask {
        const queue = ensureTaskQueue(roomName);
        const key = makeKey(roomName, type, details);
        const now = Game.time;
 
        const existing = queue.find(t => t && t.key === key);
        if (existing) {
            existing.priority = Math.max(existing.priority || 0, priority);
            existing.updated = now;
            if (details) Object.assign(existing, details);
            return existing;
        }
 
        const task: BotTask = {
            id: generateId(),
            key,
            type,
            roomName,
            priority,
            created: now,
            updated: now,
            ...(details || {})
        };
        queue.push(task);
        return task;
    },
 
    claim(roomName: string, creepName: string, filter: (t: BotTask) => boolean, leaseTicks = 10): BotTask | undefined {
        const queue = ensureTaskQueue(roomName);
        const now = Game.time;
 
        const pq = new PriorityQueue<BotTask>((a, b) => (b.priority - a.priority) || (a.created - b.created));
        for (const t of queue) {
            if (!t) continue;
            if (t.cooldownUntil && t.cooldownUntil > now) continue;
            if (t.claimUntil && t.claimUntil > now && t.claimBy !== creepName) continue;
            if (!filter(t)) continue;
            pq.push(t);
        }
 
        const task = pq.pop();
        if (!task) return undefined;
        task.claimBy = creepName;
        task.claimUntil = now + leaseTicks;
        task.updated = now;
        return task;
    },
 
    complete(roomName: string, taskId: string): void {
        const queue = ensureTaskQueue(roomName);
        const idx = queue.findIndex(t => t && t.id === taskId);
        if (idx >= 0) queue.splice(idx, 1);
    },
 
    fail(roomName: string, taskId: string, cooldownTicks = 10): void {
        const queue = ensureTaskQueue(roomName);
        const t = queue.find(x => x && x.id === taskId);
        if (!t) return;
        t.attempts = (t.attempts || 0) + 1;
        t.cooldownUntil = Game.time + cooldownTicks;
        delete t.claimBy;
        delete t.claimUntil;
        t.updated = Game.time;
    },
 
    list(roomName: string): BotTask[] {
        return ensureTaskQueue(roomName);
    }
};

