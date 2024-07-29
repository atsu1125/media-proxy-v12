FROM node:18.20.4-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
	libjemalloc-dev libjemalloc2 \
	&& ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so \
	&& apt-get clean \
	&& rm -rf /var/lib/apt/lists

ENV NODE_ENV=production
ENV LD_PRELOAD=/usr/local/lib/libjemalloc.so

WORKDIR /misskey-media-proxy

COPY . ./

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile

CMD ["pnpm", "run", "start"]
