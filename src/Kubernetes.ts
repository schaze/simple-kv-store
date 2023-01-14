import { SimpleStoreDBEngine } from "./SimpleStoreEngine";
import k8s = require('@kubernetes/client-node');
import { Context } from "@kubernetes/client-node/dist/config_types";
import { IncomingMessage } from "http";
import AsyncLock from 'async-lock';
import * as winston from "winston";
import http = require('http');

export class SimpleStoreKubernetesEngine extends SimpleStoreDBEngine {

    client: k8s.CoreV1Api;
    config: k8s.KubeConfig;
    context: Context;
    namespace: string;
    ressourceObj: k8s.V1ConfigMap | k8s.V1Secret;

    opened = false;
    private updateLock = new AsyncLock();
    protected readonly log: winston.Logger;

    constructor(private ressourceName: string, namespace = null, private mode: 'configmap' | 'secret' = 'configmap') {
        super();
        this.log = winston.child({
            type: this.constructor.name,
        });

        this.config = new k8s.KubeConfig();
        this.config.loadFromDefault();
        this.context = this.config.getContextObject(this.config.currentContext);
        this.namespace = namespace ? namespace : (this.context.namespace || 'default');
        this.client = this.config.makeApiClient(k8s.CoreV1Api);
    }

    private getEmptyRessource(): k8s.V1ConfigMap | k8s.V1Secret {
        const resource = this.mode === 'configmap' ? {} as k8s.V1ConfigMap : {} as k8s.V1Secret;
        resource.apiVersion = 'v1';
        resource.kind = this.mode === 'configmap' ? 'ConfigMap' : 'Secret';
        resource.metadata = { name: this.ressourceName };
        resource.data = {};
        return resource;
    }

    private async readRessource(resourceName: string, namespace: string): Promise<
        {
            response: http.IncomingMessage;
            body: k8s.V1ConfigMap;
        } | {
            response: http.IncomingMessage;
            body: k8s.V1Secret;
        }> {
        return this.mode === 'configmap' ? this.client.readNamespacedConfigMap(resourceName, namespace) : this.client.readNamespacedSecret(resourceName, namespace);
    }

    private async createRessource(namespace: string, body: k8s.V1ConfigMap | k8s.V1Secret): Promise<
        {
            response: http.IncomingMessage;
            body: k8s.V1ConfigMap;
        } | {
            response: http.IncomingMessage;
            body: k8s.V1Secret;
        }> {
        return this.mode === 'configmap' ? this.client.createNamespacedConfigMap(namespace, body) : this.client.createNamespacedSecret(namespace, body);
    }

    private async replaceRessource(resourceName: string, namespace: string, body: k8s.V1ConfigMap | k8s.V1Secret): Promise<
        {
            response: http.IncomingMessage;
            body: k8s.V1ConfigMap;
        } | {
            response: http.IncomingMessage;
            body: k8s.V1Secret;
        }> {
        return this.mode === 'configmap' ? this.client.replaceNamespacedConfigMap(resourceName, namespace, body) : this.client.replaceNamespacedSecret(resourceName, namespace, body);
    }

    public open(): Promise<void> {
        return this.readRessource(this.ressourceName, this.namespace).then((resp) => {
            // debug('Configmap data: ', resp.body.data);
            this.ressourceObj = resp.body;
            this.opened = true;
        }).catch((err: { response: IncomingMessage; body: k8s.V1ConfigMap; }) => {
            if (err?.response?.statusCode == 404) {
                const ressource = this.getEmptyRessource();
                this.log.debug('CfgMap: %s', ressource);
                return this.createRessource(this.namespace, ressource).then((resp) => {
                    // debug('Created data: ', resp.body.data);
                    this.ressourceObj = resp.body;
                    this.opened = true;
                })
            } else {
                this.opened = false;
                this.log.error('Error intializing connection/ressource', {code: err?.response?.statusCode, message: err?.response?.statusMessage})
                throw new Error('Cannot intialize k8s connection/configmap');
            }
        });
    }
    public isOpen(): boolean {
        return this.opened;
    }
    public put(key: string, value: any): Promise<void> {
        if (this.ressourceObj.data === null || this.ressourceObj.data === undefined) {
            this.ressourceObj.data = {};
        }
        const data = JSON.stringify(value);
        this.ressourceObj.data[key] = this.mode === "configmap" ? data : Buffer.from(data).toString('base64');
        return this.updateConfigMap()

    }
    public get(key: string): Promise<any> {
        const data = (this.ressourceObj.data?.[key] !== undefined && this.ressourceObj.data?.[key]  !== null) ? this.ressourceObj.data?.[key] : undefined;
        if (data === undefined) { return undefined; }
        return this.mode === 'configmap' ? JSON.parse(data) : JSON.parse(Buffer.from(data, 'base64').toString());
    }
    public del(key: string): Promise<void> {
        if (this.ressourceObj.data) {
            delete this.ressourceObj?.data[key];
        }
        return this.updateConfigMap();
    }

    public close(): Promise<void> {
        this.opened = false;
        this.ressourceObj = null;
        return null;
    }
    public isClosed(): boolean {
        return !this.opened;
    }

    private async updateConfigMap() {
        return this.updateLock.acquire<void>('update', done => {
            return this.replaceRessource(this.ressourceName, this.namespace, this.ressourceObj).then(resp => {
                // debug('Data updated: ', resp.body.data);
                this.ressourceObj = resp.body;
            }).finally(() => done())
        })
    }

}