var Lab = {
    /**  
     * 根据Lab的职责执行相应的操作  
     * @param {StructureLab} lab - 房间内的0号Lab
     */  
    //----------------------------------------------------------------------主运行模块-------------------------------------------------------------
    run: function( roomName )  {  
        // console.log(lab.room.name)
        // 从反应目标产物获取其底物的对应表
        const resourceCompoundMap = {  
            // 三级化合物  
            ['XGH2O']: ['GH2O', 'X'],              // GH系列三级化合物
            ['XGHO2']: ['GHO2', 'X'],              // GO系列三级化合物
            ['XLHO2']: ['LHO2', 'X'],              // LO系列三级化合物
            ['XLH2O']: ['LH2O', 'X'],              // LO系列三级化合物
            ['XZH2O']: ['ZH2O', 'X'],              // ZH系列三级化合物
            ['XZHO2']: ['ZHO2', 'X'],              // ZO系列三级化合物
            ['XGHO2']: ['GHO2', 'X'],              // GO系列三级化合物
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
            ['GHO2']: ['GO', 'OH'],                // GO系列二级化合物
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
        
        const labTarget = [
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
        
        // console.log(labTarget.length)
        //console.log(RESOURCE_HYDROGEN)
        // if( roomName === 'E55N9'){
        //     console.log(resourceCompoundMap[labTarget[Memory.rooms[roomName].labs.targetIndex].target][0])
        // }
        //console.log(labTarget[0].target)     //使用实例，获取目标索引的属性。
        //--------------------------------------------------------------------------------------------------------------------------------------------
        // 获取当前房间的内存    (初始化)

        const roomMemory = Memory.rooms[roomName].labs; 
        let room = Game.rooms[roomName];
        const labs = room.lab;
        if(!roomMemory){
            Memory.rooms[roomName].labs = {};
            Memory.rooms[roomName].labs.inLabs = labs.slice(0, 2).map(lab => lab.id);  
            Memory.rooms[roomName].labs.outLabs = {}; 
            for (let i = 2; i < labs.length; i++) {  
                Memory.rooms[roomName].labs.outLabs[labs[i].id] = 0; // 假设每个 lab 对象都有一个唯一的 id 属性  
            }  
            Memory.rooms[roomName].labs.state = 'getTarget';
            Memory.rooms[roomName].labs.targetIndex = 0;
            Memory.rooms[roomName].labs.targetAmount = 0;
            return;
        }
        for(let lab of labs){
            // 检查Lab的职责 
            if (roomMemory.inLabs.includes(lab.id)) {  
                // 作为InLab的行为  
                this.runAsInLab(lab, roomMemory, resourceCompoundMap, labTarget, labs);  
            } 
            else if (Object.keys(roomMemory.outLabs).includes(lab.id)) {  
                // 否则作为OutLab的行为  
                this.runAsOutLab(lab, roomMemory, resourceCompoundMap, labTarget, labs);  
            }  
        }
    },  
    //-----------------------------------------------------------------------目标指定模块----------------------------------------------------------
    /**
     * 指定Lab的目标资源
     * @param {StructureLab} lab - 当前操作的Lab对象
     * @param {string} labTarget - 目标列表
     */
    setTargetResource: function(lab, targetIndex, resourceCompoundMap, labTarget) {
                /**
         * 目标指定
        目标是指提前安排好的工作目标中的一个。lab 会在上一个目标完成之后开始进行新的目标挑选，当满足下面条件后将会将其确定为自己接下来要制作的目标：
        该目标化合物在 terminal 中的储量不达标
        该目标化合物所需要的基础原料都已经存在于 terminal 里（保证不会因原料不足而暂停合成，由数量检查模块负责）
         */
        if ( this.checkResourceAmountInTerminal(lab, labTarget[targetIndex].target, labTarget[targetIndex].number)   //检查目标化合物的储量
        &&  !this.checkResourceAmountInTerminal(lab, resourceCompoundMap[labTarget[targetIndex].target][0], Math.min(labTarget[targetIndex].number, 2000))   //检查目标化合物的0号底物的储量
        &&  !this.checkResourceAmountInTerminal(lab, resourceCompoundMap[labTarget[targetIndex].target][1], Math.min(labTarget[targetIndex].number, 2000))){ //检查目标化合物的1号底物的储量
            //若执行此处程序，则说明条件满足，确定制作的目标
            // 这里可以假设 targetAmount 是目标化合物需要的总数量，但不超过2000  
            let targetAmount = Math.min(labTarget[targetIndex].number, 2000);  
            targetAmount = Math.floor(targetAmount / 5) * 5;   //两者取最小值，并找到能被5整除的最大数值（因为化合物反应是1次5个，这么做是为了防止 inLab 中残留底物） 
            //----------------------------------------------------------------------------------------
            Memory.rooms[lab.room.name].labs.targetAmount = targetAmount;  
            Memory.rooms[lab.room.name].labs.state = 'getResource';
            //----------------------------------------------------------------------------------------待完成getResource阶段，启动上述程序
        } else {   //若执行此处程序，说明条件不满足，跳过此目标筛选下一个制作目标
            if(targetIndex === labTarget.length - 1){
                Memory.rooms[lab.room.name].labs.targetIndex = 0;
            } else {
                Memory.rooms[lab.room.name].labs.targetIndex = targetIndex + 1;
            }
        }
    },
        
        //-----------------------------------------------------------------------Terminal数量检查模块----------------------------------------------------------
    /**
     * 检查Terminal中资源的数量是否满足要求
     * @param {StructureLab} lab - 当前操作的Lab对象
     * @param {string} resourceType - 资源类型
     * @param {number} amount - 需要的资源数量
     * @returns {boolean} - 是否满足数量要求
     */
    checkResourceAmountInTerminal: function(lab, resourceType, amount) {
        const terminal = lab.room.terminal;
        const storage = lab.room.storage;
        //console.log(resourceType)
        return terminal.store[resourceType] + storage.store[resourceType]  < amount;
    },
    // //-----------------------------------------------------------------------Storage数量检查模块----------------------------------------------------------
    // /**
    //  * 检查Storage中资源的数量是否满足要求
    //  * @param {StructureLab} lab - 当前操作的Lab对象
    //  * @param {string} resourceType - 资源类型
    //  * @param {number} amount - 需要的资源数量
    //  * @returns {boolean} - 是否满足数量要求
    //  */
    // checkResourceAmountInStorage: function(lab, resourceType, amount) {
    //     const terminal = lab.room.terminal;
    //     //console.log(resourceType)
    //     return terminal.store[resourceType] <= amount;
    // },

    //-----------------------------------------------------------------------物流发布模块----------------------------------------------------------
    /**
     * 发布物流任务
     * @param {StructureLab} lab - 当前操作的Lab对象
     * @param {string} taskType - 任务类型（例如：'withdraw' 或 'transfer'）
     * @param {string} resourceType - 资源类型 
     * @param {number} amount - 资源数量
     */
    releaseTask: function(lab, taskType, resourceType, amount) {
        const task = {
            labId: lab.id,
            type: taskType,
            resourceType: resourceType,
            amount: amount
        };
        Memory.rooms[lab.room.name].tasks.push(task);
    },
    //-----------------------------------------------------------------------实际工作模块----------------------------------------------------------
    /**  
     * 执行InLab的特定行为  
     * @param {StructureLab} lab - InLab对象  
     * @param {Object} roomMemory - 房间内所有Lab的内存信息  
     */  
    runAsInLab: function(lab, roomMemory, resourceCompoundMap, labTarget, labs) {  
        /** 
         * 检查 targetIndex，没有则新建
         * 通过 targetIndex 获取目标,调用目标指定模块
         * 调用 数量检查模块，查看 tarminal 中的资源是否可以合成当前目标
         * 可以合成，将 state 置为 getResource，将资源检查模块返回值设置到 targetAmount (注意不能超过两千)，return
         * 不可以合成，将 targetIndex 置为下一个，return
         */
        if (roomMemory.state === 'getTarget') {
            const targetIndex = Memory.rooms[lab.room.name].labs.targetIndex;
            this.setTargetResource(lab, targetIndex, resourceCompoundMap, labTarget);
        }
        /**
         * getResource 阶段
        两个输入 lab 是否有足够数量的底物？
            有，将 state 置为 working，return
        通过 targetAmount 检查 terminal 终端中的底物数量是否足够
            足够，发布物流任务，return
        移除 targetAmount, targetIndex + 1 或 = 0，将 state 置为 getTarget，return
         */
        else if (roomMemory.state === 'getResource') {
            const targetIndex = Memory.rooms[lab.room.name].labs.targetIndex;
            const targetAmount = Memory.rooms[lab.room.name].labs.targetAmount;
            const resourceType_0 = resourceCompoundMap[labTarget[targetIndex].target][0];
            const resourceType_1 = resourceCompoundMap[labTarget[targetIndex].target][1];
            const tasksList = Memory.rooms[lab.room.name].tasks;
            if(tasksList.some(task => task.type === 'withdraw')){
                return;
            }
            if(lab.id === Memory.rooms[lab.room.name].labs.inLabs[0]){  //0号Lab自检
                if(lab.store[resourceType_0] < targetAmount){
                    if(!tasksList.some(task => task.type === 'withdraw')){
                        //console.log('0号Lab发送物流任务')
                        this.releaseTask(lab, 'withdraw', resourceType_0, targetAmount)
                    }
                } else if(lab.store[resourceType_0] === targetAmount){
                    //console.log('第0号Lab自检通过，等待1号lab自检通过')
                }
            } else if(lab.id === Memory.rooms[lab.room.name].labs.inLabs[1]){  //1号Lab自检                       
                if(lab.store[resourceType_1] < targetAmount){
                    if(!tasksList.some(task => task.type === 'withdraw')){
                        //console.log('1号Lab发送物流任务')
                        this.releaseTask(lab, 'withdraw', resourceType_1, targetAmount)
                    }
                } else if(lab.store[resourceType_1] === targetAmount){
                    //console.log('第1号lab自检通过，准备启动反应程序')
                }
            }
            if (labs[0].store[resourceType_0] >= targetAmount && labs[1].store[resourceType_1] >= targetAmount) {  
                //console.log('已通过自检，启动反应程序');
                Memory.rooms[lab.room.name].labs.state = 'working';  
            }
        }
    },  

    /**  
     * 执行OutLab的特定行为  
     * @param {StructureLab} lab - OutLab对象  
     * @param {Object} roomMemory - 房间内所有Lab的内存信息  
     */  
    runAsOutLab: function(lab, roomMemory, resourceCompoundMap, labTarget, labs) {  
        // 在 working 阶段，OutLab 不需要执行任何操作
        if (roomMemory.state === 'working') {
            const targetIndex = Memory.rooms[lab.room.name].labs.targetIndex;
            const resourceType_0 = resourceCompoundMap[labTarget[targetIndex].target][0];
            const resourceType_1 = resourceCompoundMap[labTarget[targetIndex].target][1];
            
            lab.runReaction(labs[0], labs[1]);

            if(labs[0].store[resourceType_0] === 0 || labs[1].store[resourceType_1] === 0){
                Memory.rooms[lab.room.name].labs.state = 'putResource';  
            }
        }
        // 在 putResource 阶段，OutLab 需要将产物移出 Lab
        else if (roomMemory.state === 'putResource') {
            const tasksList = Memory.rooms[lab.room.name].tasks;
            if(tasksList.some(task => task.type === 'transfer')){
                return;
            }
            for (let i = 2; i < labs.length; i++) {  
                if (labs[i].store[labs[i].mineralType] > 0) {  
                    if(!tasksList.some(task => task.type === 'transfer')){
                    this.releaseTask(labs[i], 'transfer', null, null)
                    }
                } else if(labs[i].store[labs[i].mineralType] === undefined ){
                    console.log('已经移除掉全部产物');
                    Memory.rooms[labs[i].room.name].labs.state = 'getTarget';  
                }
            }
        }
    },
};

export default Lab;