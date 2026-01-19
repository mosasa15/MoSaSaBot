//import { resourceCompoundMap, labTarget } from './config';
import { 
    // checkResourceAmountInTerminal, 
    // releaseTask,
    handleGetTargetState,
    handleGetResourceState,
    handleWorkingState,
    handlePutResourceState
} from './helper'; 

const Lab = {
    run: function(roomName) {
        // 主运行逻辑
        const roomMemory = Memory.rooms[roomName].labs; 
        let room = Game.rooms[roomName];
        const labs = room.lab;

        // 初始化检查
        if(!roomMemory) {
            this.initializeLabMemory(roomName, labs);
            return;
        }

        // 遍历所有lab执行相应操作
        for(let lab of labs) {
            if (roomMemory.inLabs.includes(lab.id)) {
                this.runAsInLab(lab, roomMemory, labs);
            } else if (Object.keys(roomMemory.outLabs).includes(lab.id)) {
                this.runAsOutLab(lab, roomMemory, labs);
            }
        }
    },

    initializeLabMemory: function(roomName, labs) {
        Memory.rooms[roomName].labs = {
            inLabs: labs.slice(0, 2).map(lab => lab.id),
            outLabs: Object.fromEntries(
                labs.slice(2).map(lab => [lab.id, 0])
            ),
            state: 'getTarget',
            targetIndex: 0,
            targetAmount: 0
        };
    },

    runAsInLab: function(lab, roomMemory, labs) {
        if (roomMemory.state === 'getTarget') {
            handleGetTargetState(lab);
        } else if (roomMemory.state === 'getResource') {
            handleGetResourceState(lab, labs);
        }
    },

    runAsOutLab: function(lab, roomMemory, labs) {
        if (roomMemory.state === 'working') {
            handleWorkingState(lab, labs);
        } else if (roomMemory.state === 'putResource') {
            handlePutResourceState(lab, labs);
        }
    },

};

export default Lab; 