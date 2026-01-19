var roleLeveler = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // 获取房间对象
        const room = creep.room;
        
        // 获取存储位置
        const storage = room.storage;
        const terminal = room.terminal;
        // 检查workLoc的值
        const workLoc = creep.memory.workLoc;
    

        // 确定目标存储位置
        let targetStorage = null;
        if (workLoc >= 0 && workLoc <= 4 && storage) {
            targetStorage = storage;
        } else if (workLoc >= 5 && workLoc <= 9 && terminal) {
            targetStorage = terminal;
        }
        // 如果没有指定存储位置或存储位置不存在，使用默认的storage
        if (!targetStorage && storage) {
            targetStorage = storage;
        }
    },
};

export default roleLeveler; 