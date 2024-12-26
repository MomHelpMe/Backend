#!/bin/bash

# TEST: 개발 시 로컬 실행용

DOT_ENV=".env"
ENV_DIR="venv"

# Check if .env file exists
if [ ! -f "$DOT_ENV" ]; then
  echo "$DOT_ENV file not found."
  exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# Initialize the environment (arg 1 to clear everything)
if [ "$1" == "1" ]; then
  ./clean.sh
fi

# Run the web server
if [ -z "$(docker ps -aq -f name=nginx)" ]; then
  sh nginx/make_config.sh local
  docker build -t nginx nginx/
  docker run -d -p 443:443 --name nginx nginx
fi

# Run the database server
if [ -z "$(docker ps -aq -f name=postgres)" ]; then
  sed -i '' 's/^DB_HOST=.*$/DB_HOST=localhost/' $DOT_ENV
  docker volume create db_data
  docker build -t postgres db/
  docker run -d -p 5432:5432 --name postgres --env-file $DOT_ENV -v db_data:/var/lib/postgresql/data postgres
fi

cd backend

if [ ! -d "$ENV_DIR" ]; then
  python3.12 -m venv $ENV_DIR
  echo "Virtual environment created at $ENV_DIR."
else
  echo "Virtual environment already exists at $ENV_DIR."
fi

source $ENV_DIR/bin/activate
echo "Virtual environment activated."

python3.12 -m pip install -q --upgrade pip
if [ -f "requirements.txt" ]; then
  cnt=$(python3.12 -m pip freeze | grep -f requirements.txt | wc -l)
  if [ $cnt -lt $(cat requirements.txt | wc -l) ]; then
      python3.12 -m pip install -q -r requirements.txt
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

# Create a superuser (dotenv variables)
DJANGO_SUPERUSER_USERNAME=$(grep DJANGO_SUPERUSER_USERNAME ../$DOT_ENV | cut -d '=' -f2)
DJANGO_SUPERUSER_PASSWORD=$(grep DJANGO_SUPERUSER_PASSWORD ../$DOT_ENV | cut -d '=' -f2)
DJANGO_SUPERUSER_EMAIL=$(grep DJANGO_SUPERUSER_EMAIL ../$DOT_ENV | cut -d '=' -f2)

USER_EXISTS=$(python3.12 manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
print(User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists())
")

if [ "$USER_EXISTS" = "False" ]; then
  echo "Creating superuser..."
  python3.12 manage.py createsuperuser --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL --noinput || true
fi

echo "Starting development server..."
python3.12 manage.py runserver 0.0.0.0:8000
