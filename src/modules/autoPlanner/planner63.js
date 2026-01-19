import PriorityQueue from './lib/PriorityQueue.js';
import UnionFind from './lib/UnionFind.js';
import RoomArray from './lib/RoomArray.js';

const minPlaneCnt = 140;

function newNode(k, x, y, v) {
    return { k, x, y, v };
}

class Planner63 {
    constructor() {
        this.visited = null;
        this.roomWalkable = null;
        this.nearWall = null;
        this.routeDistance = null;
        this.roomObjectCache = null;
        this.nearWallWithInterpolation = null;
        this.interpolation = null;

        this.queMin = null;
        this.queMin2 = null;
        this.startPoint = null;

        this.unionFind = null;
        this.objects = [];
    }

    ensureAllocated() {
        if (!this.visited) this.visited = new RoomArray();
        if (!this.roomWalkable) this.roomWalkable = new RoomArray();
        if (!this.nearWall) this.nearWall = new RoomArray();
        if (!this.routeDistance) this.routeDistance = new RoomArray();
        if (!this.roomObjectCache) this.roomObjectCache = new RoomArray();
        if (!this.nearWallWithInterpolation) this.nearWallWithInterpolation = new RoomArray();
        if (!this.interpolation) this.interpolation = new RoomArray();

        if (!this.queMin) this.queMin = new PriorityQueue(true);
        if (!this.queMin2) this.queMin2 = new PriorityQueue(true);
        if (!this.startPoint) this.startPoint = new PriorityQueue(true);

        if (!this.unionFind) this.unionFind = new UnionFind(50 * 50);
    }

    init() {
        this.ensureAllocated();
        this.visited.init();
        this.roomWalkable.init();
        this.nearWall.init();
        this.routeDistance.init();
        this.roomObjectCache.init();
        this.nearWallWithInterpolation.init();
        this.interpolation.init();
        this.unionFind.init();

        this.queMin.clear();
        this.queMin2.clear();
        this.startPoint.clear();

        this.objects = [];
    }

    dismiss() {
        this.visited = null;
        this.roomWalkable = null;
        this.nearWall = null;
        this.routeDistance = null;
        this.roomObjectCache = null;
        this.nearWallWithInterpolation = null;
        this.interpolation = null;
        this.queMin = null;
        this.queMin2 = null;
        this.startPoint = null;
        this.unionFind = null;
        this.objects = [];
    }

    computeLayout(room) {
        if (!room) return null;
        const controller = room.controller;
        const mineral = room.find(FIND_MINERALS)[0];
        const sources = room.find(FIND_SOURCES).sort((a, b) => (a.id > b.id ? 1 : -1));
        if (!controller || !mineral || sources.length === 0) return null;

        const points = [
            { pos: controller.pos },
            { pos: mineral.pos },
            ...sources.map(s => ({ pos: s.pos }))
        ];

        return this.computeManorWithCache(room.name, points);
    }

    computeManorWithCache(roomName, points, blocked) {
        if (!global.layoutCache) global.layoutCache = {};
        if (global.layoutCache[roomName]) return global.layoutCache[roomName];

        const result = this.computeManor(roomName, points, blocked);
        if (result) global.layoutCache[roomName] = result;
        return result;
    }

