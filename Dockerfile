FROM node:22-alpine AS build
ARG APP=marketing
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ARG VITE_BORROWER_URL=http://localhost:5174
ARG VITE_LENDER_URL=http://localhost:5175
ARG VITE_ADMIN_URL=http://localhost:5176
ARG VITE_OIDC_AUTHORITY=https://auth.codestra.co/realms/codestra
ARG VITE_OIDC_CLIENT_ID=
ARG VITE_OIDC_AUDIENCE=moneybee-api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BORROWER_URL=$VITE_BORROWER_URL \
    VITE_LENDER_URL=$VITE_LENDER_URL \
    VITE_ADMIN_URL=$VITE_ADMIN_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    VITE_OIDC_AUDIENCE=$VITE_OIDC_AUDIENCE
WORKDIR /src
RUN corepack enable
COPY . .
RUN pnpm install --no-frozen-lockfile && pnpm --filter @moneybee/$APP build

FROM nginx:1.27-alpine
ARG APP=marketing
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/$APP/dist /usr/share/nginx/html
EXPOSE 80
