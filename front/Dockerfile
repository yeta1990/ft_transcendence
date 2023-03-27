FROM node:18.10

WORKDIR /usr/src/app
COPY ./install_angular_dependencies.sh /
RUN git config --global user.email "albgarci@students.42madrid.com"
RUN git config --global user.name "albgarci"
ARG NG_CLI_ANALYTICS="false"
EXPOSE 4200

ENTRYPOINT ["/install_angular_dependencies.sh"]
