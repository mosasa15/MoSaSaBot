global.A = function(){
    console.log(1);
    return 0;
}

global.help = function(){
    console.log(1);
    return 0;
}

global.pushTask = function(roomName, type) {
    if (!Memory.rooms[roomName]) {
        console.log('不存在此房间的Memory，请检查是否有此房间');
    }
    if (!Memory.rooms[roomName].tasks) {
        console.log('未找到房间任务池，请检查房间是否存在');
    }
    Memory.rooms[roomName].tasks.push({
        type: type
    });
    return console.log('已发布任务到房间任务池');
}

global.removeTask = function(roomName, type) {
    const tasks = Memory.rooms[roomName].tasks;
    const index = tasks.findIndex(task => task.type === type);
    if(index === -1) return;
    Memory.rooms[roomName].tasks.splice(index, 1)
    return 0;
}

global.addPassage = function(targetRoomName, passageRoomName) {
    if (!Memory.rooms[targetRoomName].cross) {
        Memory.rooms[targetRoomName].cross = {};
        Memory.rooms[targetRoomName].cross.Index = 0;
        Memory.rooms[targetRoomName].cross.Room = [];
    }
    if (!Memory.rooms[targetRoomName].cross.Room.includes(passageRoomName)) {
        console.log('已添加此房间为过道房间')
        Memory.rooms[targetRoomName].cross.Room.push(passageRoomName);
    } else {
        console.log('此房间已经是过道房间')
    }
};

if (!global.nextTickClear) {
    global.nextTickClear = [];
}

global.requireResource = function (id, resource, num, roomName, shard, state, des) {
    const Data = {
        resource: resource,
        num: num,
        roomName: roomName,
        shard: shard,
        state: state,
        des: des
    };

    console.log('已添加资源到内存');
    RawMemory.segments[id] = JSON.stringify(Data);

    // 记录需要清空的 id
    global.nextTickClear.push(id);
};

// 清空上 tick 记录的内存段


// // 定义第二个方法：添加一个或多个过道房间到目标房间的交叉引用（接受数组）
// global.addPassages = function(targetRoomName, passageRoomNames) {
//     if (!Memory.rooms[targetRoomName].cross) {
//         Memory.rooms[targetRoomName].cross = {};
//         Memory.rooms[targetRoomName].cross.Index = 0;
//         Memory.rooms[targetRoomName].cross.Room = [];
//     }
//     passageRoomNames.forEach(passageRoomName => {
//         if (!Memory.rooms[targetRoomName].cross.Room.includes(passageRoomName)) {
//             console.log('已添加所有房间为过道房间')
//             Memory.rooms[targetRoomName].cross.Room.push(passageRoomName);
//         } else{
//             console.log({passageRoomName} + '已经是过道房间')
//         }
//     });
// };

// global.removePassage = function(targetRoomName, passageRoomName) {
//     if (Memory.rooms[targetRoomName] && Memory.rooms[targetRoomName].cross && Memory.rooms[targetRoomName].cross.Room) {
//         const index = Memory.rooms[targetRoomName].cross.Room.indexOf(passageRoomName);
//         if (index !== -1) {
//             Memory.rooms[targetRoomName].cross.Room.splice(index, 1);
//         }
//     }
// };

// // 定义第二个方法：从目标房间的交叉引用中删除一个或多个过道房间（接受数组）
// global.removePassages = function(targetRoomName, passageRoomNames) {
//     if (Memory.rooms[targetRoomName] && Memory.rooms[targetRoomName].cross && Memory.rooms[targetRoomName].cross.Room) {
//         passageRoomNames.forEach(passageRoomName => {
//             const index = Memory.rooms[targetRoomName].cross.Room.indexOf(passageRoomName);
//             if (index !== -1) {
//                 Memory.rooms[targetRoomName].cross.Room.splice(index, 1);
//             }
//         });
//     }
// };

// Memory.rooms.E54N19.tasks.push({
//     type: '123',
//     room: '456'
// });
// const index = Memory.rooms.E54N19.tasks.findIndex(task => task.type === '123' &&  task.room === '456' );
// Memory.rooms.E54N19.tasks.splice(index, 1)