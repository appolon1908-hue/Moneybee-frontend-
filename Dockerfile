# syntax=docker/dockerfile:1.7
ARG NODE_BASE_IMAGE=node:22-alpine
ARG NGINX_BASE_IMAGE=nginx:alpine

FROM ${NODE_BASE_IMAGE} AS build
ARG APP=marketing
ARG VITE_API_BASE_URL=http://localhost:8000/api/v2
ARG VITE_BORROWER_URL=http://localhost:5174
ARG VITE_LENDER_URL=http://localhost:5175
ARG VITE_ADMIN_URL=http://localhost:5176
ARG VITE_OIDC_AUTHORITY=https://auth.codestra.co/realms/codestra
ARG VITE_OIDC_CLIENT_ID=
ARG VITE_OIDC_AUDIENCE=moneybee-api
ARG VITE_GOOGLE_LOGIN_ENABLED=false
ARG VITE_GOOGLE_IDP_ALIAS=google
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BORROWER_URL=$VITE_BORROWER_URL \
    VITE_LENDER_URL=$VITE_LENDER_URL \
    VITE_ADMIN_URL=$VITE_ADMIN_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_OIDC_AUDIENCE=$VITE_OIDC_AUDIENCE \
    VITE_GOOGLE_LOGIN_ENABLED=$VITE_GOOGLE_LOGIN_ENABLED \
    VITE_GOOGLE_IDP_ALIAS=$VITE_GOOGLE_IDP_ALIAS
WORKDIR /src
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @moneybee/$APP build

FROM ${NGINX_BASE_IMAGE} AS runtime
ARG APP=marketing
ARG SOURCE_SHA=unknown
ARG BUILD_DATE=unknown
LABEL org.opencontainers.image.source="https://github.com/appolon1908-hue/Moneybee-frontend-" \
      org.opencontainers.image.revision="${SOURCE_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      io.moneybee.portal="${APP}"
RUN rm -f /etc/nginx/conf.d/default.conf \
    && mkdir -p /tmp/nginx/client_temp /tmp/nginx/proxy_temp /tmp/nginx/fastcgi_temp /tmp/nginx/uwsgi_temp /tmp/nginx/scgi_temp \
    && chown -R nginx:nginx /tmp/nginx /var/cache/nginx /usr/share/nginx/html
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /src/apps/$APP/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
