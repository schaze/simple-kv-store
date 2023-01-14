import { LevelUp } from "levelup";
import levelup from 'levelup';
import leveldown from 'leveldown';
import { SimpleStoreDBEngine } from "./SimpleStoreEngine";

export class SimpleStoreLevelEngine extends SimpleStoreDBEngine{

    level: LevelUp;

    constructor(path: string){
        super();
        this.level = levelup(leveldown(path));
    }

    public open(): Promise<void> {
        return this.level.open();
    }
    public isOpen(): boolean {
        return this.level.isOpen();
    }
    public put(key: string, value: any): Promise<void> {
        return this.level.put(key, JSON.stringify(value));
    }
    public get(key: string): Promise<any> {
        return this.level.get(key).then(v=>{
            if (v === null || v === undefined){
                return undefined;
            }
            return JSON.parse(v.toString())
        }).catch(err => {
            return undefined;
        });
    }
    public del(key: string): Promise<void> {
        return this.level.del(key);
    }
    public close(): Promise<void> {
        return this.level.close();
    }
    public isClosed(): boolean {
        return this.level.isClosed();
    }

}