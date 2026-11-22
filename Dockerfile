# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.23.5

# ---- base: deps installées ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- dev: serveur Nuxt avec HMR (code monté en volume) ----
FROM deps AS dev
ENV NODE_ENV=development HOST=0.0.0.0 PORT=3000
EXPOSE 3000
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- build: génération du site statique (SPA, ssr: false) ----
FROM deps AS build
COPY . .
RUN npm run generate

# ---- prod: nginx sert .output/public ----
FROM nginx:1.30.7-alpine AS prod
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
