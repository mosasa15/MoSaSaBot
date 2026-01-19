/**  
 * 
 * 创建一个购买能源的订单  
 * 注意：此函数设计为在整个程序的运行周期内只创建一个订单。  
 */  
function createBuyOrderForEnergy(roomName) {  
    // 检查能量存储情况
    let room = Game.rooms[roomName];
    if (!room) return;
    if (!room.terminal) return;
    if (room.controller.level < 6 && !room.terminal) return;
    // 获取在市场中活跃 (activated) 和非活跃 (deactivated) 的购买能量的订单存到Memory中
    const orders = Game.market.getAllOrders({ resourceType: 'energy', type: ORDER_BUY });
    // const averagePrice = orders.reduce((acc, order) => acc + order.price, 0) / orders.length;
    // console.log(`市场平均价格为 averagePrice: [${averagePrice}]`);

    // 获取当前市场上的最高出价
    orders.sort((a, b) => b.price - a.price);
    const highestPrice = orders.length > 0 ? orders[0].price : 0;
    // 获取购买能量的房间并清除非活跃订单并删除非活跃订单
    for (let order in Game.market.orders) {
        const _order = Game.market.orders[order];
        // console.log(_order.roomName)
        if (_order.roomName !== roomName) return;
        const orderId = _order.id;
        const orderStatus = _order.active;

        if (!orderStatus) {
            // 将订单从内存中移除
            Game.rooms[_order.roomName].memory.energyOrder = undefined;
            Game.market.cancelOrder(orderId);
            return;
        }
        // 获取活跃的订单根据订单所属房间并将其存入到内存中
        if (orderStatus) {
            // 将能量订单存储到内存中
            if (_order.resourceType == RESOURCE_ENERGY && !Game.rooms[_order.roomName].memory.energyOrder) {
                // 将订单id存到内存中
                Game.rooms[_order.roomName].memory.energyOrder = _order.id;
                return;
            }
        }
    }

    // 检查房间的能量存储量
    const energyInTerminal = room.terminal ? room.terminal.store.energy : 0;
    const energyInStorage = room.storage ? room.storage.store.energy : 0;
    const totalEnergy = energyInTerminal + energyInStorage;
    //console.log(`当前房间[${room}], energyInTerminal:[${energyInTerminal}], energyInStorage[${energyInStorage}], totalEnergy[${totalEnergy}]`);

    // 如果能量低于阈值，则创建或更新购买订单
    let energyThreshold = 400000; // 定义的能量阈值
    if (highestPrice <= 10) {
        energyThreshold = 600000;
        if (room.storage.store.getCapacity() == 8000000) {
            energyThreshold = 6000000;
        }
    }
    // console.log(totalEnergy)
    if (totalEnergy < energyThreshold && energyThreshold - totalEnergy >= 10000) {
        const roomEnergyOrder = Game.market.getOrderById(room.memory.energyOrder);
        if (roomEnergyOrder) {
            // 更新价格 每100tick执行一次, 价格高于25则不进行更新
            if (Game.time % 100 == 0 && highestPrice <= 25 && roomEnergyOrder.price !== (highestPrice - 0.01)) {
                const newPrice = Math.max(roomEnergyOrder.price, highestPrice - 0.01);
                Game.market.changeOrderPrice(roomEnergyOrder.id, newPrice);
            }
        } else {
            // 如果已经有一笔订单则不再创建
            if (Game.rooms[room.name].memory.energyOrder !== undefined) {
                console.log('该房间已经创建了一个订单');
                return;
            }
            // 创建新订单 最多创建20K的订单,价格高于25则不进行创建
            if (highestPrice > 25) return;
            if (room.terminal.store.getFreeCapacity() <= 20000) return;
            Game.market.createOrder({
                type: ORDER_BUY,
                resourceType: 'energy',
                price: highestPrice - 0.001,
                totalAmount: Math.min(20000, energyThreshold - totalEnergy),
                roomName: room.name
            });
            //console.log(colorful('create', 'green'), `energy order in room`, colorful(room.name, 'blue'), `success`, `price [${highestPrice - 0.001}]`);
            
            return;
        }
    }
}  
// 导出函数以便在其他文件中使用  
export default {  
    createBuyOrderForEnergy  
};
