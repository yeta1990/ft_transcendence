#!/bin/bash

# Ejecutar el comando "docker logs" para capturar la salida en lugar de "docker attach"
docker logs -f tx_nest > tx_nest.log 2>&1 &
docker logs -f tx_front > tx_front.log 2>&1 &

# Mostrar en tiempo real la salida de los archivos de registro
tail -f tx_nest.log & tail -f tx_front.log
