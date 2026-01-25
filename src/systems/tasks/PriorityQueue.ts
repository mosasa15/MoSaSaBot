export class PriorityQueue<T> {
    private heap: T[] = [];
    private compare: (a: T, b: T) => number;
 
    public constructor(compare: (a: T, b: T) => number) {
        this.compare = compare;
    }
 
    public size(): number {
        return this.heap.length;
    }
 
    public peek(): T | undefined {
        return this.heap.length > 0 ? this.heap[0] : undefined;
    }
 
    public push(value: T): void {
        this.heap.push(value);
        this.siftUp(this.heap.length - 1);
    }
 
    public pop(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0 && last !== undefined) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return top;
    }
 
    public clear(): void {
        this.heap.length = 0;
    }
 
    private siftUp(index: number): void {
        while (index > 0) {
            const parent = (index - 1) >>> 1;
            if (this.compare(this.heap[index], this.heap[parent]) < 0) {
                const tmp = this.heap[index];
                this.heap[index] = this.heap[parent];
                this.heap[parent] = tmp;
                index = parent;
            } else {
                break;
            }
        }
    }
 
    private siftDown(index: number): void {
        const length = this.heap.length;
        while (true) {
            const left = (index << 1) + 1;
            const right = left + 1;
            let smallest = index;
 
            if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
            if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
 
            if (smallest === index) break;
 
            const tmp = this.heap[index];
            this.heap[index] = this.heap[smallest];
            this.heap[smallest] = tmp;
            index = smallest;
        }
    }
}

