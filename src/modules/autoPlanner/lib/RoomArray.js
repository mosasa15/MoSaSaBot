class RoomArray {
    constructor() {
        this.arr = new Array(2500);
        this.init();
    }

    init() {
        for (let i = 0; i < 2500; i++) {
            this.arr[i] = 0;
        }
        return this;
    }

    exec(x, y, val) {
        let tmp = this.arr[x * 50 + y];
        this.set(x, y, val);
        return tmp;
    }

    get(x, y) {
        return this.arr[x * 50 + y];
    }

    set(x, y, value) {
        this.arr[x * 50 + y] = value;
    }

    forEach(func) {
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                func(x, y, this.get(x, y));
            }
        }
    }

    for4Direction(func, x, y, range = 1) {
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (let e of directions) {
            let xt = x + e[0];
            let yt = y + e[1];
            if (xt >= 0 && yt >= 0 && xt <= 49 && yt <= 49) {
                func(xt, yt, this.get(xt, yt));
            }
        }
    }

    forNear(func, x, y, range = 1) {
        for (let i = -range; i <= range; i++) {
            for (let j = -range; j <= range; j++) {
                let xt = x + i;
                let yt = y + j;
                if ((i || j) && xt >= 0 && yt >= 0 && xt <= 49 && yt <= 49) {
                    func(xt, yt, this.get(xt, yt));
                }
            }
        }
    }

    forBorder(func, range = 1) {
        for (let y = 0; y < 50; y++) {
            func(0, y, this.get(0, y));
            func(49, y, this.get(49, y));
        }
        for (let x = 1; x < 49; x++) {
            func(x, 0, this.get(x, 0));
            func(x, 49, this.get(x, 49));
        }
    }

    initRoomTerrainWalkAble(roomName) {
        const terrain = new Room.Terrain(roomName);
        this.forEach((x, y) => {
            const t = terrain.get(x, y);
            // 0: plain, 1: wall, 2: swamp
            // Original code: terrain.get(x, y) == 1 ? 0 : terrain.get(x, y) == 0 ? 1 : 2
            // If wall (1), walkable=0. If plain (0), walkable=1. If swamp (2), walkable=2?
            // Wait, TERRAIN_MASK_WALL is 1, TERRAIN_MASK_SWAMP is 2.
            // 0 is plain.
            // Original logic: 
            // 1 (wall) -> 0
            // 0 (plain) -> 1
            // 2 (swamp) -> 2
            let val = 1;
            if (t === TERRAIN_MASK_WALL) val = 0;
            else if (t === TERRAIN_MASK_SWAMP) val = 2;
            
            this.set(x, y, val);
        });
    }
}

export default RoomArray;
