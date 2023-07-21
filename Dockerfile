FROM node:18.10

RUN mkdir /usr/src/app

RUN chown -Rh $user:$user /usr/src/app
USER $user

WORKDIR /usr/src/app
COPY ./backend/package.json /usr/src/app

RUN npm install -g npm@9.6.2
RUN npm i -g @nestjs/cli
RUN npm install -g ts-node --save-dev
#RUN npm install

COPY ./scripts/install_node_dependencies.sh /
ENTRYPOINT ["/install_node_dependencies.sh"]
#CMD ["npm", "run", "start:dev"]
