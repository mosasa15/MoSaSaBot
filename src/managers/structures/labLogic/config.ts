// 从反应目标产物获取其底物的对应表
export const resourceCompoundMap = {  
    // 三级化合物  
    ['XGH2O']: ['GH2O', 'X'],              // GH系列三级化合物
    ['XGHO2']: ['GHO2', 'X'],              // GO系列三级化合物
    ['XLHO2']: ['LHO2', 'X'],              // LO系列三级化合物
    ['XLH2O']: ['LH2O', 'X'],              // LO系列三级化合物
    ['XZH2O']: ['ZH2O', 'X'],              // ZH系列三级化合物
    ['XZHO2']: ['ZHO2', 'X'],              // ZO系列三级化合物
    ['XUH2O']: ['UH2O', 'X'],              // UH系列三级化合物
    ['XUHO2']: ['UHO2', 'X'],              // UO系列三级化合物
    ['XKH2O']: ['KH2O', 'X'],              // KH系列三级化合物
    ['XKHO2']: ['KHO2', 'X'],              // KO系列三级化合物

    // 二级化合物  
    ['GH2O']: ['GH', 'OH'],                // GH系列二级化合物
    ['GHO2']: ['GO', 'OH'],                // GO系列二级化合物
    ['LHO2']: ['LO', 'OH'],                // LH系列二级化合物
    ['LH2O']: ['LH', 'OH'],                // LH系列二级化合物
    ['ZH2O']: ['ZH', 'OH'],                // ZH系列二级化合物
    ['ZHO2']: ['ZO', 'OH'],                // ZO系列二级化合物
    ['UH2O']: ['UH', 'OH'],                // UH系列二级化合物
    ['UHO2']: ['UO', 'OH'],                // UO系列二级化合物
    ['KH2O']: ['KH', 'OH'],                // KH系列二级化合物
    ['KHO2']: ['KO', 'OH'],                // KO系列二级化合物

    // 一级化合物  
    ['GH']: ['G', 'H'],                    // GH系列一级化合物
    ['GO']: ['G', 'O'],                    // GO系列一级化合物
    ['LO']: ['L', 'O'],                    // LO系列一级化合物
    ['LH']: ['L', 'H'],                    // LH系列一级化合物
    ['ZH']: ['Z', 'H'],                    // ZH系列一级化合物
    ['ZO']: ['Z', 'O'],                    // ZO系列一级化合物
    ['UH']: ['U', 'H'],                    // UH系列一级化合物
    ['UO']: ['U', 'O'],                    // UO系列一级化合物
    ['KH']: ['K', 'H'],                    // KH系列一级化合物
    ['KO']: ['K', 'O'],                    // KO系列一级化合物

    // 基础化合物  
    ['OH']: ['H', 'O'],                    // 基础化合物
    ['ZK']: ['Z', 'K'],                    // 基础化合物
    ['UL']: ['U', 'L'],                    // 基础化合物
    ['G']: ['ZK', 'UL'],                   // 基础化合物
};

export const labTarget = [
    // 基础
    { target: 'OH', number: 60000 },           // 基础化合物
    { target: 'ZK', number: 50000 },           // 基础化合物
    { target: 'UL', number: 50000 },           // 基础化合物
    { target: 'G', number: 50000 },           // 基础化合物
    
    // XGH2O 生产线，强化 升级
    { target: 'GH', number: 10000 },           // 一级
    { target: 'GH2O', number: 10000 },         // 二级
    { target: 'XGH2O', number: 10000 },        // 三级
    // XLHO2 生产线，强化 治疗
    { target: 'LO', number: 0 },               // 一级
    { target: 'LHO2', number: 0 },             // 二级
    { target: 'XLHO2', number: 0 },            // 三级
    // XLH2O 生产线，强化 维修
    { target: 'LH', number: 50000 },           // 一级
    { target: 'LH2O', number: 50000 },         // 二级
    { target: 'XLH2O', number: 50000 },        // 三级
    // XZHO2 生产线，强化 移动
    { target: 'ZO', number: 10000 },           // 一级
    { target: 'ZHO2', number: 10000 },         // 二级
    { target: 'XZHO2', number: 10000 },        // 三级
    // XZH2O 生产线，强化 攻击
    { target: 'ZH', number: 10000 },           // 一级
    { target: 'ZH2O', number: 10000 },         // 二级
    { target: 'XZH2O', number: 10000 },        // 三级
    // XUH2O 生产线，强化 攻击
    { target: 'UH', number: 20000 },           // 一级
    { target: 'UH2O', number: 20000 },         // 二级
    { target: 'XUH2O', number: 20000 },        // 三级
    // XKHO2 生产线，强化 防御
    { target: 'KH', number: 15000 },           // 一级
    { target: 'KH2O', number: 15000 },         // 二级
    { target: 'XKH2O', number: 15000 },        // 三级
    // XUHO2 生产线，强化 防御
    { target: 'UO', number: 15000 },           // 一级
    { target: 'UHO2', number: 15000 },         // 二级
    { target: 'XUHO2', number: 15000 },        // 三级
    // XGHO2 生产线，强化 抗击
    { target: 'GO', number: 10000 },           // 一级
    { target: 'GHO2', number: 10000 },         // 二级
    { target: 'XGHO2', number: 10000 },        // 三级
]; 