const nuker = {
    // 配置项
    roomList: ['E54N19','E53N19','E55N21','E56N13','E56N17','E55N9','E58N14'], // 房间列表
    checkInterval: 170, // 检查间隔时间（Ticks）
    flagName: 'Nuker', // 默认目标旗帜名称

    currentRoomIndex: 0, // 当前房间指针
    lastCheckTime: 0,   // 上次检查时间

    // 更新指针到下一个房间
    moveToNextRoom: function () {
        this.currentRoomIndex = (this.currentRoomIndex + 1) % this.roomList.length;
        this.lastCheckTime = Game.time;
    },

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
            this.moveToNextRoom();
        } else {
            console.log(`[Nuker] 房间 ${nuker.room.name} 发射失败，错误代码：${result}`);
        }
        return result;
    },

    // 主运行逻辑
    run: function () {
        if (!this.shouldCheck()) return;

        const roomName = this.roomList[this.currentRoomIndex];
        const room = Game.rooms[roomName];

        if (!room) {
            console.log(`[Nuker] 无法访问房间 ${roomName}`);
            this.moveToNextRoom();
            return;
        }

        const nuker = room.nuker;
        const flag = Game.flags[this.flagName];

        if (!nuker || !flag) {
            if (!nuker) console.log(`[Nuker] 房间 ${roomName} 中未找到 Nuker`);
            if (!flag) console.log(`[Nuker] 未找到名为 '${this.flagName}' 的旗帜`);
            this.moveToNextRoom();
            return;
        }

        if (this.isNukerReady(nuker)) {
            if (Game.map.getRoomLinearDistance(roomName, flag.pos.roomName) <= 10) {
                this.launchNuke(nuker, flag);
                //console.log(`[Nuker] 房间 ${roomName} 成功发射核弹至 ${flag.pos}`);
            } else {
                console.log(`[Nuker] 目标 ${flag.pos} 超出房间 ${roomName} 的 Nuker 射程`);
                this.moveToNextRoom();
            }
        } else {
            const energy = nuker.store[RESOURCE_ENERGY] || 0;
            const ghodium = nuker.store[RESOURCE_GHODIUM] || 0;
            console.log(`[Nuker] 房间 ${roomName} 的 Nuker 不可用：` +
                `能量 ${energy}/${nuker.store.getCapacity(RESOURCE_ENERGY)}, ` +
                `GHODIUM ${ghodium}/${nuker.store.getCapacity(RESOURCE_GHODIUM)}`);
            this.moveToNextRoom();
        }
    }
};

export default nuker;
