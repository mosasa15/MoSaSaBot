import { nameData } from './nameData';

export default class InsectNameManager {
    /**
     * 初始化CreepNameTable名称注册表
     *
     * @param room Room对象
     */
    static init(room) {
        if (!Memory.rooms[room.name].insectNameManager) {
            Memory.rooms[room.name].insectNameManager = {
                // 所有的蛊虫类名字
                names: Object.keys(nameData),  // 改成 nameData
                // 当前可使用的名字
                index: 0
            };
        }
    }

    /**
     * 注册一个名字，用房间名包装好返回，转数和蛊虫类名结合
     * 1-5转为凡蛊，6-9转为仙蛊
     *
     * @param room Room对象
     */
    static registerName(room) {
        InsectNameManager.init(room);

        const nameManager = Memory.rooms[room.name].insectNameManager;
        const firstIndex = nameManager.index; // 记下刚开始的序号
        let isNamesEmpty = false; // 标记，判断蛊虫类名可用是否为空
        let insectName;

        // 转数数组
        const turns = ["一转", "二转", "三转", "四转", "五转", "六转", "七转", "八转", "九转"];
        
        // 随机选择一个转数作为前缀
        const turnPrefix = turns[Math.floor(Math.random() * turns.length)];

        // 判断转数是凡蛊还是仙蛊
        const isXianGu = turns.indexOf(turnPrefix) >= 5; // 6-9转为仙蛊

        // 获取对应的表情
        const guType = isXianGu ? "仙蛊🦋" : "凡蛊🐞";

        while (Game.creeps[Game.shard.name + room.name + ' ' + turnPrefix + nameManager.names[nameManager.index]]) {
            nameManager.index = (nameManager.index + 1) % nameManager.names.length;
            // 转回来了说明蛊虫类名用完了
            if (firstIndex === nameManager.index) {
                isNamesEmpty = true;
                break;
            }
        }

        if (!isNamesEmpty) {
            // 生成名字并添加转数前缀
            insectName = `【${guType}】 ${turnPrefix} ${nameManager.names[nameManager.index]}`;

            nameManager.index = (nameManager.index + 1) % nameManager.names.length;
        } else {
            // 拼一个随机的名字
            for (;;) {
                // 随机选择一个转数和蛊虫名
                const randomTurn = turns[Math.floor(Math.random() * turns.length)];
                insectName = `【${guType}】 ${randomTurn} ${nameManager.names[Math.floor(Math.random() * nameManager.names.length)]}`;
                if (!Game.creeps[Game.shard.name + room.name + ' ' + insectName]) break;
            }
        }

        // 返回名字，已包装【凡蛊】或【仙蛊】
        return insectName;
    }

    /**
     * 判断一个名字是否符合蛊虫类名字
     *
     * @param insectName 蛊虫名
     */
    static isInsectName(insectName) {
        return insectName in nameData;  // 改成 nameData
    }
}
