FROM node:lts-bullseye as build

RUN npm cache clean -f
RUN npm install -g npm@latest
RUN npm install -g @angular/cli

RUN mkdir /usr/src/app
RUN chown -Rh $USER:$USER /usr/src/app

USER $USER
WORKDIR /usr/src/app
ARG NG_CLI_ANALYTICS="false"
COPY ./src /usr/src/app
COPY ./shared /usr/src/app/shared

COPY ./src/package.json .
COPY ./install_angular_dependencies.sh /
#...........

EXPOSE 4200
RUN git config --global user.email "albgarci@students.42madrid.com"
RUN git config --global user.name "albgarci"
RUN npm install

ENTRYPOINT ["/install_angular_dependencies.sh"]
