#!/bin/bash
# TEST: 개발 시 로컬 실행용

cp .env.local .env
cp .env.local frontend/.env
cd frontend && npm install && npm run dev
