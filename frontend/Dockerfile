FROM node:18.10

RUN npm install -g npm@9.6.2
RUN npm install -g @angular/cli

RUN mkdir /usr/src/app
RUN chown -Rh $USER:$USER /usr/src/app

#USER $user
USER $USER
WORKDIR /usr/src/app
ARG NG_CLI_ANALYTICS="false"
COPY ./src/package.json .
#RUN ng new angulardockerproject
COPY ./install_angular_dependencies.sh /
EXPOSE 4200
RUN git config --global user.email "albgarci@students.42madrid.com"
RUN git config --global user.name "albgarci"
RUN npm install
RUN echo $PWD
#CMD tail -f /dev/null 

#CMD ng serve --host 0.0.0.0
#RUN cd /usr/src/app && ng serve --host 0.0.0.0

ENTRYPOINT ["/install_angular_dependencies.sh"]
