import command from '@/func/command';
import market from '@/func/market';

// 引入功能模块
import '@/func/超级移动优化hotfix 0.9.4';
import '@/func/极致建筑缓存 v1.4.3';
import '@/func/闲聊 v1.0';
import '@/func/helper_roomResource'

import { errorMapper } from './func/errorMapper';
// import profiler from './func/screeps-profiler';
// const profiler = require('screeps-profiler');

import { ResourceController } from './func/resourceSharingAgreement';
import { runCreep } from './run/runCreep';
import { runRoom } from './run/runRoom';
import { runPowerCreep } from './run/runPowerCreep';
import { runStructure } from './run/runStructure';
import { func } from './func/func';


// // 将资源控制器挂载到 global 对象
// if (!global.ResourceController) {
//     global.ResourceController = ResourceController;
//     console.log("[Global] ResourceController 已挂载到 global 对象");
// }

// 主循环功能封装
const loopFunc = () => {
    // 使用 profiler 包裹主循环（如果启用）
    // profiler.wrap(() => {
    func();
    runPowerCreep();
    runStructure();
    runRoom();
    runCreep();
    // });

    if (global.nextTickClear.length > 0) {
        for (const id of global.nextTickClear) {
            RawMemory.segments[id] = '';
            console.log(`已清空内存段: ${id}`);
        }
        global.nextTickClear = [];
    }
    

    // 示例代码（如需保留可启用）
    /*
    for (const id in Game.market.orders) {
        Game.market.cancelOrder(id);
    }

    const target = 'E55N21';
    delete Memory.rooms[target]?.requestEnergyFromCenterLink;
    delete Memory.rooms[target]?.transferEnergyToStorage;
    // delete Memory.rooms['E54N19']?.specificContainerId;

    const tasksList = Memory.rooms.E58N14.tasks || [];
    Memory.rooms.E58N14.tasks = tasksList.filter(task => task.type !== 'S-T');

    Memory.rooms['E58N14'].spawnQueue = [];
    Memory.rooms.E58N14.tasks = [];
    */
   
};

// 选择是否启用错误映射或直接运行主循环
export const loop = () => errorMapper(loopFunc);