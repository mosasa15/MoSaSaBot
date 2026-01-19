import PriorityQueue from './lib/PriorityQueue.js';
import UnionFind from './lib/UnionFind.js';
import RoomArray from './lib/RoomArray.js';

const minPlaneCnt = 140;

function NewNode(k, x, y, v) {
    return { k, x, y, v };
}

class Planner {
    constructor() {
        this.visited = new RoomArray();
        this.roomWalkable = new RoomArray();
        this.nearWall = new RoomArray();
        this.routeDistance = new RoomArray();
        this.roomObjectCache = new RoomArray();
        this.nearWallWithInterpolation = new RoomArray();
        this.interpolation = new RoomArray();
        
        this.queMin = new PriorityQueue(true);
        this.queMin2 = new PriorityQueue(true);
        this.startPoint = new PriorityQueue(true);
        
        this.unionFind = new UnionFind(50 * 50);
        this.objects = [];
    }

    init() {
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

    computeLayout(room) {
        if (!room) return null;
        
        const controller = room.controller;
        const mineral = room.find(FIND_MINERALS)[0];
        const sources = room.find(FIND_SOURCES);
        
        if (!controller || !mineral || sources.length === 0) return null;
        
        // Order matters for the algorithm: Controller, Mineral, SourceA, SourceB...
        const points = [
            { pos: controller.pos },
            { pos: mineral.pos },
            ...sources.map(s => ({ pos: s.pos }))
        ];
        
        return this.computeManor(room.name, points);
    }

    computeManor(roomName, points, blocked) {
        this.init();
        
        for (let p of points) {
            if (p.pos && p.pos.roomName == roomName) this.objects.push(p.pos);
        }

        let blockArray = this.computeBlock(roomName, blocked);
        let unionFind = blockArray[0];
        let sizeMap = blockArray[1];
        let wallMap = {};
        let roomWalkable = blockArray[2];
        let nearWall = blockArray[3];
        let putAbleCacheMap = blockArray[4];
        let allCacheMap = blockArray[5];

        let roomManor = this.interpolation;
        let roomStructs = this.nearWallWithInterpolation;

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

        Object.keys(sizeMap).forEach(pos => {
            pos = parseInt(pos);
            this.getBlockPutAbleCnt(roomWalkable, this.visited, this.queMin, unionFind, pos, putAbleCacheMap, allCacheMap);
            let currentPutAbleList = putAbleCacheMap[pos];
            let allList = allCacheMap[pos];
            
            if (!currentPutAbleList || currentPutAbleList.length < minPlaneCnt) return;
            
            // If explicit storage flag exists (skipping for auto-mode)
            // if (Game.flags.storagePos && ...) 

            wallMap[pos] = [];
            this.visited.init();
            roomWalkable.forBorder((x, y, val) => {
                if (val) {
                    this.queMin.push(NewNode(0, x, y));
                    this.visited.set(x, y, 1);
                }
            });

            let currentRoomManor = this.routeDistance;
            currentRoomManor.init();
            allList.forEach(e => {
                currentRoomManor.set(e.x, e.y, 1);
            });

            this.queMin.whileNoEmpty(nd => {
                if (!currentRoomManor.get(nd.x, nd.y)) {
                    roomWalkable.forNear((x, y, val) => {
                        if (!this.visited.exec(x, y, 1) && val) {
                            if (!currentRoomManor.get(x, y)) {
                                this.queMin.push(NewNode(nd.k + 1, x, y));
                            } else {
                                wallMap[pos].push(NewNode(0, x, y));
                            }
                        }
                    }, nd.x, nd.y);
                }
            });

            let currentInnerPutAbleList = currentPutAbleList;
            let maxDist = 0;
            let filter2 = currentInnerPutAbleList.filter(e => e.k > 2);
            if (filter2.length < 30) {
                filter2.forEach(a => {
                    filter2.forEach(b => {
                        maxDist = Math.max(maxDist, Math.abs(a.x - b.x) + Math.abs(a.y - b.y));
                    });
                });
            }

            let currentWallCnt = wallMap[pos].length;

            if (minPlaneCnt < currentPutAbleList.length && wallCnt > currentWallCnt && (currentInnerPutAbleList.filter(e => e.k > 1).length > 30 || maxDist > 5)) {
                putAbleList = currentPutAbleList;
                innerPutAbleList = currentInnerPutAbleList;
                wallCnt = currentWallCnt;
                finalPos = pos;
                
                centerX = currentPutAbleList.map(e => e.x).reduce((a, b) => a + b) / currentPutAbleList.length;
                centerY = currentPutAbleList.map(e => e.y).reduce((a, b) => a + b) / currentPutAbleList.length;
            }
        });

        if (!finalPos || !putAbleCacheMap[finalPos]) return null;

        let walls = wallMap[finalPos];
        roomManor.init();
        allCacheMap[finalPos].forEach(e => {
            roomManor.set(e.x, e.y, -1);
        });
        innerPutAbleList.forEach(e => {
            roomManor.set(e.x, e.y, e.k);
        });

        let storageX = 0;
        let storageY = 0;
        let storageDistance = 100;

        innerPutAbleList.filter(e => e.k > 2).forEach(e => {
            let x = e.x;
            let y = e.y;
            let detX = centerX - x;
            let detY = centerY - y;
            let distance = Math.sqrt(detX * detX + detY * detY);
            if (storageDistance > distance) {
                storageDistance = distance;
                storageX = x;
                storageY = y;
            }
        });

        let labX = 0;
        let labY = 0;
        let labDistance = 1e5;

        roomManor.forEach((x, y, val) => {
            if (val >= 2) {
                let distance = Math.sqrt(Math.pow(storageX - x - 1.5, 2) + Math.pow(storageY - y - 1.5, 2));
                if (labDistance <= distance) return;
                let checkCnt = 0;
                let check = function (x, y) {
                    if (roomManor.get(x, y) > 0 && Math.abs(x - storageX) + Math.abs(y - storageY) > 2) {
                        checkCnt += 1;
                    }
                };
                for (let i = 0; i < 4; i++)
                    for (let j = 0; j < 4; j++)
                        check(x + i, y + j);
                if (checkCnt == 16) {
                    labDistance = distance;
                    labX = x;
                    labY = y;
                }
            }
        });
        labX += 1;
        labY += 1;

        let structMap = {};
        Object.keys(CONTROLLER_STRUCTURES).forEach(e => structMap[e] = []);

        structMap["link"] = this.roomObjectCache.link || [];
        structMap["container"] = this.roomObjectCache.container || [];
        structMap["extractor"] = this.roomObjectCache.extractor || [];

        structMap["storage"].push([storageX - 1, storageY]);
        structMap["terminal"].push([storageX, storageY + 1]);
        structMap["factory"].push([storageX + 1, storageY]);
        structMap["link"].push([storageX, storageY - 1]);
        structMap["powerSpawn"].push([storageX + 1, storageY + 1]);
        structMap["spawn"].push([storageX + 1, storageY - 1]);

        const centerBuildings = ["storage", "link", "factory", "terminal", "spawn", "powerSpawn"];
        centerBuildings.forEach(type => {
            structMap[type].forEach(([x, y]) => {
                roomStructs.set(x, y, type);
            });
        });

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const x = storageX + i + j;
                const y = storageY + i - j;
                if (roomStructs.get(x, y) && roomStructs.get(x, y) !== "road") continue;
                structMap["road"].push([x, y]);
            }
        }

