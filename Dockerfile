# syntax=docker/dockerfile:1

FROM node:lts-alpine
WORKDIR /app
COPY . .
RUN yarn install --production
# ? FIXME: NODE_ENV environment variable should be set to 'production' ?
CMD ["node", "src/index.js"]
EXPOSE 3000
