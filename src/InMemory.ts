
import { SimpleStoreDBEngine } from "./SimpleStoreEngine";

export class SimpleStoreInMemoryEngine extends SimpleStoreDBEngine{

    data={};

    constructor(){
        super();
    }

    public open(): Promise<void> {
        return;
    }
    public isOpen(): boolean {
        return true;
    }
    public put(key: string, value: any): Promise<void> {
        return this.data[key] = value;
    }
    public get(key: string): Promise<any> {
        return this.data[key]
    }
    public del(key: string): Promise<void> {
        delete this.data[key];
        return;
    }
    public close(): Promise<void> {
        return;
    }
    public isClosed(): boolean {
        return false;
    }

}