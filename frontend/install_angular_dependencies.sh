#!/bin/sh
cd /usr/src/app/src

export NG_CLI_ANALYTICS="false"

ng analytics off
npm cache clean -force
npm update
npm install
npm run build
