FROM node:lts as build

COPY . /usr/local/app
RUN cd /usr/local/app; \
    npm install; \
    npm run build

FROM node:lts
COPY --from=build /usr/local/app/dist /usr/local/app
COPY --from=build /usr/local/app/package.json /usr/local/app

RUN cd /usr/local/app; \
    npm install

ENTRYPOINT ["node", "/usr/local/app/main.js"]

