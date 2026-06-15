# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Stage 2: Install dependencies
FROM base AS dependencies
RUN npm ci

# Stage 3: Test runner
FROM dependencies AS test
COPY . .
ENV NODE_ENV=test
# Jest requires SQLite or postgres. We will test on SQLite.
CMD ["npm", "run", "test"]

# Stage 4: Production runner
FROM base AS production
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
# Run as non-privileged node user for security
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
