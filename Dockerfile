FROM node:22-alpine AS build
ARG APP=marketing
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /src
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile && pnpm --filter @moneybee/$APP build

FROM nginx:1.27-alpine
ARG APP=marketing
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/$APP/dist /usr/share/nginx/html
EXPOSE 80
