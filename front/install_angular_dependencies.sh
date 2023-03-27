#!/bin/sh
cd /usr/src/app

export NG_CLI_ANALYTICS="false"

npm install -g npm@9.6.2
echo 'N' | npm install -g @angular/cli
ng analytics off
if [ ! -d ./my-app ]
then
	ng new my-app --defaults
fi

cd my-app

ng serve --host 0.0.0.0 --port 4200
