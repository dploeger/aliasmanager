FROM node:lts-alpine as build

WORKDIR /usr/local/app
COPY . .
RUN npm install && npm run build

FROM node:lts-alpine

WORKDIR /usr/local/app

COPY --from=build /usr/local/app/dist .
COPY --from=build /usr/local/app/package.json .

RUN npm install

ENTRYPOINT ["node", "/usr/local/app/main.js"]

