/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import type { Config } from './config/types.js';
declare module 'node:http' {
    interface Agent {
        createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
    }
}
declare class HttpRequestServiceAgent extends http.Agent {
    private config;
    constructor(config: Config, options?: http.AgentOptions);
    createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
    private isPrivateIp;
}
declare class HttpsRequestServiceAgent extends https.Agent {
    private config;
    constructor(config: Config, options?: https.AgentOptions);
    createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
    private isPrivateIp;
}
/**
 * Get http proxy or non-proxy agent
 */
export declare const httpAgent: HttpRequestServiceAgent | HttpProxyAgent;
/**
 * Get https proxy or non-proxy agent
 */
export declare const httpsAgent: HttpsRequestServiceAgent | HttpsProxyAgent;
export {};