        let labs = ["☢-☢☢", "-☢-☢", "☢-☢-", "☢☢-☢"];
        let labChangeDirection = false;
        if ((storageX - labX) * (storageY - labY) < 0) {
            labChangeDirection = true;
        }

        let vis = {};
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                vis[i + "_" + j] = 1;
                let jj = labChangeDirection ? j : 1 - j;
                let structs = labs[i + 1].charAt(j + 1);
                if (structs == '☢') structMap["lab"].push([labX + i, labY + jj]);
                else structMap["road"].push([labX + i, labY + jj]);
            }
        }

        for (let i = -1; i < 3; i++) {
            for (let j = -1; j < 3; j++) {
                if (vis[i + "_" + j]) continue;
                let jj = labChangeDirection ? j : 1 - j;
                let structs = labs[i + 1].charAt(j + 1);
                if (structs == '☢') structMap["lab"].push([labX + i, labY + jj]);
                else structMap["road"].push([labX + i, labY + jj]);
            }
        }

        walls.forEach(e => structMap["rampart"].push([e.x, e.y]));
        Object.keys(CONTROLLER_STRUCTURES).forEach(struct => structMap[struct].forEach(e => roomStructs.set(e[0], e[1], struct)));
        structMap["road"].forEach(e => roomStructs.set(e[0], e[1], 1));

        let setModel = (xx, yy) => {
            let checkAble = (x, y) => (x >= 0 && y >= 0 && x <= 49 && y <= 49) && roomManor.get(x, y) > 0 && !roomStructs.get(x, y);
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let x = xx + i + j;
                    let y = yy + i - j;
                    if (checkAble(x, y)) {
                        if (i || j) {
                            roomStructs.set(x, y, 1);
                        } else {
                            roomStructs.set(x, y, 12);
                        }
                    }
                }
            }
            for (let e of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                let x = xx + e[0];
                let y = yy + e[1];
                if (checkAble(x, y)) {
                    roomStructs.set(x, y, 8);
                }
            }
        };

        for (let i = 0; i < 50; i += 4) {
            for (let j = 0; j < 50; j += 4) {
                let x = storageX % 4 + i;
                let y = storageY % 4 + j;
                setModel(x, y);
                setModel(x + 2, y + 2);
            }
        }

        this.visited.init();
        this.visited.set(storageX, storageY, 1);
        this.queMin.push(NewNode(1, storageX, storageY));
        let costRoad = this.routeDistance;
        costRoad.init();
        
        this.queMin.whileNoEmpty(nd => {
            roomStructs.forNear((x, y, val) => {
                if (!this.visited.exec(x, y, 1) && val > 0) {
                    this.queMin.push(NewNode(nd.k + val, x, y));
                }
            }, nd.x, nd.y);
            costRoad.set(nd.x, nd.y, nd.k);
        });

        structMap["road"].forEach(e => roomStructs.set(e[0], e[1], "road"));

        costRoad.forEach((x, y, val) => {
            if (!val) return;
            let minVal = 50;
            costRoad.forNear((x1, y1, val) => {
                if (minVal > val && val > 0) {
                    minVal = val;
                }
            }, x, y);
            costRoad.forNear((x1, y1, val) => {
                if (minVal == val && val > 0) {
                    roomStructs.set(x1, y1, "road");
                }
            }, x, y);
        });

        let spawnPos = [];
        let extensionPos = [];
        roomStructs.forEach((x, y, val) => {
            if (val > 0) {
                let dist = 100;
                costRoad.forNear((x, y, val) => {
                    if (val) dist = Math.min(dist, val);
                }, x, y);
                if (val == 12) {
                    spawnPos.push([x, y, dist]);
                } else {
                    extensionPos.push([x, y, dist]);
                }
            }
        });

        let cmpFunc = (a, b) => a[2] == b[2] ? (a[1] == b[1] ? a[0] - b[0] : a[1] - b[1]) : a[2] - b[2];
        spawnPos = spawnPos.sort(cmpFunc);
        extensionPos = extensionPos.sort(cmpFunc);
        
        let oriStruct = [];
        ["spawn", "nuker", "powerSpawn", "tower", "observer"].forEach(struct => {
            let total = CONTROLLER_STRUCTURES[struct][8];
            let alreadyPlaced = structMap[struct].length;
            let need = total - alreadyPlaced;
            if (need < 0) need = 0;
            for (let i = 0; i < need; i++) {
                oriStruct.push(struct);
            }
        });

        oriStruct.forEach(struct => {
            let e = spawnPos.shift();
            if (!e) e = extensionPos.shift();
            if (e) structMap[struct].push([e[0], e[1]]);
        });
        extensionPos.push(...spawnPos);
        extensionPos = extensionPos.sort(cmpFunc);
        let extCnt = 60;
        extensionPos.forEach(e => {
            if (extCnt > 0) {
                structMap["extension"].push([e[0], e[1]]);
                extCnt -= 1;
            }
        });

        roomStructs.init();
        Object.keys(CONTROLLER_STRUCTURES).forEach(struct => structMap[struct].forEach(e => roomStructs.set(e[0], e[1], struct)));
        
        // Pathfinding to external points (sources, controller) using PathFinder
        let costs = new PathFinder.CostMatrix;
        let terrain = new Room.Terrain(roomName);
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 50; j++) {
                let te = terrain.get(i, j);
                costs.set(i, j, te == TERRAIN_MASK_WALL ? 255 : (te == TERRAIN_MASK_SWAMP ? 4 : 2));
            }
        }
        
        for (let struct of OBSTACLE_OBJECT_TYPES) {
            if (structMap[struct]) {
                structMap[struct].forEach(e => costs.set(e[0], e[1], 255));
            }
        }
        structMap["road"].forEach(e => costs.set(e[0], e[1], 1));

        if (structMap["storage"] && structMap["storage"][0]) {
            const [sx, sy] = structMap["storage"][0];
            const startPos = new RoomPosition(sx, sy, roomName);
            
            structMap["container"].sort(e => Math.sqrt((e[0] - sx) * (e[0] - sx) + (e[1] - sy) * (e[1] - sy)));
            
            structMap["container"].forEach(e => {
                const targetPos = new RoomPosition(e[0], e[1], roomName);
                const ret = PathFinder.search(
                    startPos,
                    { pos: targetPos, range: 1 },
                    { roomCallback: () => costs, maxRooms: 1 }
                );
                ret.path.forEach(pos => {
                    if (costs.get(pos.x, pos.y) !== 1) {
                        structMap["road"].push([pos.x, pos.y]);
                        costs.set(pos.x, pos.y, 1);
                    }
                });
            });
        }

        return {
            roomName: roomName,
            structMap: structMap
        };
    }

    computeBlock(roomName, blocked) {
        this.roomWalkable.initRoomTerrainWalkAble(roomName);
        this.roomWalkable.forEach((x, y, val) => { if (!val) { this.queMin.push(NewNode(0, x, y)); this.visited.set(x, y, 1); } });
        
        this.queMin.whileNoEmpty(nd => {
            this.roomWalkable.for4Direction((x, y, val) => {
                if (!this.visited.exec(x, y, 1) && val) {
                    this.queMin.push(NewNode(nd.k + 1, x, y));
                }
            }, nd.x, nd.y);
            this.nearWall.exec(nd.x, nd.y, nd.k);
        });

        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x, y, val) => {
                    if (val) {
                        this.nearWall.set(x, y, 50);
                        this.queMin.push(NewNode(0, x, y));
                    }
                }, x, y);
                this.queMin.push(NewNode(0, x, y));
                this.nearWall.set(x, y, 50);
            }
        });

        let roomPutAble = this.routeDistance;
        roomPutAble.initRoomTerrainWalkAble(roomName);
        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x, y, val) => {
                    if (val) roomPutAble.set(x, y, 0);
                }, x, y);
                roomPutAble.set(x, y, 0);
            }
        });

        let getObjectPos = (x, y, struct) => {
            let put = false;
            let finalX = 0;
            let finalY = 0;
            roomPutAble.for4Direction((x, y, val) => {
                if (val && !put && !this.roomObjectCache.get(x, y)) {
                    finalX = x;
                    finalY = y;
                    put = true;
                }
            }, x, y);
            roomPutAble.forNear((x, y, val) => {
                if (val && !put && !this.roomObjectCache.get(x, y)) {
                    finalX = x;
                    finalY = y;
                    put = true;
                }
            }, x, y);
            this.roomObjectCache.set(finalX, finalY, struct);
            return [finalX, finalY];
        };

        for (let i = 0; i < this.objects.length; i++) {
            const pos = this.objects[i];
            const containerPos = getObjectPos(pos.x, pos.y, "container");

            if (i === 1) { // Mineral
                this.roomObjectCache.extractor = [[pos.x, pos.y]];
                this.roomObjectCache.container = this.roomObjectCache.container || [];
                this.roomObjectCache.container.push(containerPos);
                continue;
            }

            if (i === 0) { // Controller
                const linkPos = getObjectPos(containerPos[0], containerPos[1], "link");
                this.roomObjectCache.link = this.roomObjectCache.link || [];
                this.roomObjectCache.link.push(linkPos);
                this.roomObjectCache.container = this.roomObjectCache.container || [];
                this.roomObjectCache.container.unshift(containerPos);
                continue;
            }

            // Sources
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
            this.nearWall.for4Direction((x, y, val) => {
                value += val;
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
                if (!this.visited.exec(x, y, 1) && val) {
                    this.queMin.push(NewNode(nd.k + 1, x, y));
                }
            }, nd.x, nd.y);
            this.routeDistance.set(nd.x, nd.y, nd.k);
        });

        this.routeDistance.forEach((x, y, val) => {
            if (!this.roomWalkable.get(x, y)) return;
            if (val) this.startPoint.push(NewNode(-val, x, y));
        });

        let sizeMap = {};
        let posSeqMap = {};

        this.visited.init();
        for (let i = 0; i < 2500; i++) {
            if (this.startPoint.isEmpty()) break;
            let cnt = 0;
            let nd = this.startPoint.pop();
            let currentPos = nd.x * 50 + nd.y;
            if (blocked && blocked.get(nd.x, nd.y)) {
                this.unionFind.union(currentPos, 0);
                continue;
            }
            let posSeq = [];

            let dfsFindDown = (roomArray, x, y) => {
                let currentValue = roomArray.get(x, y);
                if (!this.visited.exec(x, y, 1)) {
                    roomArray.for4Direction((x1, y1, val) => {
                        if (val && (x1 == x || y1 == y) && val < currentValue) {
                            dfsFindDown(roomArray, x1, y1);
                        }
                    }, x, y);
                    let pos = x * 50 + y;
                    if (this.unionFind.find(pos) && this.unionFind.find(currentPos) && (!blocked || !blocked.get(x, y))) {
                        this.unionFind.union(currentPos, pos);
                        posSeq.push(pos);
                        cnt++;
                    } else if (blocked) this.unionFind.union(pos, 0);
                }
            };

            let dfsFindUp = (roomArray, x, y) => {
                let currentValue = roomArray.get(x, y);
                if (!this.visited.exec(x, y, 1)) {
                    roomArray.forNear((x1, y1, val) => {
                        if (val > currentValue && currentValue < 6) {
                            dfsFindUp(roomArray, x1, y1);
                        } else if (val && val < currentValue) {
                            dfsFindDown(roomArray, x1, y1);
                        }
                    }, x, y);
                    let pos = x * 50 + y;
                    if (this.unionFind.find(pos) && this.unionFind.find(currentPos) && (!blocked || !blocked.get(x, y))) {
                        this.unionFind.union(currentPos, pos);
                        posSeq.push(pos);
                        cnt++;
                    } else if (blocked) this.unionFind.union(pos, 0);
                }
            };
            dfsFindUp(this.nearWallWithInterpolation, nd.x, nd.y);

            if (cnt > 0) {
                let pos = this.unionFind.find(currentPos);
                this.queMin.push(NewNode(cnt, 0, 0, pos));
                sizeMap[pos] = cnt;
                posSeqMap[pos] = posSeq;
            }
        }

        this.roomWalkable.forBorder((x, y, val) => {
            if (val) {
                this.roomWalkable.forNear((x, y, val) => {
                    if (val) {
                        let pos = this.unionFind.find(x * 50 + y);
                        if (sizeMap[pos]) delete sizeMap[pos];
                    }
                }, x, y);
                let pos = this.unionFind.find(x * 50 + y);
                if (sizeMap[pos]) delete sizeMap[pos];
            }
        });
        delete sizeMap[0];

        let putAbleCacheMap = {};
        let allCacheMap = {};

        this.queMin.whileNoEmpty(nd => {
            let pos = nd.v;
            if (nd.k != sizeMap[pos]) return;

            this.visited.init();
            let nearCntMap = {};

            posSeqMap[pos].forEach(e => {
                let y = e % 50;
                let x = ((e - y) / 50);
                this.roomWalkable.forNear((x, y, val) => {
                    if (val && !this.visited.exec(x, y, 1)) {
                        let currentPos = this.unionFind.find(x * 50 + y);
                        if (currentPos == pos) return;
                        let currentSize = sizeMap[currentPos];
                        if (currentSize < 300) {
                            nearCntMap[currentPos] = (nearCntMap[currentPos] || 0) + 1;
                        }
                    }
                }, x, y);
            });

            let targetPos = undefined;
            let nearCnt = 0;
            let maxRatio = 0;

            Object.keys(nearCntMap).forEach(currentPos => {
                let currentRatio = nearCntMap[currentPos] / Math.sqrt(Math.min(sizeMap[currentPos], nd.k));
                if (currentRatio == maxRatio ? sizeMap[currentPos] < sizeMap[targetPos] : currentRatio > maxRatio) {
                    targetPos = currentPos;
                    maxRatio = currentRatio;
                    nearCnt = nearCntMap[currentPos];
                }
            });

            if (!targetPos) return;

            let minSize = sizeMap[targetPos];
            let cnt = nd.k + minSize;
            let targetBlockPutAbleCnt = 0;
            let ndkBlockPutAbleCnt = 0;

            if (minSize > minPlaneCnt)
                targetBlockPutAbleCnt = this.getBlockPutAbleCnt(this.roomWalkable, this.visited, this.queMin2, this.unionFind, targetPos, putAbleCacheMap, allCacheMap)[0].length;
            if (nd.k > minPlaneCnt)
                ndkBlockPutAbleCnt = this.getBlockPutAbleCnt(this.roomWalkable, this.visited, this.queMin2, this.unionFind, nd.v, putAbleCacheMap, allCacheMap)[0].length;

            if (targetPos && Math.max(targetBlockPutAbleCnt, ndkBlockPutAbleCnt) < minPlaneCnt) {
                this.unionFind.union(pos, targetPos);
                nd.v = this.unionFind.find(pos);

                if (pos != nd.v) delete sizeMap[pos];
                else delete sizeMap[targetPos];

                nd.k = cnt;
                sizeMap[nd.v] = cnt;
                posSeqMap[nd.v] = posSeqMap[targetPos].concat(posSeqMap[pos]);
                delete putAbleCacheMap[nd.v];
                delete putAbleCacheMap[targetPos];
                if (pos != nd.v) delete posSeqMap[pos];
                else delete posSeqMap[targetPos];
                this.queMin.push(NewNode(nd.k, nd.x, nd.y, nd.v));
            }
        });

        return [this.unionFind, sizeMap, this.roomWalkable, this.nearWall, putAbleCacheMap, allCacheMap];
    }

    getBlockPutAbleCnt(roomWalkable, visited, queMin, unionFind, tarRoot, putAbleCacheMap, AllCacheMap) {
        if (putAbleCacheMap[tarRoot]) return [putAbleCacheMap[tarRoot], AllCacheMap[tarRoot]];
        
        let roomManor = this.routeDistance;
        roomManor.init();
        roomManor.forEach((x, y, val) => { if (tarRoot == unionFind.find(x * 50 + y)) { roomManor.set(x, y, 1); } });
        roomManor.forEach((x, y, val) => {
            if (val) {
                let manorCnt = 0;
                let wallCnt = 0;
                roomManor.for4Direction((x1, y1, val1) => {
                    if (val1) manorCnt += 1;
                    if (!roomWalkable.get(x1, y1)) wallCnt += 1;
                }, x, y);
                if (manorCnt == 1 && wallCnt == 0) roomManor.set(x, y, 0);
            }
        });

        let dfsMoreManor = (x, y, val) => {
            if (!val && roomWalkable.get(x, y)) {
                let manorCnt = 0;
                let wallCnt = 0;
                roomManor.for4Direction((x1, y1, val1) => {
                    if (val1) manorCnt += 1;
                    if (!roomWalkable.get(x1, y1)) wallCnt += 1;
                }, x, y);
                if (manorCnt >= 2 || manorCnt == 1 && wallCnt >= 2) {
                    roomManor.set(x, y, 1);
                    roomManor.for4Direction((x1, y1, val1) => {
                        dfsMoreManor(x1, y1, val1);
                    }, x, y);
                }
            }
        };
        roomManor.forEach((x, y, val) => { dfsMoreManor(x, y, val); });
        roomWalkable.forBorder((x, y, val) => {
            if (val) {
                roomManor.forNear((x, y, val) => {
                    roomManor.set(x, y, 0);
                }, x, y);
                roomManor.set(x, y, 0);
            }
        });

        let innerPutAbleList = [];
        let AllCacheList = [];
        visited.init();

        roomWalkable.forEach((x, y, val) => {
            if (!roomManor.get(x, y)) {
                queMin.push(NewNode(val ? -4 : -1, x, y));
            }
        });

        queMin.whileNoEmpty(nd => {
            let func = (x, y, val) => {
                let item = NewNode(nd.k + 2, x, y);
                if (!visited.exec(x, y, 1)) {
                    queMin.push(NewNode(nd.k + 1, x, y));
                    if (roomManor.get(x, y)) {
                        if (nd.k + 1 >= 0 && val) {
                            innerPutAbleList.push(item);
                        }
                        if (val)
                            AllCacheList.push(item);
                    }
                }
            };
            visited.set(nd.x, nd.y, 1);
            if (nd.k >= -1)
                roomWalkable.for4Direction(func, nd.x, nd.y);
            else
                roomWalkable.forNear(func, nd.x, nd.y);
        });

        putAbleCacheMap[tarRoot] = innerPutAbleList;
        AllCacheMap[tarRoot] = AllCacheList;
        return [putAbleCacheMap[tarRoot], AllCacheMap[tarRoot]];
    }
}

export default new Planner();
