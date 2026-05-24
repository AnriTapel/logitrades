# Stage 1: Build
FROM node:22 AS build
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN corepack prepare --activate
RUN pnpm install --frozen-lockfile

COPY . .

ARG BACKEND_API_URL
ENV BACKEND_API_URL=${BACKEND_API_URL}

RUN pnpm build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["node", "build"]
