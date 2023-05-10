FROM node:18.10

RUN npm install -g npm@9.6.2

RUN mkdir /usr/src/app/shared
RUN chown -Rh $USER:$USER /usr/src/app/shared

USER $USER
WORKDIR /usr/src/app/shared
COPY ./shared/package.json .
COPY ./shared/tsconfig.json .

COPY ./shared/install_shared_dependencies.sh /

EXPOSE 4000

ENTRYPOINT ["/install_shared_dependencies.sh"]