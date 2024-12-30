#!/bin/bash

if [ ! -z "$(docker ps -aq -f name=postgres)" ]; then
    docker rm -f postgres > /dev/null 2>&1 
    docker rmi -f postgres > /dev/null 2>&1
    docker volume rm transcendence_db_data > /dev/null 2>&1
fi
if [ ! -z "$(docker ps -aq -f name=nginx)" ]; then
    docker rm -f nginx > /dev/null 2>&1
    docker rmi -f nginx > /dev/null 2>&1
fi
rm -rf backend/*/migrations venv backend/.env
for d in backend/*/; do
    if [ "$d" == "backend/transcendence/" ]; then
        continue
    fi
    mkdir $d/migrations
    touch $d/migrations/__init__.py
done

docker ps -a && docker images -a && docker volume ls
