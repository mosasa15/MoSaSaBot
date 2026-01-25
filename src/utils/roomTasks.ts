export type RoomTask =
    | { type: 'fillExtension' }
    | { type: 'fillTower'; id?: Id<StructureTower> }
    | { type: 'transferToUpgradeLink' }
    | { type: 'transferToStorage' }
    | { type: string; [key: string]: any };

export function ensureRoomTasks(roomName: string): RoomTask[] {
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
    if (!Memory.rooms[roomName].tasks) Memory.rooms[roomName].tasks = [];
    return Memory.rooms[roomName].tasks as RoomTask[];
}

export function pushRoomTask(roomName: string, task: RoomTask): void {
    const tasks = ensureRoomTasks(roomName);
    const exists = tasks.some((t: any) => {
        if (!t || t.type !== task.type) return false;
        if ((t as any).id !== undefined || (task as any).id !== undefined) return (t as any).id === (task as any).id;
        return true;
    });
    if (!exists) tasks.push(task);
}

export function removeRoomTasks(roomName: string, predicate: (t: RoomTask) => boolean): void {
    const tasks = ensureRoomTasks(roomName);
    Memory.rooms[roomName].tasks = tasks.filter((t: any) => !predicate(t));
}
