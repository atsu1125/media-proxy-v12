import * as http from 'node:http';
import * as https from 'node:https';
import ipaddr from 'ipaddr.js';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import config from './config/index.js';
class HttpRequestServiceAgent extends http.Agent {
    constructor(config, options) {
        super(options);
        this.config = config;
    }
    createConnection(options, callback) {
        const socket = super.createConnection(options, callback).on('connect', () => {
            const address = socket.remoteAddress;
            if (process.env.NODE_ENV === 'production' && address && ipaddr.isValid(address)) {
                if (this.isPrivateIp(address)) {
                    socket.destroy(new Error(`Blocked address: ${address}`));
                }
            }
        });
        return socket;
    }
    isPrivateIp(ip) {
        const parsedIp = ipaddr.parse(ip);
        for (const net of config.allowedPrivateNetworks ?? []) {
            const cidr = ipaddr.parseCIDR(net);
            if (parsedIp.kind() === cidr[0].kind() && parsedIp.match(cidr)) {
                return false;
            }
        }
        return parsedIp.range() !== 'unicast';
    }
}
class HttpsRequestServiceAgent extends https.Agent {
    constructor(config, options) {
        super(options);
        this.config = config;
    }
    createConnection(options, callback) {
        const socket = super.createConnection(options, callback).on('connect', () => {
            const address = socket.remoteAddress;
            if (process.env.NODE_ENV === 'production' && address && ipaddr.isValid(address)) {
                if (this.isPrivateIp(address)) {
                    socket.destroy(new Error(`Blocked address: ${address}`));
                }
            }
        });
        return socket;
    }
    isPrivateIp(ip) {
        const parsedIp = ipaddr.parse(ip);
        for (const net of config.allowedPrivateNetworks ?? []) {
            const cidr = ipaddr.parseCIDR(net);
            if (parsedIp.kind() === cidr[0].kind() && parsedIp.match(cidr)) {
                return false;
            }
        }
        return parsedIp.range() !== 'unicast';
    }
}
const cache = new CacheableLookup({
    maxTtl: 3600,
    errorTtl: 30,
    lookup: false, // nativeのdns.lookupにfallbackしない
});
const agentOption = {
    keepAlive: true,
    keepAliveMsecs: 30 * 1000,
    lookup: cache.lookup,
};
/**
 * Get http non-proxy agent
 */
const _http = new HttpRequestServiceAgent(config, agentOption);
/**
 * Get https non-proxy agent
 */
const _https = new HttpsRequestServiceAgent(config, agentOption);
/**
 * Get http proxy or non-proxy agent
 */
export const httpAgent = config.proxy
    ? new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 30 * 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: 'lifo',
        proxy: config.proxy,
    })
    : _http;
/**
 * Get https proxy or non-proxy agent
 */
export const httpsAgent = config.proxy
    ? new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 30 * 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: 'lifo',
        proxy: config.proxy,
    })
    : _https;
