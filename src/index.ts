import { SimpleStoreDBEngine } from "./SimpleStoreEngine";

export { SimpleStoreDBEngine } from "./SimpleStoreEngine";
export { SimpleStoreLevelEngine } from "./Level";
export { SimpleStoreInMemoryEngine } from "./InMemory";
export { SimpleStoreKubernetesEngine } from "./Kubernetes";

export class SimpleStore extends SimpleStoreDBEngine {

    private engine: SimpleStoreDBEngine;

    constructor(engine: SimpleStoreDBEngine) {
        super();
        this.engine = engine;

    }

    public async open() {
        return this.engine.open();
    }
    public isOpen(): boolean {
        return this.engine.isOpen();
    }

    public async put(key: string, value: any) {
        return this.engine.put(key, value)
    }

    public async get(key: string): Promise<any> {
        return this.engine.get(key);
    }

    public async del(key: string) {
        return this.engine.del(key);
    }

    public close() {
        return this.engine.close();
    }
    public isClosed(): boolean {
        return this.engine.isClosed();
    }
}