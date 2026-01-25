import './utils/roomResource';
import './utils/structureCache';
import './utils/moveOptimizations';
import './utils/chat';
import './utils/command';

import { Kernel } from './core/Kernel';
import { SystemScheduler } from './core/SystemScheduler';
import { RoomProcess } from './processes/RoomProcess';
import { CreepProcess } from './processes/CreepProcess';
import { StructureProcess } from './processes/StructureProcess';
// import { PowerCreepProcess } from './processes/PowerCreepProcess';
import { func as runGlobalMaintenance } from './utils/globalFuncs';
import { IntelSystem } from '@/systems/intel/IntelSystem';
import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
import { TaskSystem } from '@/systems/tasks/TaskSystem';
import { LogisticsSystem } from '@/systems/logistics/LogisticsSystem';
import { EconomySystem } from '@/systems/economy/EconomySystem';
import { DefenseSystem } from '@/systems/defense/DefenseSystem';
import { RemoteOpsSystem } from '@/systems/remote/RemoteOpsSystem';
import { DiplomacyMarketSystem } from '@/systems/diplomacy/DiplomacyMarketSystem';
import { ObservabilitySystem } from '@/systems/observability/ObservabilitySystem';
import { MetricsSystem } from '@/systems/metrics/MetricsSystem';

const kernel = new Kernel();

kernel.addProcess(new RoomProcess());
kernel.addProcess(new StructureProcess());
kernel.addProcess(new CreepProcess());
// kernel.addProcess(new PowerCreepProcess());
 
const scheduler = new SystemScheduler()
    .addStage({
        name: 'maintenance',
        run: () => runGlobalMaintenance()
    })
    .addStage({
        name: 'intel',
        run: () => IntelSystem.run(),
        every: 5,
        minBucket: 500
    })
    .addStage({
        name: 'roomState',
        run: () => RoomStateSystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'taskSystem',
        run: () => TaskSystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'logistics',
        run: () => LogisticsSystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'economy',
        run: () => EconomySystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'defense',
        run: () => DefenseSystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'remoteOps',
        run: () => RemoteOpsSystem.run(),
        minBucket: 500
    })
    .addStage({
        name: 'market',
        run: () => DiplomacyMarketSystem.run(),
        every: 5,
        minBucket: 500
    })
    .addStage({
        name: 'hud',
        run: () => ObservabilitySystem.run(),
        every: 5,
        minBucket: 500
    })
    .addStage({
        name: 'kernel',
        run: () => kernel.run()
    })
    .addStage({
        name: 'metrics',
        run: () => MetricsSystem.run(),
        every: 1
    });

export const loop = () => {
    scheduler.run();
};
