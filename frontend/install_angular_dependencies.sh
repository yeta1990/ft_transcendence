#!/bin/sh
cd /usr/src/app/src

export NG_CLI_ANALYTICS="false"

ng analytics off
npm cache clean -force
npm update
npm install
#change in evaluation
npm run start
#npm run build
