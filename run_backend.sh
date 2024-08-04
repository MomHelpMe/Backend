#!/bin/bash

# TEST: 개발 시 로컬 실행용

# Check if the container is already running
if ! docker ps -q -f name=postgres >/dev/null; then
    docker volume create db_data
    docker build -t postgres db/
    docker run -d -p 5432:5432 --name postgres --env-file .env -v db_data:/var/lib/postgresql/data postgres
fi

sh backend/run-server.sh
