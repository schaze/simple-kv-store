export abstract class SimpleStoreDBEngine {
    constructor(){
    }
    public abstract open(): Promise<void>;
    public abstract isOpen(): boolean;
    public abstract put(key: string, value: any): Promise<void>;
    public abstract get(key: string): Promise<any>;
    public abstract del(key: string): Promise<void>;
    public abstract close(): Promise<void>;
    public abstract isClosed(): boolean;

}
