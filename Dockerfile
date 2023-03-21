FROM node:18.10

WORKDIR /usr/src/app
COPY script.sh /
ENTRYPOINT ["/script.sh"]
