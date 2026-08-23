FROM node:22-alpine AS build

ARG APP
WORKDIR /src
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter "@moneybee/${APP}" build

FROM nginx:1.27-alpine
ARG APP
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/${APP}/dist /usr/share/nginx/html
EXPOSE 80
