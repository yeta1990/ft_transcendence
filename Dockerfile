FROM node:lts-bullseye

RUN mkdir /usr/src/app

WORKDIR /usr/src/app
COPY ./backend/package.json /usr/src/app

RUN npm i -g npm@latest
RUN npm i -g @nestjs/cli
RUN npm cache clean -force 
RUN npm update
RUN npm install -g ts-node --save-dev

COPY ./scripts/install_node_dependencies.sh /
ENTRYPOINT ["/install_node_dependencies.sh"]
