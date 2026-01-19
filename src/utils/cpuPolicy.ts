export function getCpuTier() {
    const bucket = Game.cpu && typeof Game.cpu.bucket === 'number' ? Game.cpu.bucket : 10000;
    if (bucket < 2000) return 'low';
    if (bucket < 8000) return 'normal';
    return 'high';
}

export function getCpuMultiplier() {
    const tier = getCpuTier();
    if (tier === 'low') return 0.5;
    if (tier === 'high') return 2;
    return 1;
}

