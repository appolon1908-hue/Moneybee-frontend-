FROM node:22-bookworm-slim AS build
ARG APP=marketing
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @moneybee/${APP} build

FROM nginx:1.27-alpine
ARG APP=marketing
COPY --from=build /workspace/apps/${APP}/dist /usr/share/nginx/html
EXPOSE 80
