import { Process } from '../core/Process';
import harvester from '../roles/local/harvester';
import upgrader from '../roles/local/upgrader';
import builder from '../roles/local/builder';
import manager from '../roles/local/manager';
import transferer from '../roles/local/transferer';
import defender from '../roles/local/defender';
import wallRepairer from '../roles/local/wallRepairer';
import centralTransferer from '../roles/local/centralTransferer';
import leveler from '../roles/local/leveler';
import thinker from '../roles/local/thinker';
import savior from '../roles/local/savior';
import earlyUpgrader from '../roles/local/earlyUpgrader';
import scout from '../roles/remote/scout';
import roleRemoteHarvester from '../roles/remote/remoteHarvester';

import remoteHarvester from '../roles/remote/harvester';
import remoteTransferer from '../roles/remote/transferer';
import remoteAttacker from '../roles/remote/attacker';
import remoteReserver from '../roles/remote/reserver';

import supportBuilder from '../roles/support/builder';
import supportAdventurer from '../roles/support/adventurer';
import supportClaimer from '../roles/support/claimer';
import supportRepairer from '../roles/support/repairer';
import supportScavenger from '../roles/support/scavenger';

const roles: { [key: string]: { run: (creep: Creep) => void } } = {
    'harvester': harvester,
    'upgrader': upgrader,
    'builder': builder,
    'manager': manager,
    'transferer': transferer,
    'defender': defender,
    'defenser': defender,
    'wallRepairer': wallRepairer,
    'centralTransferer': centralTransferer,
    'leveler': leveler,
    'thinker': thinker,
    'savior': savior,
    'earlyUpgrader': earlyUpgrader,
    'scout': scout,
    'remoteHarvester': roleRemoteHarvester,
    
    // 'remoteHarvester': remoteHarvester, // Conflicting old role
    'remoteTransferer': remoteTransferer,
    'attacker': remoteAttacker,
    'reserver': remoteReserver,

    'supportBuilder': supportBuilder,
    'adventurer': supportAdventurer,
    'claimer': supportClaimer,
    'repairer': supportRepairer,
    'scavenger': supportScavenger
};

export class CreepProcess implements Process {
    public run(): void {
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (creep.spawning) continue;

            // Move off spawn logic (Prevent blocking spawn)
            this.moveOffSpawn(creep);

            const roleName = creep.memory.role;
            if (roleName && roles[roleName]) {
                try {
                    roles[roleName].run(creep);
                } catch (e) {
                    console.log(`Error running creep ${name} (role: ${roleName}):`, e);
                }
            }
        }
    }

    /**
     * Checks if the creep is standing on a spawn and moves it to a random adjacent free spot if so.
     */
    private moveOffSpawn(creep: Creep): void {
        const structures = creep.pos.lookFor(LOOK_STRUCTURES);
        // Check if the creep is currently standing on a spawn
        if (!structures.some(s => s.structureType === STRUCTURE_SPAWN)) return;

        const directions = [TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT, TOP_LEFT];
        // Shuffle directions to pick a random one
        const shuffled = directions.sort(() => Math.random() - 0.5);
        
        for (const dir of shuffled) {
            const offsetX = (dir === RIGHT || dir === BOTTOM_RIGHT || dir === TOP_RIGHT) ? 1 : ((dir === LEFT || dir === TOP_LEFT || dir === BOTTOM_LEFT) ? -1 : 0);
            const offsetY = (dir === BOTTOM || dir === BOTTOM_LEFT || dir === BOTTOM_RIGHT) ? 1 : ((dir === TOP || dir === TOP_LEFT || dir === TOP_RIGHT) ? -1 : 0);
            
            const x = creep.pos.x + offsetX;
            const y = creep.pos.y + offsetY;

            // Check boundaries
            if (x < 0 || x > 49 || y < 0 || y > 49) continue;

            // Check terrain
            const terrain = creep.room.getTerrain().get(x, y);
            if (terrain === TERRAIN_MASK_WALL) continue;

            // Check structures
            const posStructures = creep.room.lookForAt(LOOK_STRUCTURES, x, y);
            if (posStructures.some(s => {
                if (s.structureType === STRUCTURE_RAMPART) {
                    return !(s as StructureRampart).my && !(s as StructureRampart).isPublic;
                }
                return OBSTACLE_OBJECT_TYPES.includes(s.structureType as any);
            })) continue;

            // Check creeps
            const posCreeps = creep.room.lookForAt(LOOK_CREEPS, x, y);
            if (posCreeps.length > 0) continue;

            // Found a free spot, move there
            creep.move(dir as DirectionConstant);
            return;
        }
    }
}
