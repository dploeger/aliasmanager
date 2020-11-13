FROM node:lts-alpine

WORKDIR /usr/local/app
COPY . .
RUN npm install
