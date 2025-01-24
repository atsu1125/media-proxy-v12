import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import ipaddr from 'ipaddr.js';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import config from './config/index.js';
import type { Config } from './config/types.js';

declare module 'node:http' {
	interface Agent {
		createConnection(options: net.NetConnectOpts, callback?: (err: unknown, stream: net.Socket) => void): net.Socket;
	}
}

class HttpRequestServiceAgent extends http.Agent {
  constructor(private config: Config, options?: http.AgentOptions) {
    super(options);
  }
  public createConnection(
    options: net.NetConnectOpts,
    callback?: (err: unknown, stream: net.Socket) => void
  ): net.Socket {
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
  private isPrivateIp(ip: string): boolean {
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
  constructor(private config: Config, options?: https.AgentOptions) {
    super(options);
  }
  public createConnection(
    options: net.NetConnectOpts,
    callback?: (err: unknown, stream: net.Socket) => void
  ): net.Socket {
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
  private isPrivateIp(ip: string): boolean {
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
    maxTtl: 3600,	// 1hours
    errorTtl: 30,	// 30secs
    lookup: false,	// nativeのdns.lookupにfallbackしない
});

const agentOption = {
	keepAlive: true,
	keepAliveMsecs: 30 * 1000,
	lookup: cache.lookup as unknown as net.LookupFunction,
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
