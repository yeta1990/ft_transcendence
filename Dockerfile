FROM node:18.10

WORKDIR /usr/src/app
COPY ./scripts/install_node_dependencies.sh /
ENTRYPOINT ["/install_node_dependencies.sh"]
