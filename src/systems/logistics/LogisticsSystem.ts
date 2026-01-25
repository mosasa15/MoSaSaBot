import { TaskSystem } from '@/systems/tasks/TaskSystem';
 
export const LogisticsSystem = {
    run(): void {
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
 
            this.generateEnergyFillTasks(room);
            this.translateLegacyRoomTasks(roomName);
        }
    },
 
    generateEnergyFillTasks(room: Room): void {
        const needsFill = room.find(FIND_MY_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        }).length;
 
        if (needsFill > 0) {
            TaskSystem.upsert(room.name, 'fillExtension', 100);
        }
 
        const towers = room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER }) as StructureTower[];
        for (const tower of towers) {
            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 600) {
                TaskSystem.upsert(room.name, 'fillTower', 90, { id: tower.id });
            }
        }
    },
 
    translateLegacyRoomTasks(roomName: string): void {
        const legacy = Memory.rooms && Memory.rooms[roomName] && Array.isArray(Memory.rooms[roomName].tasks) ? Memory.rooms[roomName].tasks : [];
        for (const t of legacy) {
            if (!t || typeof t.type !== 'string') continue;
 
            if (t.type === 'fillExtension') TaskSystem.upsert(roomName, 'fillExtension', 100);
            else if (t.type === 'fillTower') TaskSystem.upsert(roomName, 'fillTower', 90, { id: (t as any).id });
            else if (t.type === 'transferToUpgradeLink') TaskSystem.upsert(roomName, 'transferToUpgradeLink', 80);
            else if (t.type === 'transferToStorage') TaskSystem.upsert(roomName, 'transferToStorage', 70);
            else if (t.type === 'S-T') {
                const d = (t as any).details || {};
                if (d.from && d.to && d.resourceType) {
                    TaskSystem.upsert(roomName, 'storeTransfer', 30, {
                        from: d.from,
                        to: d.to,
                        resourceType: d.resourceType,
                        amount: d.amount
                    });
                }
            } else if (t.type === 'share') {
                const d = (t as any).details || t;
                if (d.resourceType && d.amount && d.targetRoom) {
                    TaskSystem.upsert(roomName, 'shareSend', 25, {
                        resourceType: d.resourceType,
                        amount: d.amount,
                        targetRoom: d.targetRoom
                    });
                }
            }
        }
    }
};

