import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
import { TaskSystem } from '@/systems/tasks/TaskSystem';
 
export const ObservabilitySystem = {
    run(): void {
        if (Memory.settings && Memory.settings.systems && Memory.settings.systems.hud === false) return;
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
            this.drawRoomHUD(room);
        }
    },
 
    drawRoomHUD(room: Room): void {
        const state = RoomStateSystem.get(room.name);
        const econ = (Memory.rooms[room.name] as any).economy;
        const defense = (Memory.rooms[room.name] as any).defense;
        const spawnQueue = (Memory.rooms[room.name] as any).spawnQueue || [];
        const taskQueue = TaskSystem.list(room.name);
 
        const spawns = room.find(FIND_MY_SPAWNS);
        const anchor = spawns[0] ? spawns[0].pos : new RoomPosition(1, 1, room.name);
        const x = Math.min(48, anchor.x + 1);
        let y = Math.min(48, anchor.y - 1);
 
        const v = new RoomVisual(room.name);
        const tier = (global as any).cpuTier || 'normal';
        const bucket = Game.cpu.bucket;
 
        const stage = econ && econ.stage ? econ.stage : '?';
        const paused = econ && econ.pauseUpgrading === true ? 'pause' : 'run';
        const threat = defense && typeof defense.threat === 'number' ? defense.threat.toFixed(1) : '0';
        const e = state ? `${state.energyAvailable}/${state.energyCapacity}` : `${room.energyAvailable}/${room.energyCapacityAvailable}`;
 
        v.text(`CPU:${tier} B:${bucket} E:${e}`, x, y, { align: 'left', font: 0.5, opacity: 0.7, color: '#ffffff' });
        y += 0.6;
        v.text(`Econ:${stage} Upg:${paused} Thr:${threat}`, x, y, { align: 'left', font: 0.5, opacity: 0.7, color: '#ffffff' });
        y += 0.6;
        v.text(`Q spawn:${spawnQueue.length} task:${taskQueue.length}`, x, y, { align: 'left', font: 0.5, opacity: 0.7, color: '#ffffff' });
    }
};
