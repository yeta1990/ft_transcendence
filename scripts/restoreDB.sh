#!/bin/bash

docker exec tx_postgres dropdb -U postgres postgres
docker exec tx_postgres createdb -U postgres postgres
echo "Restoring "$(ls -t *sql | head -1)
cat $(ls -t *sql | head -1) | docker exec -i tx_postgres psql -U postgres postgres
