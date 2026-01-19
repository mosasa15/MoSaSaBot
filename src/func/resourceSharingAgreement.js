/**
 * 资源共享协议
 * 用于多房间之间的资源共享
 */
// 初始化 Memory 中的资源来源表
if (!Memory.resourceSources) {
    Memory.resourceSources = {
        // 示例：资源类型作为键，值为提供该资源的房间数组
        // RESOURCE_HYDROGEN: [ 'W1N2', 'W3N4' ],
        // RESOURCE_KEANIUM: [ 'W5N6', 'W2N6' ],
    };
}
/**
 * 资源共享控制器
 */
const ResourceController = {
    /**
     * 注册房间为某种资源的提供者
     * @param {string} roomName - 房间名称
     * @param {string} resourceType - 资源类型
     */
    register(roomName, resourceType) {
        if (!Memory.resourceSources[resourceType]) {
            Memory.resourceSources[resourceType] = [];
        }
        if (!Memory.resourceSources[resourceType].includes(roomName)) {
            Memory.resourceSources[resourceType].push(roomName);
            console.log(`[资源共享协议] 房间 ${roomName} 注册为 ${resourceType} 的提供者`);
        } else {
            console.log(`[资源共享协议] 房间 ${roomName} 已经为 ${resourceType} 的提供者`);
        }
    },

    /**
     * 移除房间作为某种资源的提供者
     * @param {string} roomName - 房间名称
     * @param {string} resourceType - 资源类型
     */
    remove(roomName, resourceType) {
        const providers = Memory.resourceSources[resourceType];
        if (providers) {
            Memory.resourceSources[resourceType] = providers.filter(provider => provider !== roomName);
            console.log(`[资源共享协议] 房间 ${roomName} 从 ${resourceType} 提供者列表中移除`);
        }
    },

    /**
     * 处理资源共享请求
     * @param {string} resourceType - 资源类型
     * @param {number} amount - 所需资源数量
     * @param {string} requester - 请求资源的房间名称
     * @returns {boolean} - 是否成功找到提供者
     */
    handle(resourceType, amount, requester) {
        const providers = Memory.resourceSources[resourceType] || [];
        for (const provider of providers) {
            const providerRoom = Game.rooms[provider];
            if (providerRoom && providerRoom.terminal && providerRoom.terminal.store[resourceType] >= amount) {
                this.createShareTask(provider, resourceType, amount, requester);
                return true;
            }
        }
        console.log(`[资源共享协议] 无法为房间 ${requester} 提供资源 ${resourceType}`);
        return false;
    },

    /**
     * 创建共享任务
     * @param {string} provider - 提供资源的房间
     * @param {string} resourceType - 资源类型
     * @param {number} amount - 资源数量
     * @param {string} targetRoom - 目标房间名称
     */
    create(provider, resourceType, amount, targetRoom) {
        const task = {
            type: 'share',
            resourceType,
            amount,
            targetRoom,
        };
        if (!Memory.rooms[provider].tasks) {
            Memory.rooms[provider].tasks = [];
        }
        Memory.rooms[provider].tasks.push(task);
        console.log(`[资源共享协议] 创建任务：${provider} 向 ${targetRoom} 提供 ${amount} ${resourceType}`);
    },
};

export { ResourceController };
