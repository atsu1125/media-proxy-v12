FROM node:18.20.4-bookworm-slim

ENV NODE_ENV=production

WORKDIR /misskey-media-proxy

COPY . ./

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile

CMD ["pnpm", "run", "start"]
