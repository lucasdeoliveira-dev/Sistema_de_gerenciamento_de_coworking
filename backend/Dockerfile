FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS desenvolvimento
RUN npm ci && npm cache clean --force
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS producao
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
USER node
EXPOSE 3000
CMD ["npm", "start"]
