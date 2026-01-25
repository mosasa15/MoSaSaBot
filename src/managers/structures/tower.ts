import { ensureRoomTasks, pushRoomTask } from '@/utils/roomTasks';
import { isAlly } from '@/systems/diplomacy/DiplomacyMarketSystem';

var Tower = {  
    /**  
     * @param {StructureTower} tower - 当前的塔对象  
     */  
    run: function( roomName ) {  
        let room = Game.rooms[roomName];    
        if(!room) return;

        const towers = room.tower || room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        if (!towers || towers.length === 0) return;

        const tasksList = ensureRoomTasks(roomName);

        // Run logic every tick for critical defense, but maybe less often for repair?
        // Defense is critical, so check every tick.
        
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        
        if (hostiles.length > 0) {
            // Defense Mode
            this.defend(towers, hostiles);
        } else {
            // Repair/Heal Mode
            this.maintain(towers, tasksList);
        }
    },

    defend: function(towers, hostiles) {
        const targets = hostiles.filter(c => !isAlly(c.owner.username));
        if (targets.length === 0) return;

        const room = towers[0].room;
        const spawns = room.find(FIND_MY_SPAWNS);
        const anchor = spawns[0] || room.storage || room.controller;

        const score = (c: Creep): number => {
            let s = 0;
            for (const p of c.body) {
                if (p.type === HEAL) s += p.boost ? 40 : 20;
                else if (p.type === RANGED_ATTACK) s += p.boost ? 35 : 18;
                else if (p.type === ATTACK) s += p.boost ? 30 : 15;
                else if (p.type === WORK) s += 3;
                else if (p.type === TOUGH) s += p.boost ? 2 : 1;
            }
            const hpRatio = c.hitsMax > 0 ? c.hits / c.hitsMax : 1;
            s += (1 - hpRatio) * 20;
            if (anchor) {
                const d = c.pos.getRangeTo(anchor);
                s += Math.max(0, 12 - d) * 2;
            }
            return s;
        };

        let target = targets[0];
        let best = -Infinity;
        for (const c of targets) {
            const sc = score(c);
            if (sc > best) {
                best = sc;
                target = c;
            }
        }
        
        for (let tower of towers) {
            tower.attack(target);
        }
    },

    maintain: function(towers, tasksList) {
        for (let tower of towers) {
            // 1. Request Energy if low
            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 600) {
                pushRoomTask(tower.room.name, { type: 'fillTower', id: tower.id });
            }

            // 2. Heal Creeps
            const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (c) => c.hits < c.hitsMax
            });
            if (damagedCreep) {
                tower.heal(damagedCreep);
                continue;
            }

            // 3. Repair (only if energy is high enough to save for defense)
            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 600) {
                // Priority: Ramparts (low hits) > Roads > Containers
                
                // Ramparts critical check
                const criticalRampart = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 5000 // Critical threshold
                });
                if (criticalRampart) {
                    tower.repair(criticalRampart);
                    continue;
                }

                // General Repair (throttle to save CPU)
                if (Game.time % 10 === 0) {
                    const target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => {
                            if (s.structureType === STRUCTURE_RAMPART && s.hits < 100000) return true; // Maintain threshold
                            if (s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.8) return true;
                            if (s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.8) return true;
                            return false;
                        }
                    });
                    if (target) {
                        tower.repair(target);
                    }
                }
            }
        }
    }
};  

export default Tower;
