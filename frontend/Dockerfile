FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

FROM base AS desenvolvimento
RUN mkdir -p node_modules/.vite && chown -R node:node node_modules/.vite
COPY . .
USER node
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS compilacao
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS producao
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacao /app/dist /usr/share/nginx/html
EXPOSE 5173
