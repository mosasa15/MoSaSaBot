var roleScavenger = {
    /**  
     * @param {Creep} creep 
     */  
    //---------------------------------------------------------------------------------------
    // 主运行函数
    run: function(creep) {
        creep.memory.dontPullMe = true; 
        if (creep.memory.prepare === undefined) {  
            creep.memory.prepare = false;  
        }  
        if ( creep.memory.prepare === false) {
            this.prepare(creep)
            return; // 准备阶段
        } else {
            this.work(creep); // 工作
        }
    },
    
    // 准备阶段
    prepare: function(creep) {
        creep.memory.dontPullMe = false;  
        const sourceRoomName = creep.memory.sourceRoomName;
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        if( creep.memory.boosted === false ){
           const labs = creep.room.lab;  
            // 检查 creep.memory 中是否有 boostIndex，如果没有则初始化为 0  
            if (!creep.memory.boostIndex) {  
                creep.memory.boostIndex = 0;  
            }  
            // 根据 boostIndex 获取对应的实验室和强化类型  
            let boostLab, boostType;  
            switch (creep.memory.boostIndex) {  
                case 0:  
                    boostLab = labs[2];  
                    boostType = MOVE;  
                    break; 
                case 1:  
                    boostLab = labs[4];  
                    boostType = WORK;  
                    break;  
                // case 0:  
                //     boostLab = labs[0];  
                //     boostType = HEAL;  
                //     break;  
                // case 1:  
                //     boostLab = labs[1];  
                //     boostType = TOUGH;  
                //     break;  
                default:  
                    // 如果 boostIndex 超出范围，重置为 0  
                    creep.memory.boostIndex = 0;  
                    boostLab = labs[0];  
                    boostType = HEAL;  
            }  
            // 执行 boostCreep 操作  
            const result = boostLab.boostCreep(creep, boostType);  
            if (result === OK) {  
                // 如果当前是最后一次强化，设置 boosted 为 true  
                if (creep.memory.boostIndex === 1) {  
                    creep.memory.boosted = true;  
                } else {  
                    // 否则，增加 boostIndex 以准备下一次强化  
                    creep.memory.boostIndex++;  
                }  
            } else if (result === ERR_NOT_IN_RANGE) {  
                // 如果不在范围内，移动到对应的实验室  
                creep.moveTo(boostLab, { visualizePathStyle: { stroke: '#0000ff' } });  
            } else {  
                // 处理其他可能的错误情况（可选）  
                console.log(`Boost failed with error: ${result}`);  
            } 
        } else {
            creep.memory.prepare = true;
            // const terminal = creep.room.terminal;
            // const roomName = terminal.pos.roomName;  
            // const position = this.getPositionInMatrix(creep.memory.workLoc);
            // const targetX = terminal.pos.x + position.x;
            // const targetY = terminal.pos.y + position.y;
            // const targetPosition = new RoomPosition(targetX, targetY, roomName);  
            // if(creep.pos.x === targetX && creep.pos.y === targetY){
            //     creep.memory.prepare = true;
            // } else {
            //     creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
            // }
        }
        return true;
    },
    // 工作阶段
    work: function(creep) {
        const flag = Game.flags['Flag2'];
        if (flag) {
            // 检查 creep 是否在 flag 附近一格
            if (creep.pos.inRangeTo(flag.pos, 1)) {
                // 查找 flag 所在位置的结构
                const structureAtFlag = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos);
                const hasWorkPart = creep.body.some(part => part.type === WORK);
                // 如果存在敌方的 Rampart 或 Wall，并且 creep 有 WORK 部件
                if ( hasWorkPart) {
                    // 尝试拆除该结构
                    creep.dismantle(structureAtFlag[0]);
                }
            } 
            this.moveToFlag(creep, flag);
            //creep.heal(creep);
        }
    },
    // 获取creep在方阵中的位置
    getPositionInMatrix: function(workLoc) {
        // 假设方阵的每个单位距离为1
        const positions = [
            { x: 0, y: 1 }, // workLoc 0
            { x: -1, y: 1 },  // workLoc 1
            { x: -1, y: 0 },  // workLoc 2
            { x: -1, y: -1 },   // workLoc 3
            { x: 0, y: -1 },   // workLoc 4
            { x: 1, y: 1 },   // workLoc 5
            { x: 1, y: 0 },   // workLoc 6
            { x: 1, y: -1 }   // workLoc 7
        ];
        return positions[workLoc];
    },
    moveToFlag: function(creep, flag) {
        const targetX = flag.pos.x ;
        const targetY = flag.pos.y ;
        const roomName = flag.pos.roomName;  
        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
        creep.moveTo(targetPosition, {visualizePathStyle: {stroke: '#ffaa00'}});
    },
};
export default roleScavenger;