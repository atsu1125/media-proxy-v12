/**
 * Media Proxy
 */
import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
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
const PORT = process.env.PORT || config.port || 3000;
const env = process.env.NODE_ENV;
app.listen(PORT, () => {
    console.log(typeof env === 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);
    if (env !== 'production') {
        console.log('The environment is not in production mode.');
        console.log('DO NOT USE FOR PRODUCTION PURPOSE!');
    }
    console.log(`Now listening on port:${PORT}`);
});
export default app;
