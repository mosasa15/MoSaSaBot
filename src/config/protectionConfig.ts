export const DOWNGRADE_PROTECTION = {
    // 掉级预警阈值（百分比）：当 ticksToDowngrade 低于最大值的该百分比时触发警告
    WARNING_THRESHOLD_PERCENT: 0.5, 
    
    // 紧急阈值（Ticks）：当 ticksToDowngrade 低于此值时触发最高优先级升级
    // 5000 ticks 约为 3-5 小时，给足反应时间
    CRITICAL_THRESHOLD_TICKS: 5000,

    // 通知设置
    ENABLE_NOTIFY: true,
    NOTIFY_INTERVAL: 100, // 多少 tick 检查/通知一次，避免刷屏
};
