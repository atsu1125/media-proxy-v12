import * as fs from 'node:fs';
import * as stream from 'node:stream';
import * as util from 'node:util';
import got, * as Got from 'got';
import IPCIDR from 'ip-cidr';
import PrivateIp from 'private-ip';
import { StatusError } from './status-error.js';
import { httpAgent, httpsAgent } from './http.js';
import { parse } from 'content-disposition';
import config from './config/index.js';
const pipeline = util.promisify(stream.pipeline);
export async function downloadUrl(url, path) {
    if (process.env.NODE_ENV !== 'production')
        console.log(`Downloading ${url} to ${path} ...`);
    const timeout = 30 * 1000;
    const operationTimeout = 60 * 1000;
    const maxSize = config.maxFileSize || 262144000;
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split('/').pop() ?? 'unknown';
    const req = got.stream(url, {
        headers: {
            'User-Agent': config.userAgent,
        },
        timeout: {
            lookup: timeout,
            connect: timeout,
            secureConnect: timeout,
            socket: timeout,
            response: timeout,
            send: timeout,
            request: operationTimeout, // whole operation timeout
        },
        agent: {
            http: httpAgent,
            https: httpsAgent,
        },
        http2: false,
        retry: {
            limit: 0,
        },
        enableUnixSockets: false,
    }).on('response', (res) => {
        if ((process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') && !config.proxy && res.ip) {
            if (isPrivateIp(res.ip)) {
                console.log(`Blocked address: ${res.ip}`);
                req.destroy();
            }
        }
        const contentLength = res.headers['content-length'];
        if (contentLength != null) {
            const size = Number(contentLength);
            if (size > maxSize) {
                console.log(`maxSize exceeded (${size} > ${maxSize}) on response`);
                req.destroy();
            }
        }
        const contentDisposition = res.headers['content-disposition'];
        if (contentDisposition != null) {
            try {
                const parsed = parse(contentDisposition);
                if (parsed.parameters.filename) {
                    filename = parsed.parameters.filename;
                }
            }
            catch (e) {
                console.log(`Failed to parse content-disposition: ${contentDisposition}\n${e}`);
            }
        }
    }).on('downloadProgress', (progress) => {
        if (progress.transferred > maxSize) {
            console.log(`maxSize exceeded (${progress.transferred} > ${maxSize}) on downloadProgress`);
            req.destroy();
        }
    });
    try {
        await pipeline(req, fs.createWriteStream(path));
    }
    catch (e) {
        if (e instanceof Got.HTTPError) {
            throw new StatusError(`${e.response.statusCode} ${e.response.statusMessage}`, e.response.statusCode, e.response.statusMessage);
        }
        else {
            throw e;
        }
    }
    if (process.env.NODE_ENV !== 'production')
        console.log(`Download finished: ${url}`);
    return {
        filename,
    };
}
function isPrivateIp(ip) {
    for (const net of config.allowedPrivateNetworks || []) {
        const cidr = new IPCIDR(net);
        if (cidr.contains(ip)) {
            return false;
        }
    }
    return PrivateIp(ip) ?? false;
}
