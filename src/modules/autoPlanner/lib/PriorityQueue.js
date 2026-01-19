/**
 * Pure JS Priority Queue (Min/Max Heap)
 * Replaces the missing WASM module.
 */
class PriorityQueue {
    /**
     * @param {boolean} isMinRoot - If true, pop() returns the smallest element. If false, returns the largest.
     */
    constructor(isMinRoot = true) {
        this.isMinRoot = isMinRoot;
        this.heap = [];
        this.compare = isMinRoot 
            ? (a, b) => a.k - b.k 
            : (a, b) => b.k - a.k;
    }

    size() {
        return this.heap.length;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    clear() {
        this.heap = [];
    }

    /**
     * @param {Object} node - {k: number, ...data}
     */
    push(node) {
        this.heap.push(node);
        this._siftUp();
    }

    pop() {
        if (this.size() === 0) return undefined;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.size() > 0) {
            this.heap[0] = bottom;
            this._siftDown();
        }
        return top;
    }

    top() {
        return this.size() > 0 ? this.heap[0] : undefined;
    }

    /**
     * Consumes the queue until empty, executing func for each node.
     * @param {Function} func 
     */
    whileNoEmpty(func) {
        while (!this.isEmpty()) {
            const node = this.pop();
            func(node);
        }
    }

    _siftUp() {
        let nodeIdx = this.heap.length - 1;
        while (nodeIdx > 0) {
            const parentIdx = (nodeIdx - 1) >>> 1;
            if (this.compare(this.heap[nodeIdx], this.heap[parentIdx]) < 0) {
                this._swap(nodeIdx, parentIdx);
                nodeIdx = parentIdx;
            } else {
                break;
            }
        }
    }

    _siftDown() {
        let nodeIdx = 0;
        const length = this.heap.length;
        while (true) {
            const leftIdx = (nodeIdx << 1) + 1;
            const rightIdx = leftIdx + 1;
            let swapIdx = null;

            if (leftIdx < length) {
                if (this.compare(this.heap[leftIdx], this.heap[nodeIdx]) < 0) {
                    swapIdx = leftIdx;
                }
            }

            if (rightIdx < length) {
                if (
                    (swapIdx === null && this.compare(this.heap[rightIdx], this.heap[nodeIdx]) < 0) ||
                    (swapIdx !== null && this.compare(this.heap[rightIdx], this.heap[leftIdx]) < 0)
                ) {
                    swapIdx = rightIdx;
                }
            }

            if (swapIdx === null) break;
            this._swap(nodeIdx, swapIdx);
            nodeIdx = swapIdx;
        }
    }

    _swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }
}

export default PriorityQueue;
