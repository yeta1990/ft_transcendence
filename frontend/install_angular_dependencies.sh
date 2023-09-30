#!/bin/sh
cd /usr/src/app/src

export NG_CLI_ANALYTICS="false"

ng analytics off
npm install
npm run start
