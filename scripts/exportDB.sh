#!/bin/sh

echo "Select type of export:\n
1: Full export of postgresql server\n
2: Export of database 'trax' data\n
3: Export of database 'trax' with CREATE TABLE included\n
"
read -e type 


if [[ $type -eq 1 ]]
then
	docker exec -it tx_postgres pg_dumpall -U postgres > alldb.sql
	echo "Exported to ${PWD}/alldb.sql"
elif [[ $type -eq 2 ]]
then
	echo "Type the db name"
	read -e dbname 
	docker exec -it tx_postgres pg_dump -U postgres ${dbname} > db.sql
	echo "Exported to ${PWD}/db.sql"
elif [[ $type -eq 3 ]]
then
	echo "Type the db name"
	read -e dbname 
	docker exec -it tx_postgres pg_dump --create -U postgres ${dbname} > db_with_create.sql
	echo "Exported to ${PWD}/db_with_create.sql"
fi


