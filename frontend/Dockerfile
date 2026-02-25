# Stage 1: Build
FROM node:22 AS build
WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["node", "build"]
