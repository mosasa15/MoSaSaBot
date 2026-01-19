import { errorMapper } from '../utils/errorMapper';

export const createApp = () => {
    const events = [];

    /** 添加执行函数, 使其在游戏循环中运行 */
    const add = (e) => {
        events.push(e);
    }

    /** 主执行逻辑 */
    const exec = () => {
        events.forEach((e) => e());

        if (global.nextTickClear.length > 0) {
            for (const id of global.nextTickClear) {
                RawMemory.segments[id] = '';
                console.log(`已清空内存段: ${id}`);
            }
            global.nextTickClear = [];
        }
    }

    let _MemoryCache;
    let lastTime = 0;
    const MemoryCacher = () => {
        if (_MemoryCache && lastTime && Game.time == lastTime + 1) {
            delete global.Memory;
            global.Memory = _MemoryCache;
            (RawMemory as any)._parsed = global.Memory;
        } else {
            _MemoryCache = global.Memory;
        }
        lastTime = Game.time;
    }

    const run = () => {
        // MemoryCacher();
        errorMapper(exec);
    }

    return { add, run }
}