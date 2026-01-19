import { labTarget, resourceCompoundMap } from './config';

/**
 * 检查终端和存储中的资源数量
 * @param {StructureLab} lab - 当前操作的Lab对象
 * @param {string} resourceType - 资源类型
 * @param {number} amount - 需要检查的数量
 */
export function checkResourceAmountInTerminal(lab, resourceType, amount) {
    const terminal = lab.room.terminal;
    const storage = lab.room.storage;
    return terminal.store[resourceType] + storage.store[resourceType] < amount;
}

/**
 * 发布物流任务
 * @param {StructureLab} lab - 当前操作的Lab对象
 * @param {string} taskType - 任务类型
 * @param {string} resourceType - 资源类型
 * @param {number} amount - 资源数量
 */
export function releaseTask(lab, taskType, resourceType, amount) {
    const task = {
        labId: lab.id,
        type: taskType,
        resourceType: resourceType,
        amount: amount
    };
    Memory.rooms[lab.room.name].tasks.push(task);
}

/**
 * 处理获取目标状态
 * @param {StructureLab} lab - 当前操作的Lab对象
 */
export function handleGetTargetState(lab) {
    const targetIndex = Memory.rooms[lab.room.name].labs.targetIndex;
    const target = labTarget[targetIndex];
    
    if (checkResourceAmountInTerminal(lab, target.target, target.number) &&
        !checkResourceAmountInTerminal(lab, resourceCompoundMap[target.target][0], Math.min(target.number, 2000)) &&
        !checkResourceAmountInTerminal(lab, resourceCompoundMap[target.target][1], Math.min(target.number, 2000))) {
        
        let targetAmount = Math.min(target.number, 2000);
        targetAmount = Math.floor(targetAmount / 5) * 5;
        
        Memory.rooms[lab.room.name].labs.targetAmount = targetAmount;
        Memory.rooms[lab.room.name].labs.state = 'getResource';
    } else {
        Memory.rooms[lab.room.name].labs.targetIndex = 
            targetIndex === labTarget.length - 1 ? 0 : targetIndex + 1;
    }
}

/**
 * 处理获取资源状态
 * @param {StructureLab} lab - 当前操作的Lab对象
 * @param {Array} labs - 房间内所有的lab
 */
export function handleGetResourceState(lab, labs) {
    const roomMemory = Memory.rooms[lab.room.name].labs;
    const targetIndex = roomMemory.targetIndex;
    const targetAmount = roomMemory.targetAmount;
    const resourceType_0 = resourceCompoundMap[labTarget[targetIndex].target][0];
    const resourceType_1 = resourceCompoundMap[labTarget[targetIndex].target][1];
    const tasksList = Memory.rooms[lab.room.name].tasks;

    if (tasksList.some(task => task.type === 'withdraw')) return;

    if (lab.id === roomMemory.inLabs[0]) {
        if (lab.store[resourceType_0] < targetAmount) {
            if (!tasksList.some(task => task.type === 'withdraw')) {
                releaseTask(lab, 'withdraw', resourceType_0, targetAmount);
            }
        }
    } else if (lab.id === roomMemory.inLabs[1]) {
        if (lab.store[resourceType_1] < targetAmount) {
            if (!tasksList.some(task => task.type === 'withdraw')) {
                releaseTask(lab, 'withdraw', resourceType_1, targetAmount);
            }
        }
    }

    if (labs[0].store[resourceType_0] >= targetAmount && 
        labs[1].store[resourceType_1] >= targetAmount) {
        Memory.rooms[lab.room.name].labs.state = 'working';
    }
}

/**
 * 处理工作状态
 * @param {StructureLab} lab - 当前操作的Lab对象
 * @param {Array} labs - 房间内所有的lab
 */
export function handleWorkingState(lab, labs) {
    const roomMemory = Memory.rooms[lab.room.name].labs;
    const targetIndex = roomMemory.targetIndex;
    const resourceType_0 = resourceCompoundMap[labTarget[targetIndex].target][0];
    const resourceType_1 = resourceCompoundMap[labTarget[targetIndex].target][1];

    lab.runReaction(labs[0], labs[1]);

    if (labs[0].store[resourceType_0] === 0 || 
        labs[1].store[resourceType_1] === 0) {
        Memory.rooms[lab.room.name].labs.state = 'putResource';
    }
}

/**
 * 处理存放资源状态
 * @param {StructureLab} lab - 当前操作的Lab对象
 * @param {Array} labs - 房间内所有的lab
 */
export function handlePutResourceState(lab, labs) {
    const tasksList = Memory.rooms[lab.room.name].tasks;
    if (tasksList.some(task => task.type === 'transfer')) return;

    for (let i = 2; i < labs.length; i++) {
        if (labs[i].store[labs[i].mineralType] > 0) {
            if (!tasksList.some(task => task.type === 'transfer')) {
                releaseTask(labs[i], 'transfer', null, null);
            }
        } else if (labs[i].store[labs[i].mineralType] === undefined) {
            Memory.rooms[labs[i].room.name].labs.state = 'getTarget';
        }
    }
}