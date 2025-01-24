/**
 * Media Proxy
 */

import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import * as portscanner from 'portscanner';
import { proxyMedia } from './proxy-media.js';
import config from './config/index.js';

// Init app
const app = new Koa();
app.use(cors());
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  ctx.set('Content-Security-Policy', `default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'`);
  await next();
});

// Init router
const router = new Router();

router.get('/:url*', proxyMedia);

// Register router
app.use(router.routes());

// Start the server
const PORT = Number(process.env.PORT) || config.port || 3000;
const env = process.env.NODE_ENV;

function isRoot() {
	// maybe process.getuid will be undefined under not POSIX environment (e.g. Windows)
	return process.getuid != null && process.getuid() === 0;
}

async function validatePort(PORT: number): Promise<void> {
	const isWellKnownPort = (port: number) => port < 1024;

	async function isPortAvailable(port: number): Promise<boolean> {
		return await portscanner.checkPortStatus(port, '127.0.0.1') === 'closed';
	}

	if (PORT == null || Number.isNaN(PORT)) {
    console.error('The port is not configured. Please configure port.');
		process.exit(1);
	}

	if (process.platform === 'linux' && isWellKnownPort(PORT) && !isRoot()) {
    console.error('You need root privileges to listen on well-known port on Linux');
		process.exit(1);
	}

	if (!await isPortAvailable(PORT)) {
    console.error(`Port ${PORT} is already in use`);
		process.exit(1);
	}
}

await validatePort(PORT);

const server = app.listen(PORT, () => {
  console.log(typeof env === 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);
  if (env !== 'production') {
    console.log('The environment is not in production mode.');
    console.log('DO NOT USE FOR PRODUCTION PURPOSE!');
  }
  console.log(`Now listening on port:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

export default app;
