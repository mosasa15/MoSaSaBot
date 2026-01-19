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
    
    'remoteHarvester': remoteHarvester,
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
}
