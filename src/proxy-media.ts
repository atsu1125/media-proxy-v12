import * as fs from 'node:fs';
import Koa from 'koa';
import cors from '@koa/cors';
import sharp from 'sharp';
import { IImage, convertToWebp } from './image-processor.js';
import { createTemp } from './create-temp.js';
import { downloadUrl } from './download.js';
import { detectType, isMimeImage } from './file-info.js';
import { StatusError } from './status-error.js';
import { FILE_TYPE_BROWSERSAFE } from './const.js';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function proxyMedia(ctx: Koa.Context) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	if (typeof url !== 'string') {
		ctx.status = 400;
		return;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(url, path);

		const { mime, ext } = await detectType(path);
		const isConvertibleImage = isMimeImage(mime, 'sharp-convertible-image');

		let image: IImage;

		if ('static' in ctx.query && isConvertibleImage) {
			image = await convertToWebp(path, 498, 280);
		} else if ('preview' in ctx.query && isConvertibleImage) {
			image = await convertToWebp(path, 200, 200);
		} else if ('badge' in ctx.query) {
			const mask = sharp(path)
				.resize(96, 96, {
					fit: 'inside',
					withoutEnlargement: false,
				})
				.greyscale()
				.normalise()
				.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
				.flatten({ background: '#000' })
				.toColorspace('b-w');

			const stats = await mask.clone().stats();

			if (stats.entropy < 0.1) {
				// エントロピーがあまりない場合は404にする
				throw new StatusError('Skip to provide badge', 404);
			}

			const data = sharp({
				create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
			})
				.pipelineColorspace('b-w')
				.boolean(await mask.png().toBuffer(), 'eor');

			image = {
				data: await data.png().toBuffer(),
				ext: 'png',
				type: 'image/png',
			};
		}	else if (mime === 'image/svg+xml') {
			image = await convertToWebp(path, 2048, 2048, 1);
		} else if (!FILE_TYPE_BROWSERSAFE.includes(mime)) {
			throw new StatusError('Rejected type', 403, 'Rejected type');
		} else {
			image = {
				data: fs.readFileSync(path),
				ext,
				type: mime,
			};
		}

		ctx.set('Content-Type', image.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.body = image.data;
	} catch (e) {
    console.log(`${e}`);

		if (e instanceof StatusError && (e.statusCode === 302 || e.isClientError)) {
			ctx.status = e.statusCode;
		} else {
			ctx.status = 500;
		}
	} finally {
		cleanup();
	}
}
