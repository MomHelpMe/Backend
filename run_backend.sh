#!/bin/bash

# TEST: 개발 시 로컬 실행용

# Initialize the environment (arg 1 to clear everything)
if [ "$1" == "1" ]; then
    ./clear.sh
fi

# Run the web server
if [ -z "$(docker ps -aq -f name=nginx)" ]; then
    docker build -t nginx nginx/
    docker run -d -p 80:80 --name nginx nginx
fi

# Check if the container is not running
if [ -z "$(docker ps -aq -f name=postgres)" ]; then
    docker volume create db_data
    docker build -t postgres db/
    docker run -d -p 5432:5432 --name postgres --env-file .env -v db_data:/var/lib/postgresql/data postgres
fi

ENV_DIR="venv"
DOT_ENV_FILE=".env"

cd backend

cp ../$DOT_ENV_FILE .
echo "Copied $DOT_ENV_FILE."
sed -i '' 's/^DB_HOST=.*$/DB_HOST=localhost/' .env

# TEST: .env 파일의 변수들을 환경 변수로 설정 (슈퍼 유저를 생성하기 위해 필요)
if [ -f "$DOT_ENV_FILE" ]; then
    export $(grep -v '^#' $DOT_ENV_FILE | xargs)
    echo "Exported .env variables to environment."
else
    echo ".env file not found."
    exit 1
fi

if [ ! -d "$ENV_DIR" ]; then
    python3.12 -m venv $ENV_DIR
    echo "Virtual environment created at $ENV_DIR."
else
    echo "Virtual environment already exists at $ENV_DIR."
fi

source $ENV_DIR/bin/activate
echo "Virtual environment activated."

python3.12 -m pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    cnt=$(python3.12 -m pip freeze | grep -f requirements.txt | wc -l)
    if [ $cnt -lt $(cat requirements.txt | wc -l) ]; then
            python3.12 -m pip install -r requirements.txt
            echo "Installed packages from requirements.txt."
    else
        echo "Packages from requirements.txt are already installed."
    fi
else
    echo "requirements.txt not found."
    exit 1
fi

echo "Applying migrations..."
python3.12 manage.py makemigrations
python3.12 manage.py migrate

# Create a superuser
DJANGO_SUPERUSER_USERNAME=$DJANGO_SUPERUSER_USERNAME
DJANGO_SUPERUSER_PASSWORD=$DJANGO_SUPERUSER_PASSWORD
DJANGO_SUPERUSER_EMAIL=$DJANGO_SUPERUSER_EMAIL

USER_EXISTS=$(python3.12 manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
print(User.objects.filter(username='admin').exists())
")

if [ "$USER_EXISTS" = "False" ]; then
    echo "Creating superuser..."
    python3.12 manage.py createsuperuser --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL --noinput || true
fi

echo "Starting development server..."
# clear

python3.12 manage.py runserver 0.0.0.0:8000
