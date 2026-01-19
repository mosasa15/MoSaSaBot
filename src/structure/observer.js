// 观察者对象
var observer = {
    /**
     * 根据Link的职责执行相应的操作
     * @param {string} roomName - 当前操作的房间名称
     */
    run: function(roomName) {
        initRoom(roomName);
        observeRoom(roomName);
        checkAndAddTasks(roomName);
    },
};

function initRoom(roomName) {
    if (!Memory.rooms[roomName].cross) {
        Memory.rooms[roomName].cross = {};
        Memory.rooms[roomName].cross.Index = 0;
        Memory.rooms[roomName].cross.Room = [];
    }
}
// 更新房间交叉引用索引
function updateRoom(roomName) {
    const roomMemory = Memory.rooms[roomName].cross;
    let Index = roomMemory.Index || 0;
    Index = (Index + 1) % roomMemory.Room.length; // 循环遍历Room数组
    Memory.rooms[roomName].cross.Index = Index;
}
// 观察指定房间
function observeRoom(roomName) {
    if (Game.time % 10 === 0) {
        const roomMemory = Memory.rooms[roomName].cross;
        const roomNameToObserve = roomMemory.Room[Memory.rooms[roomName].cross.Index];
        const observer = Game.rooms[roomName].observer;
        if (observer) {
            observer.observeRoom(roomNameToObserve);
            Memory.rooms[roomName].cross.checkRoom = roomNameToObserve;
            updateRoom(roomName);
        }
    }
}
// 检查任务列表并添加新任务（如果需要）
function checkAndAddTasks(roomName) {
    const tasksList = Memory.rooms[roomName].tasks;
    const observedRoomName = Memory.rooms[roomName].cross.checkRoom;
    if (observedRoomName && Game.time % 10 === 1) {
        const observedRoom = Game.rooms[observedRoomName];
        if (observedRoom) {
            const powerBanks = observedRoom.find(FIND_STRUCTURES, {
                filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
            });
            const targetPowerBank = powerBanks.find((powerBank) => {
                return powerBank.ticksToDecay >= 3600 &&
                        powerBank.power > 1000;
            });

            if ( targetPowerBank ) {
                const terrain = new Room.Terrain(observedRoom.name);
                const powerBankPos = targetPowerBank.pos; // 假设只处理第一个powerBank
                let num = 0;
                [
                    [powerBankPos.x - 1, powerBankPos.y - 1], [powerBankPos.x, powerBankPos.y - 1], [powerBankPos.x + 1, powerBankPos.y - 1],
                    [powerBankPos.x - 1, powerBankPos.y],     [powerBankPos.x + 1, powerBankPos.y],
                    [powerBankPos.x - 1, powerBankPos.y + 1], [powerBankPos.x, powerBankPos.y + 1], [powerBankPos.x + 1, powerBankPos.y + 1],
                ].forEach(([x, y]) => {
                    if (terrain.get(x, y) !== TERRAIN_MASK_WALL) num++;
                });
                num = Math.min(num, 3); 
                console.log(`大眼睛在房间 ${observedRoom.name} 发现PB`);
                if (!tasksList.some(task => task.type === 'Power' && task.room === observedRoom.name )) {
                    console.log('发布pb任务');
                    const task = {
                        type: 'Power',
                        room: observedRoom.name,
                        number: num,
                        id: targetPowerBank.id
                    };
                    if (num === 1) {
                        task.assistance = true; // 添加需要援助的属性
                    }
                    tasksList.push(task);
                } else {
                    console.log('发布pb任务失败，已有重复任务');
                }
            } else {
                console.log(`大眼睛在房间 ${observedRoomName} 没有发现PB`);
                // // 检查并删除房间内已有的Power任务
                // const tasksToRemove = tasksList.filter(task => task.type === 'Power' && task.room === observedRoomName);
                // if (tasksToRemove.length > 0) {
                //     tasksToRemove.forEach(task => {
                //         const index = tasksList.indexOf(task);
                //         if (index > -1) {
                //             tasksList.splice(index, 1); // 删除任务
                //         }
                //     });
                //     console.log(`删除房间 ${observedRoomName} 的重复或过期PB任务，共删除 ${tasksToRemove.length} 条任务`);
                // }
            }
        } else {
            console.log(`无法访问房间 ${observedRoomName}`);
        }
        delete Memory.rooms[roomName].cross.checkRoom; // 清除已检查房间的标记
    }
}

// 导出模块
export default observer;
