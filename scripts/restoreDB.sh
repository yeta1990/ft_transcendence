#!/bin/bash
echo "This script will erase all data from the database called 'postgres'. Are you sure? [y/n]"
read -e confirm

if [[ $confirm -eq 'y' ]]
then
	docker exec tx_postgres dropdb -U postgres postgres
	docker exec tx_postgres createdb -U postgres postgres
	echo "Restoring "$(ls -t *sql | head -1)
	cat $(ls -t *sql | head -1) | docker exec -i tx_postgres psql -U postgres postgres
fi
