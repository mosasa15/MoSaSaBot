import '@/func/超级移动优化hotfix 0.9.4';
import '@/func/极致建筑缓存 v1.4.3';
import '@/func/闲聊 v1.0';
import '@/func/helper_roomResource'

import { createApp } from './framework';

import { runCreep } from './run/runCreep';
import { runRoom } from './run/runRoom';
import { runPowerCreep } from './run/runPowerCreep';
import { runStructure } from './run/runStructure';
import { func } from './func/func';

import { ResourceController } from './func/resourceSharingAgreement';
import command from '@/func/command';
import market from '@/func/market';

// // 将资源控制器挂载到 global 对象
// if (!global.ResourceController) {
//     global.ResourceController = ResourceController;
//     console.log("[Global] ResourceController 已挂载到 global 对象");
// }

const app = createApp();

app.add(func);

app.add(runRoom);

app.add(runStructure);

app.add(runCreep);

app.add(runPowerCreep);

export const loop = app.run;

// import profiler from './func/screeps-profiler';
// const profiler = require('screeps-profiler');
// profiler.enable();
// export const loop = function() {
//     profiler.wrap(app.run);
// }
