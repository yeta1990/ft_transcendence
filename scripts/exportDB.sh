#!/bin/bash

echo "Select type of export:
1. Export 'postgres' db(recommended option for restoring db)
2: Full export of all dbs from postgresql server
3: Export specific database, with "CREATE" statement (if you have created another db different from default 'postgres')"

read -e type 

dtime=$(date +%Y-%m-%d_%H_%M_%S)

if [[ $type -eq 1 ]]
then
	filename="db_${dtime}.sql"
	docker exec -it tx_postgres pg_dump -U postgres postgres > ${filename} 
	echo "Exported to ${PWD}/${filename}"
elif [[ $type -eq 2 ]]
then
	filename="db_all_${dtime}.sql"
	docker exec -it tx_postgres pg_dumpall -U postgres > ${filename}
	echo "Exported to ${PWD}/${filename}"
elif [[ $type -eq 3 ]]
then
	echo "Type the db name"
	read -e dbname 
	filename="db_${dbname}_${dtime}.sql"
	docker exec -it tx_postgres pg_dump --create -U postgres ${dbname} > ${filename}
	echo "Exported to ${PWD}/${filename}"
fi

