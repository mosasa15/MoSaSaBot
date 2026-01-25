import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
 
type BotStats = {
    tick: number;
    cpuUsed: number;
    bucket: number;
    cpuTier: string;
    rooms: Record<string, any>;
};
 
function ensureStats(): any {
    if (!Memory.stats) Memory.stats = {};
    if (!(Memory.stats as any).bot) (Memory.stats as any).bot = {};
    return (Memory.stats as any).bot;
}
 
export const MetricsSystem = {
    run(): void {
        if (Memory.settings && Memory.settings.systems && Memory.settings.systems.metrics === false) return;
        const start = (globalThis as any).__tickStartCpu;
        const cpuUsed = Game.cpu.getUsed() - (typeof start === 'number' ? start : 0);
        const bot: BotStats = ensureStats();
 
        bot.tick = Game.time;
        bot.cpuUsed = Number(cpuUsed.toFixed(2));
        bot.bucket = Game.cpu.bucket;
        bot.cpuTier = String((globalThis as any).cpuTier || 'normal');
        bot.rooms = bot.rooms || {};
 
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
            const state = RoomStateSystem.get(roomName);
            if (!state) continue;
            bot.rooms[roomName] = {
                rcl: state.rcl,
                energy: state.energyAvailable,
                cap: state.energyCapacity,
                stored: state.storedEnergy,
                threat: state.hostileThreat,
                sites: state.constructionSites
            };
        }
    }
};
