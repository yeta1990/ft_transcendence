FROM node:18.10

WORKDIR /usr/src/app

COPY srcs/package*.json /usr/src/app/package.json

RUN [ "npm", "install" ]
