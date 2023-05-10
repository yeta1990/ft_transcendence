#!/bin/sh
cd /usr/src/app

export NG_CLI_ANALYTICS="false"

npm install -g npm@9.6.2
npm install -g @angular/cli
ng analytics off

cd srcs
npm install
npm run start
#ng serve --host 0.0.0.0 --port 4200
