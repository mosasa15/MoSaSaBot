export const MEMORY_SCHEMA_VERSION = 1;
 
type AnyObj = Record<string, any>;
 
function ensureObject<T extends AnyObj>(value: any, fallback: T): T {
    if (value && typeof value === 'object') return value as T;
    return fallback;
}
 
function ensureArray<T>(value: any, fallback: T[]): T[] {
    if (Array.isArray(value)) return value as T[];
    return fallback;
}
 
export function migrateMemory(): void {
    const mem: any = Memory as any;
    const current = typeof mem.schemaVersion === 'number' ? mem.schemaVersion : 0;
 
    if (current >= MEMORY_SCHEMA_VERSION) {
        normalizeMemory();
        return;
    }
 
    if (current < 1) {
        mem.rooms = ensureObject(mem.rooms, {});
        mem.resourceSources = ensureObject(mem.resourceSources, {});
        mem.stats = ensureObject(mem.stats, {});
        mem.intel = ensureObject(mem.intel, {});
    }
 
    mem.schemaVersion = MEMORY_SCHEMA_VERSION;
    normalizeMemory();
}
 
function normalizeMemory(): void {
    const mem: any = Memory as any;
 
    mem.rooms = ensureObject(mem.rooms, {});
    mem.resourceSources = ensureObject(mem.resourceSources, {});
    mem.stats = ensureObject(mem.stats, {});
    mem.intel = ensureObject(mem.intel, {});
 
    for (const roomName of Object.keys(mem.rooms)) {
        const r = ensureObject<AnyObj>(mem.rooms[roomName], {} as AnyObj);
        r.tasks = ensureArray(r.tasks, []);
        r.spawnQueue = ensureArray(r.spawnQueue, []);
        r.remoteTasks = ensureObject(r.remoteTasks, {});
        mem.rooms[roomName] = r;
    }
}

