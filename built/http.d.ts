/// <reference types="node" />
/// <reference types="node" />
import * as http from 'node:http';
import * as https from 'node:https';
/**
 * Get http proxy or non-proxy agent
 */
export declare const httpAgent: http.Agent;
/**
 * Get https proxy or non-proxy agent
 */
export declare const httpsAgent: https.Agent;
