type LogLevel = 'debug' | 'info' | 'warn' | 'error';
 
const rank: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};
 
function getLevel(): LogLevel {
    const lvl = Memory.settings && (Memory.settings as any).logLevel;
    if (lvl === 'debug' || lvl === 'info' || lvl === 'warn' || lvl === 'error') return lvl;
    return 'info';
}
 
function shouldLog(level: LogLevel): boolean {
    return rank[level] >= rank[getLevel()];
}
 
function throttledKey(key: string): boolean {
    const g: any = global as any;
    if (!g.__logTick) g.__logTick = {};
    if (g.__logTick[key] === Game.time) return false;
    g.__logTick[key] = Game.time;
    return true;
}
 
export const Logger = {
    debug(tag: string, msg: string): void {
        if (!shouldLog('debug')) return;
        console.log(`[D] ${tag} ${msg}`);
    },
    info(tag: string, msg: string): void {
        if (!shouldLog('info')) return;
        console.log(`[I] ${tag} ${msg}`);
    },
    warn(tag: string, msg: string): void {
        if (!shouldLog('warn')) return;
        console.log(`[W] ${tag} ${msg}`);
    },
    error(tag: string, msg: string): void {
        if (!shouldLog('error')) return;
        console.log(`[E] ${tag} ${msg}`);
    },
    infoOncePerTick(key: string, tag: string, msg: string): void {
        if (!shouldLog('info')) return;
        if (!throttledKey(`info:${key}`)) return;
        console.log(`[I] ${tag} ${msg}`);
    }
};

