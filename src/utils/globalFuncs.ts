// @ts-nocheck
import market from "../managers/market";
import { migrateMemory } from '@/core/memorySchema';


export function func() {
    migrateMemory();
    for(var name in Memory.creeps) { // 释放内存
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('已清理凉掉的ceeep的:', name);
            continue;
        }
    }
    // TalkAll() // This is not defined here, handled in main or global
    // if (Game.time % 5 == 0) {
    //     market.createBuyOrderForEnergy('E55N9');
    //     // ...
    // }
    // if (Game.cpu.bucket === 10000) {//如果CPU到了一万点，则换成pixel
    //     Game.cpu.generatePixel();
    //     console.log(`兑换成功`);
    // }
}
