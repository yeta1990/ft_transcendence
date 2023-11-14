FROM node:lts

RUN npm install -g npm@10.2.3
RUN npm install -g @angular/cli

RUN mkdir /usr/src/app
RUN chown -Rh $USER:$USER /usr/src/app

USER $USER
WORKDIR /usr/src/app
ARG NG_CLI_ANALYTICS="false"
COPY ./src /usr/src/app
COPY ./shared /usr/src/app/shared

#remove before evaluaation
COPY ./src/package.json .
COPY ./install_angular_dependencies.sh /
#...........

EXPOSE 4200
RUN git config --global user.email "albgarci@students.42madrid.com"
RUN git config --global user.name "albgarci"
RUN npm install
#RUN npm run build

#FROM nginx:latest
#COPY --from=build /usr/src/app/dist/my-app /usr/share/nginx/html

EXPOSE 80

#remove before evaluaation
ENTRYPOINT ["/install_angular_dependencies.sh"]
