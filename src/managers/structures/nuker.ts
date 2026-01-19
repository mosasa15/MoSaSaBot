const nuker = {
    // 配置项
    checkInterval: 170, // 检查间隔时间（Ticks）
    flagName: 'Nuker', // 默认目标旗帜名称
    
    lastCheckTime: 0,   // 上次检查时间

    // 是否达到检查间隔
    shouldCheck: function () {
        return Game.time - this.lastCheckTime >= this.checkInterval;
    },

    // 检查 Nuker 是否就绪
    isNukerReady: function (nuker) {
        return nuker.store[RESOURCE_ENERGY] === nuker.store.getCapacity(RESOURCE_ENERGY) &&
               nuker.store[RESOURCE_GHODIUM] === nuker.store.getCapacity(RESOURCE_GHODIUM) &&
               !nuker.cooldown;
    },

    // 发射 Nuker
    launchNuke: function (nuker, flag) {
        const result = nuker.launchNuke(flag.pos);
        if (result === OK) {
            console.log(`[Nuker] 房间 ${nuker.room.name} 成功发射核弹至 ${flag.pos}`);
        } else {
            console.log(`[Nuker] 房间 ${nuker.room.name} 发射失败，错误代码：${result}`);
        }
        return result;
    },

    // 主运行逻辑
    run: function () {
        if (!this.shouldCheck()) return;
        this.lastCheckTime = Game.time;

        const flag = Game.flags[this.flagName];
        if (!flag) {
            // console.log(`[Nuker] 未找到名为 '${this.flagName}' 的旗帜`);
            return;
        }

        // 遍历所有有 Nuker 的房间
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (!room.controller || !room.controller.my) continue;
            
            const nuker = room.nuker;
            if (!nuker) continue;

            if (this.isNukerReady(nuker)) {
                if (Game.map.getRoomLinearDistance(roomName, flag.pos.roomName) <= 10) {
                    this.launchNuke(nuker, flag);
                } else {
                    console.log(`[Nuker] 目标 ${flag.pos} 超出房间 ${roomName} 的 Nuker 射程`);
                }
            } else {
                // Optional logging
                /*
                const energy = nuker.store[RESOURCE_ENERGY] || 0;
                const ghodium = nuker.store[RESOURCE_GHODIUM] || 0;
                console.log(`[Nuker] 房间 ${roomName} 的 Nuker 不可用：` +
                    `能量 ${energy}/${nuker.store.getCapacity(RESOURCE_ENERGY)}, ` +
                    `GHODIUM ${ghodium}/${nuker.store.getCapacity(RESOURCE_GHODIUM)}`);
                */
            }
        }
    }
};

export default nuker;
