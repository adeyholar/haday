# HaDay — Node 22 container for Azure App Service and any Docker host.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ENV NITRO_PRESET=node-server
ENV VITE_AUTH_ENABLED=true
ENV PATH="/app/node_modules/.bin:${PATH}"
RUN node scripts/with-app-env.mjs vite build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.output ./.output
COPY migrations ./migrations
COPY scripts ./scripts
EXPOSE 8080
CMD ["sh", "-c", "node scripts/migrate.mjs && node scripts/copy-from-neon.mjs && node .output/server/index.mjs"]
