import market from "./market";


export function func() {
    for(var name in Memory.creeps) { // 释放内存
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('已清理凉掉的ceeep的:', name);
            continue;
        }
    }
    TalkAll()
    // if (Game.time % 5 == 0) {
    //     market.createBuyOrderForEnergy('E55N9');
    //     // market.createBuyOrderForEnergy('E55N21');
    //     // market.createBuyOrderForEnergy('E56N13');
    //     // market.createBuyOrderForEnergy('E56N17');
    //     // market.createBuyOrderForEnergy('E54N19');
    //     // market.createBuyOrderForEnergy('E58N14');
    // }
    // if (Game.cpu.bucket === 10000) {//如果CPU到了一万点，则换成pixel
    //     Game.cpu.generatePixel();
    //     console.log(`兑换成功`);
    // }
}