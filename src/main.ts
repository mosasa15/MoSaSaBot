import './utils/roomResource';
import './utils/structureCache';
import './utils/moveOptimizations';
import './utils/chat';

import { Kernel } from './core/Kernel';
import { RoomProcess } from './processes/RoomProcess';
import { CreepProcess } from './processes/CreepProcess';
import { StructureProcess } from './processes/StructureProcess';
// import { PowerCreepProcess } from './processes/PowerCreepProcess';
import { func as runGlobalMaintenance } from './utils/globalFuncs';

const kernel = new Kernel();

kernel.addProcess(new RoomProcess());
kernel.addProcess(new StructureProcess());
kernel.addProcess(new CreepProcess());
// kernel.addProcess(new PowerCreepProcess());

export const loop = () => {
    try {
        runGlobalMaintenance();
    } catch (e) {
        console.log('Error in global maintenance:', e);
    }

    kernel.run();
};