    computeManor(roomName, points, blocked) {
        this.init();

        for (const p of points) {
            if (p.pos && p.pos.roomName === roomName) this.objects.push(p.pos);
        }

        const blockArray = this.computeBlock(roomName, blocked);
        const unionFind = blockArray[0];
        const sizeMap = blockArray[1];
        const wallMap = {};
        const roomWalkable = blockArray[2];
        const nearWall = blockArray[3];
        const putAbleCacheMap = blockArray[4];
        const allCacheMap = blockArray[5];

        const roomManor = this.interpolation;
        const roomStructs = this.nearWallWithInterpolation;

        roomManor.init();
        roomStructs.init();
        nearWall.init();
        this.queMin.clear();

        let finalPos = undefined;
        let wallCnt = 1e9;
        let putAbleList = [];
        let innerPutAbleList = [];

        let centerX = undefined;
        let centerY = undefined;

        Object.keys(sizeMap).forEach(posKey => {
            const pos = Number(posKey);
            this.getBlockPutAbleCnt(roomWalkable, this.visited, this.queMin, unionFind, pos, putAbleCacheMap, allCacheMap);
            const currentPutAbleList = putAbleCacheMap[pos];
            const allList = allCacheMap[pos];

            if (!currentPutAbleList || currentPutAbleList.length < minPlaneCnt) return;

            wallMap[pos] = [];
            this.visited.init();
            roomWalkable.forBorder((x, y, val) => {
                if (val) {
                    this.queMin.push(newNode(0, x, y));
                    this.visited.set(x, y, 1);
                }
            });

            const currentRoomManor = this.routeDistance;
            currentRoomManor.init();
            allList.forEach(e => currentRoomManor.set(e.x, e.y, 1));

            this.queMin.whileNoEmpty(nd => {
                if (!currentRoomManor.get(nd.x, nd.y)) {
                    roomWalkable.forNear((x, y, val) => {
                        if (!this.visited.exec(x, y, 1) && val) {
                            if (!currentRoomManor.get(x, y)) this.queMin.push(newNode(nd.k + 1, x, y));
                            else wallMap[pos].push(newNode(0, x, y));
                        }
                    }, nd.x, nd.y);
                }
            });

            const currentInnerPutAbleList = currentPutAbleList;
            let maxDist = 0;
            const filter2 = currentInnerPutAbleList.filter(e => e.k > 2);
            if (filter2.length < 30) {
                filter2.forEach(a => {
                    filter2.forEach(b => {
                        maxDist = Math.max(maxDist, Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
                    });
                });
            }

            const currentWallCnt = wallMap[pos].length;
            if (
                minPlaneCnt < currentPutAbleList.length &&
                wallCnt > currentWallCnt &&
                (currentInnerPutAbleList.filter(e => e.k > 1).length > 30 || maxDist > 5)
            ) {
                putAbleList = currentPutAbleList;
                innerPutAbleList = currentInnerPutAbleList;
                wallCnt = currentWallCnt;
                finalPos = pos;

                centerX = currentPutAbleList.map(e => e.x).reduce((a, b) => a + b) / currentPutAbleList.length;
                centerY = currentPutAbleList.map(e => e.y).reduce((a, b) => a + b) / currentPutAbleList.length;
            }
        });

        if (!putAbleCacheMap[finalPos]) return null;

        const walls = wallMap[finalPos];

        roomManor.init();
        allCacheMap[finalPos].forEach(e => roomManor.set(e.x, e.y, -1));
        innerPutAbleList.forEach(e => roomManor.set(e.x, e.y, e.k));

        let storageX = 0;
        let storageY = 0;
        let storageDistance = 100;

        innerPutAbleList.filter(e => e.k > 2).forEach(e => {
            const detX = centerX - e.x;
            const detY = centerY - e.y;
            const distance = Math.sqrt(detX * detX + detY * detY);
            if (storageDistance > distance) {
                storageDistance = distance;
                storageX = e.x;
                storageY = e.y;
            }
        });

        let labX = 0;
        let labY = 0;
        let labDistance = 1e5;

        roomManor.forEach((x, y, val) => {
            if (val >= 2) {
                const distance = Math.sqrt(Math.pow(storageX - x - 1.5, 2) + Math.pow(storageY - y - 1.5, 2));
                if (labDistance <= distance) return;
                let checkCnt = 0;
                const check = (cx, cy) => {
                    if (roomManor.get(cx, cy) > 0 && Math.abs(cx - storageX) + Math.abs(cy - storageY) > 2) checkCnt += 1;
                };
                for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) check(x + i, y + j);
                if (checkCnt === 16) {
                    labDistance = distance;
                    labX = x;
                    labY = y;
                }
            }
        });
        labX += 1;
        labY += 1;

        const structMap = {};
        Object.keys(CONTROLLER_STRUCTURES).forEach(e => (structMap[e] = []));

        structMap.link = this.roomObjectCache.link || [];
        structMap.container = this.roomObjectCache.container || [];
        structMap.extractor = this.roomObjectCache.extractor || [];

        structMap.storage.push([storageX - 1, storageY]);
        structMap.terminal.push([storageX, storageY + 1]);
        structMap.factory.push([storageX + 1, storageY]);
        structMap.link.push([storageX, storageY - 1]);
        structMap.powerSpawn.push([storageX + 1, storageY + 1]);
        structMap.spawn.push([storageX + 1, storageY - 1]);

        const centerBuildings = ['storage', 'link', 'factory', 'terminal', 'spawn', 'powerSpawn'];
        centerBuildings.forEach(type => {
            structMap[type].forEach(([x, y]) => roomStructs.set(x, y, type));
        });

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const x = storageX + i + j;
                const y = storageY + i - j;
                if (roomStructs.get(x, y) && roomStructs.get(x, y) !== 'road') continue;
                structMap.road.push([x, y]);
            }
        }

        const labs = ['☢-☢☢', '-☢-☢', '☢-☢-', '☢☢-☢'];
        let labChangeDirection = false;
        if ((storageX - labX) * (storageY - labY) < 0) labChangeDirection = true;

        const vis = {};
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                vis[`${i}_${j}`] = 1;
                const jj = labChangeDirection ? j : 1 - j;
                const structs = labs[i + 1].charAt(j + 1);
                if (structs === '☢') structMap.lab.push([labX + i, labY + jj]);
                else structMap.road.push([labX + i, labY + jj]);
            }
        }

        for (let i = -1; i < 3; i++) {
            for (let j = -1; j < 3; j++) {
                if (vis[`${i}_${j}`]) continue;
                const jj = labChangeDirection ? j : 1 - j;
                const structs = labs[i + 1].charAt(j + 1);
                if (structs === '☢') structMap.lab.push([labX + i, labY + jj]);
                else structMap.road.push([labX + i, labY + jj]);
            }
        }

        walls.forEach(e => structMap.rampart.push([e.x, e.y]));

        Object.keys(CONTROLLER_STRUCTURES).forEach(struct => structMap[struct].forEach(e => roomStructs.set(e[0], e[1], struct)));
        structMap.road.forEach(e => roomStructs.set(e[0], e[1], 1));

        const setModel = (xx, yy) => {
            const checkAble = (x, y) => x >= 0 && y >= 0 && x <= 49 && y <= 49 && roomManor.get(x, y) > 0 && !roomStructs.get(x, y);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const x = xx + i + j;
                    const y = yy + i - j;
                    if (checkAble(x, y)) {
                        if (i || j) roomStructs.set(x, y, 1);
                        else roomStructs.set(x, y, 12);
                    }
                }
            }
            for (const e of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const x = xx + e[0];
                const y = yy + e[1];
                if (checkAble(x, y)) roomStructs.set(x, y, 8);
            }
        };

        for (let i = 0; i < 50; i += 4) {
            for (let j = 0; j < 50; j += 4) {
                const x = (storageX % 4) + i;
                const y = (storageY % 4) + j;
                setModel(x, y);
                setModel(x + 2, y + 2);
            }
        }

        this.visited.init();
        this.visited.set(storageX, storageY, 1);
        this.queMin.push(newNode(1, storageX, storageY));

        const costRoad = this.routeDistance;
        costRoad.init();
        this.queMin.whileNoEmpty(nd => {
            roomStructs.forNear((x, y, val) => {
                if (!this.visited.exec(x, y, 1) && val > 0) this.queMin.push(newNode(nd.k + val, x, y));
            }, nd.x, nd.y);
            costRoad.set(nd.x, nd.y, nd.k);
        });

        structMap.road.forEach(e => roomStructs.set(e[0], e[1], 'road'));

        costRoad.forEach((x, y, val) => {
            if (!val) return;
            let minVal = 50;
            costRoad.forNear((x1, y1, v) => {
                if (minVal > v && v > 0) minVal = v;
            }, x, y);
            costRoad.forNear((x1, y1, v) => {
                if (minVal === v && v > 0) roomStructs.set(x1, y1, 'road');
            }, x, y);
        });

        let spawnPos = [];
        let extensionPos = [];
        roomStructs.forEach((x, y, val) => {
            if (val > 0) {
                let dist = 100;
                costRoad.forNear((x1, y1, v) => {
                    if (v) dist = Math.min(dist, v);
                }, x, y);
                if (val === 12) spawnPos.push([x, y, dist]);
                else extensionPos.push([x, y, dist]);
            }
        });

        const cmpFunc = (a, b) => (a[2] === b[2] ? (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]) : a[2] - b[2]);
        spawnPos = spawnPos.sort(cmpFunc);
        extensionPos = extensionPos.sort(cmpFunc);

        let oriStruct = [];
        let putList = [];
        ['spawn', 'nuker', 'powerSpawn', 'tower', 'observer'].forEach(struct => {
            const total = CONTROLLER_STRUCTURES[struct][8];
            const alreadyPlaced = structMap[struct].length;
            let need = total - alreadyPlaced;
            if (need < 0) need = 0;
            for (let i = 0; i < need; i++) oriStruct.push(struct);
        });

        oriStruct.forEach(struct => {
            let e = spawnPos.shift();
            if (!e) e = extensionPos.shift();
            if (!e) return;
            structMap[struct].push([e[0], e[1]]);
            putList.push([e[0], e[1], struct]);
        });

        extensionPos.push(...spawnPos);
        extensionPos = extensionPos.sort(cmpFunc);
        let extCnt = 60;
        extensionPos.forEach(e => {
            if (extCnt > 0) {
                structMap.extension.push([e[0], e[1]]);
                putList.push([e[0], e[1], 'extension']);
                extCnt -= 1;
            }
        });

        roomStructs.init();
        Object.keys(CONTROLLER_STRUCTURES).forEach(struct => structMap[struct].forEach(e => roomStructs.set(e[0], e[1], struct)));

        this.visited.init();
        structMap.road.forEach(e => this.visited.set(e[0], e[1], 1));

        putList.forEach(e => {
            const x = e[0];
            const y = e[1];
            let minVal = 50;
            costRoad.forNear((x1, y1, val) => {
                if (minVal > val && val > 0) minVal = val;
            }, x, y);
            costRoad.forNear((x1, y1, val) => {
                if (minVal === val && val > 0) roomStructs.set(x1, y1, 'road');
            }, x, y);
        });

        roomStructs.forEach((x, y, val) => {
            if (val == 'link' || val == 'container') return;
            if (!val instanceof String || val > -1) return;
            let minVal = 50;
            costRoad.forNear((x1, y1, v) => {
                if (minVal > v && v > 0) minVal = v;
            }, x, y);
            costRoad.forNear((x1, y1, v) => {
                if (minVal == v && v > 0) {
                    if (!this.visited.exec(x1, y1, 1)) structMap.road.push([x1, y1]);
                }
            }, x, y);
        });

        const costs = new PathFinder.CostMatrix();
        const terrain = new Room.Terrain(roomName);
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                const te = terrain.get(i, j);
                costs.set(
                    i,
                    j,
                    te == TERRAIN_MASK_WALL ? 255 : (te == TERRAIN_MASK_SWAMP ? 4 : 2)
                );
            }
        }

        for (const struct of OBSTACLE_OBJECT_TYPES) {
            if (structMap[struct]) {
                structMap[struct].forEach(e => costs.set(e[0], e[1], 255));
            }
        }

        structMap.road.forEach(e => costs.set(e[0], e[1], 1));

        if (structMap.storage && structMap.storage[0]) {
            const [sx, sy] = structMap.storage[0];
            const startPos = new RoomPosition(sx, sy, roomName);

            structMap.container.sort(
                e => Math.sqrt((e[0] - sx) * (e[0] - sx) + (e[1] - sy) * (e[1] - sy))
            );

            structMap.container.forEach(e => {
                const targetPos = new RoomPosition(e[0], e[1], roomName);
                const ret = PathFinder.search(
                    startPos,
                    { pos: targetPos, range: 1 },
                    { roomCallback: () => costs, maxRooms: 1 }
                );

                ret.path.forEach(pos => {
                    if (costs.get(pos.x, pos.y) !== 1) {
                        structMap.road.push([pos.x, pos.y]);
                        costs.set(pos.x, pos.y, 1);
                    }
                });
            });
        }

        this.dismiss();

        return {
            roomName,
            structMap
        };
    }

    computeBlock(roomName, blocked) {
        this.roomWalkable.initRoomTerrainWalkAble(roomName);

        this.roomWalkable.forEach((x, y, val) => {
            if (!val) {
                this.queMin.push(newNode(0, x, y));
                this.visited.set(x, y, 1);
            }
        });

        this.queMin.whileNoEmpty(nd => {
            this.roomWalkable.for4Direction((x, y, val) => {
                if (!this.visited.exec(x, y, 1) && val) this.queMin.push(newNode(nd.k + 1, x, y));
            }, nd.x, nd.y);
            this.nearWall.exec(nd.x, nd.y, nd.k);
        });

        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x1, y1, v1) => {
                    if (v1) {
                        this.nearWall.set(x1, y1, 50);
                        this.queMin.push(newNode(0, x1, y1));
                    }
                }, x, y);
                this.queMin.push(newNode(0, x, y));
                this.nearWall.set(x, y, 50);
            }
        });

        const roomPutAble = this.routeDistance;
        roomPutAble.initRoomTerrainWalkAble(roomName);
        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x1, y1, v1) => {
                    if (v1) roomPutAble.set(x1, y1, 0);
                }, x, y);
                roomPutAble.set(x, y, 0);
            }
        });

        const getObjectPos = (x, y, struct) => {
            let put = false;
            let finalX = 0;
            let finalY = 0;

            roomPutAble.for4Direction((x1, y1, v) => {
                if (v && !put && !this.roomObjectCache.get(x1, y1)) {
                    finalX = x1;
                    finalY = y1;
                    put = true;
                }
            }, x, y);

            roomPutAble.forNear((x1, y1, v) => {
                if (v && !put && !this.roomObjectCache.get(x1, y1)) {
                    finalX = x1;
                    finalY = y1;
                    put = true;
                }
            }, x, y);

            this.roomObjectCache.set(finalX, finalY, struct);
            return [finalX, finalY];
        };

        for (let i = 0; i < this.objects.length; i++) {
            const pos = this.objects[i];
            const containerPos = getObjectPos(pos.x, pos.y, 'container');

            if (i === 1) {
                this.roomObjectCache.extractor = [[pos.x, pos.y]];
                this.roomObjectCache.container = this.roomObjectCache.container || [];
                this.roomObjectCache.container.push(containerPos);
                continue;
            }

            if (i === 0) {
                const linkPos = getObjectPos(containerPos[0], containerPos[1], 'link');
                this.roomObjectCache.link = this.roomObjectCache.link || [];
                this.roomObjectCache.link.push(linkPos);
                this.roomObjectCache.container = this.roomObjectCache.container || [];
                this.roomObjectCache.container.unshift(containerPos);
                continue;
            }

            const nearSpots = [];
            roomPutAble.forNear((x, y, val) => {
                if (val && !this.roomObjectCache.get(x, y)) nearSpots.push([x, y]);
            }, containerPos[0], containerPos[1]);

            nearSpots.sort((a, b) => {
                const da = Math.abs(a[0] - containerPos[0]) + Math.abs(a[1] - containerPos[1]);
                const db = Math.abs(b[0] - containerPos[0]) + Math.abs(b[1] - containerPos[1]);
                return da - db;
            });

            const link1 = nearSpots[0];
            const link2 = nearSpots[1];

            this.roomObjectCache.link = this.roomObjectCache.link || [];
            if (link1) this.roomObjectCache.link.push(link1);
            if (link2) this.roomObjectCache.link.push(link2);

            this.roomObjectCache.container = this.roomObjectCache.container || [];
            this.roomObjectCache.container.unshift(containerPos);
        }

        this.nearWall.forEach((x, y, val) => {
            let value = -4 * val;
            this.nearWall.for4Direction((x1, y1, v1) => {
                value += v1;
            }, x, y);
            this.interpolation.set(x, y, value);
            if (value > 0) value = 0;
            if (val && this.roomWalkable.get(x, y)) this.nearWallWithInterpolation.set(x, y, val + value * 0.1);
        });

        if (blocked) {
            blocked.forEach((x, y, val) => {
                if (val) this.nearWallWithInterpolation.set(x, y, 0);
            });
        }

        this.visited.init();
        this.routeDistance.init();
        this.queMin.whileNoEmpty(nd => {
            this.roomWalkable.forNear((x, y, val) => {
                if (!this.visited.exec(x, y, 1) && val) this.queMin.push(newNode(nd.k + 1, x, y));
            }, nd.x, nd.y);
            this.routeDistance.set(nd.x, nd.y, nd.k);
        });

        this.routeDistance.forEach((x, y, val) => {
            if (!this.roomWalkable.get(x, y)) return;
            if (val) this.startPoint.push(newNode(-val, x, y));
        });

        const sizeMap = {};
        const posSeqMap = {};

        this.visited.init();
        for (let i = 0; i < 2500; i++) {
            if (this.startPoint.isEmpty()) break;
            let cnt = 0;
            const nd = this.startPoint.pop();
            const currentPos = nd.x * 50 + nd.y;
            if (blocked && blocked.get(nd.x, nd.y)) {
                this.unionFind.union(currentPos, 0);
                continue;
            }
            const posSeq = [];

            const dfsFindDown = (roomArray, x, y) => {
                const currentValue = roomArray.get(x, y);
                if (!this.visited.exec(x, y, 1)) {
                    roomArray.for4Direction((x1, y1, val) => {
                        if (val && (x1 === x || y1 === y) && val < currentValue) dfsFindDown(roomArray, x1, y1);
                    }, x, y);
                    const pos = x * 50 + y;
                    if (this.unionFind.find(pos) && this.unionFind.find(currentPos) && (!blocked || !blocked.get(x, y))) {
                        this.unionFind.union(currentPos, pos);
                        posSeq.push(pos);
                        cnt++;
                    } else if (blocked) this.unionFind.union(pos, 0);
                }
            };

            const dfsFindUp = (roomArray, x, y) => {
                const currentValue = roomArray.get(x, y);
                if (!this.visited.exec(x, y, 1)) {
                    roomArray.forNear((x1, y1, val) => {
                        if (val > currentValue && currentValue < 6) dfsFindUp(roomArray, x1, y1);
                        else if (val && val < currentValue) dfsFindDown(roomArray, x1, y1);
                    }, x, y);
                    const pos = x * 50 + y;
                    if (this.unionFind.find(pos) && this.unionFind.find(currentPos) && (!blocked || !blocked.get(x, y))) {
                        this.unionFind.union(currentPos, pos);
                        posSeq.push(pos);
                        cnt++;
                    } else if (blocked) this.unionFind.union(pos, 0);
                }
            };

            dfsFindUp(this.nearWallWithInterpolation, nd.x, nd.y);

            if (cnt > 0) {
                const pos = this.unionFind.find(currentPos);
                this.queMin.push(newNode(cnt, 0, 0, pos));
                sizeMap[pos] = cnt;
                posSeqMap[pos] = posSeq;
            }
        }

        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x1, y1, v1) => {
                    if (v1) {
                        const pos = this.unionFind.find(x1 * 50 + y1);
                        if (sizeMap[pos]) delete sizeMap[pos];
                    }
                }, x, y);
                const pos = this.unionFind.find(x * 50 + y);
                if (sizeMap[pos]) delete sizeMap[pos];
            }
        });
        delete sizeMap[0];

        const putAbleCacheMap = {};
        const allCacheMap = {};

        this.queMin.whileNoEmpty(nd => {
            const pos = nd.v;
            if (nd.k !== sizeMap[pos]) return;

            this.visited.init();
            const nearCntMap = {};

            posSeqMap[pos].forEach(e => {
                const y = e % 50;
                const x = (e - y) / 50;
                this.roomWalkable.forNear((x1, y1, val) => {
                    if (val && !this.visited.exec(x1, y1, 1)) {
                        const currentPos = this.unionFind.find(x1 * 50 + y1);
                        if (currentPos === pos) return;
                        const currentSize = sizeMap[currentPos];
                        if (currentSize < 300) nearCntMap[currentPos] = (nearCntMap[currentPos] || 0) + 1;
                    }
                }, x, y);
            });

            let targetPos = undefined;
            let nearCnt = 0;
            let maxRatio = 0;

            Object.keys(nearCntMap).forEach(currentPosKey => {
                const currentPos = Number(currentPosKey);
                const currentRatio = nearCntMap[currentPos] / Math.sqrt(Math.min(sizeMap[currentPos], nd.k));
                if (currentRatio === maxRatio ? sizeMap[currentPos] < sizeMap[targetPos] : currentRatio > maxRatio) {
                    targetPos = currentPos;
                    maxRatio = currentRatio;
                    nearCnt = nearCntMap[currentPos];
                }
            });

            Object.keys(nearCntMap).forEach(currentPosKey => {
                const currentPos = Number(currentPosKey);
                if (nearCnt < nearCntMap[currentPos]) {
                    targetPos = currentPos;
                    nearCnt = nearCntMap[currentPos];
                }
            });

            const minSize = sizeMap[targetPos];
            const cnt = nd.k + minSize;

            let targetBlockPutAbleCnt = 0;
            let ndkBlockPutAbleCnt = 0;

            if (minSize > minPlaneCnt) targetBlockPutAbleCnt = this.getBlockPutAbleCnt(this.roomWalkable, this.visited, this.queMin2, this.unionFind, targetPos, putAbleCacheMap, allCacheMap)[0].length;
            if (nd.k > minPlaneCnt) ndkBlockPutAbleCnt = this.getBlockPutAbleCnt(this.roomWalkable, this.visited, this.queMin2, this.unionFind, nd.v, putAbleCacheMap, allCacheMap)[0].length;

            if (targetPos && Math.max(targetBlockPutAbleCnt, ndkBlockPutAbleCnt) < minPlaneCnt) {
                this.unionFind.union(pos, targetPos);
                nd.v = this.unionFind.find(pos);

                if (pos !== nd.v) delete sizeMap[pos];
                else delete sizeMap[targetPos];

                nd.k = cnt;
                sizeMap[nd.v] = cnt;
                posSeqMap[nd.v] = posSeqMap[targetPos].concat(posSeqMap[pos]);
                delete putAbleCacheMap[nd.v];
                delete putAbleCacheMap[targetPos];
                if (pos !== nd.v) delete posSeqMap[pos];
                else delete posSeqMap[targetPos];
                this.queMin.push(newNode(nd.k, nd.x, nd.y, nd.v));
            }
        });

        return [this.unionFind, sizeMap, this.roomWalkable, this.nearWall, putAbleCacheMap, allCacheMap];
    }

    getBlockPutAbleCnt(roomWalkable, visited, queMin, unionFind, tarRoot, putAbleCacheMap, allCacheMap) {
        if (putAbleCacheMap[tarRoot]) return [putAbleCacheMap[tarRoot], allCacheMap[tarRoot]];

        const roomManor = this.routeDistance;
        roomManor.init();
        roomManor.forEach((x, y, val) => {
            if (tarRoot === unionFind.find(x * 50 + y)) roomManor.set(x, y, 1);
        });

        roomManor.forEach((x, y, val) => {
            if (val) {
                let manorCnt = 0;
                let wallCnt = 0;
                roomManor.for4Direction((x1, y1, val1) => {
                    if (val1) manorCnt += 1;
                    if (!roomWalkable.get(x1, y1)) wallCnt += 1;
                }, x, y);
                if (manorCnt === 1 && wallCnt === 0) roomManor.set(x, y, 0);
            }
        });

        const dfsMoreManor = (x, y, val) => {
            if (!val && roomWalkable.get(x, y)) {
                let manorCnt = 0;
                let wallCnt = 0;
                roomManor.for4Direction((x1, y1, val1) => {
                    if (val1) manorCnt += 1;
                    if (!roomWalkable.get(x1, y1)) wallCnt += 1;
                }, x, y);
                if (manorCnt >= 2 || (manorCnt === 1 && wallCnt >= 2)) {
                    roomManor.set(x, y, 1);
                    roomManor.for4Direction((x1, y1, val1) => dfsMoreManor(x1, y1, val1), x, y);
                }
            }
        };
        roomManor.forEach((x, y, val) => dfsMoreManor(x, y, val));

        roomWalkable.forBorder((x, y, val) => {
            if (val) {
                roomManor.forNear((x1, y1, v1) => roomManor.set(x1, y1, 0), x, y);
                roomManor.set(x, y, 0);
            }
        });

        const innerPutAbleList = [];
        const allCacheList = [];

        visited.init();
        roomWalkable.forEach((x, y, val) => {
            if (!roomManor.get(x, y)) queMin.push(newNode(val ? -4 : -1, x, y));
        });

        queMin.whileNoEmpty(nd => {
            const func = (x, y, val) => {
                const item = newNode(nd.k + 2, x, y);
                if (!visited.exec(x, y, 1)) {
                    queMin.push(newNode(nd.k + 1, x, y));
                    if (roomManor.get(x, y)) {
                        if (nd.k + 1 >= 0 && val) innerPutAbleList.push(item);
                        if (val) allCacheList.push(item);
                    }
                }
            };
            visited.set(nd.x, nd.y, 1);
            if (nd.k >= -1) roomWalkable.for4Direction(func, nd.x, nd.y);
            else roomWalkable.forNear(func, nd.x, nd.y);
        });

        putAbleCacheMap[tarRoot] = innerPutAbleList;
        allCacheMap[tarRoot] = allCacheList;
        return [putAbleCacheMap[tarRoot], allCacheMap[tarRoot]];
    }
}

export default new Planner63();

