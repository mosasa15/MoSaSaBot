import market from '@/managers/market';
 
type DiplomacyMemory = {
    allies: string[];
    enemies: string[];
    self?: string;
};
 
function ensureDiplomacy(): DiplomacyMemory {
    const mem: any = Memory as any;
    if (!mem.diplomacy) mem.diplomacy = { allies: [], enemies: [] };
    if (!Array.isArray(mem.diplomacy.allies)) mem.diplomacy.allies = [];
    if (!Array.isArray(mem.diplomacy.enemies)) mem.diplomacy.enemies = [];
    return mem.diplomacy as DiplomacyMemory;
}
 
export function isAlly(username: string | undefined | null): boolean {
    if (!username) return false;
    const dip = ensureDiplomacy();
    if (dip.self && username === dip.self) return true;
    return dip.allies.includes(username);
}
 
function findSelfUsername(): string | undefined {
    for (const roomName of Object.keys(Game.rooms)) {
        const room = Game.rooms[roomName];
        if (room && room.controller && room.controller.my && room.controller.owner) return room.controller.owner.username;
    }
    return undefined;
}
 
function sellSurplus(room: Room): void {
    if (!room.terminal) return;
    if (room.terminal.cooldown) return;
 
    const terminal = room.terminal;
    const energy = terminal.store[RESOURCE_ENERGY] || 0;
    if (energy < 20000) return;
 
    const candidates = Object.keys(terminal.store).filter(r => r !== RESOURCE_ENERGY);
    for (const res of candidates) {
        const amt = terminal.store[res as ResourceConstant] || 0;
        if (amt < 50000) continue;
 
        const orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: res as MarketResourceConstant });
        if (!orders || orders.length === 0) continue;
 
        let best: Order | null = null;
        let bestScore = -Infinity;
        for (const o of orders) {
            if (!o || o.remainingAmount <= 0) continue;
            const dealAmount = Math.min(3000, o.remainingAmount, amt);
            const energyCost = Game.market.calcTransactionCost(dealAmount, room.name, o.roomName);
            const effective = o.price - energyCost * 0.00005;
            if (effective > bestScore) {
                bestScore = effective;
                best = o;
            }
        }
        if (!best) continue;
        if (bestScore < 0.02) continue;
 
        const dealAmount = Math.min(3000, best.remainingAmount, amt);
        const code = Game.market.deal(best.id, dealAmount, room.name);
        if (code === OK) break;
    }
}
 
export const DiplomacyMarketSystem = {
    run(): void {
        if (Memory.settings && Memory.settings.systems && Memory.settings.systems.market === false) return;
        const dip = ensureDiplomacy();
        if (!dip.self) dip.self = findSelfUsername();
 
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
 
            if (Game.time % 50 === 0) market.createBuyOrderForEnergy(room.name);
            if (Game.time % 200 === 0) sellSurplus(room);
        }
    }
};
