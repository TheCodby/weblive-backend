# PRODUCTION DOCKERFILE
FROM node:18-alpine as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci
COPY --chown=node:node . .
RUN npx prisma generate
RUN npm run build \
    && npm prune --production

# ---

FROM node:18-alpine

ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/
COPY --from=builder --chown=node:node /home/node/prisma ./prisma

CMD [ "npm", "run", "start:migrate:prod" ]