type AnyFn<T> = () => T;

export function safeRun<T>(label: string, fn: AnyFn<T>): T | undefined {
    try {
        return fn();
    } catch (e: any) {
        throttledError(label, e);
        return undefined;
    }
}

function throttledError(label: string, e: any): void {
    const key = `err:${label}`;
    const g: any = global as any;
    if (!g.__lastErrorTick) g.__lastErrorTick = {};
    if (g.__lastErrorTick[key] === Game.time) return;
    g.__lastErrorTick[key] = Game.time;
    const msg = e && e.stack ? String(e.stack) : String(e);
    console.log(`[Error] ${label}: ${msg}`);
}
