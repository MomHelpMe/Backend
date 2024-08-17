#!/bin/bash

if [ -f "requirements.txt" ]; then
    pip install --upgrade pip && pip install -r requirements.txt
    echo "Installed packages from requirements.txt."
else
    echo "requirements.txt not found."
    exit 1
fi

echo "Applying migrations..."
python manage.py makemigrations
python manage.py migrate

# Create a superuser
DJANGO_SUPERUSER_USERNAME=$DJANGO_SUPERUSER_USERNAME
DJANGO_SUPERUSER_PASSWORD=$DJANGO_SUPERUSER_PASSWORD
DJANGO_SUPERUSER_EMAIL=$DJANGO_SUPERUSER_EMAIL

USER_EXISTS=$(python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
print(User.objects.filter(username='admin').exists())
")

echo "USER_EXISTS: $USER_EXISTS"

if [ "$USER_EXISTS" = "False" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --username $DJANGO_SUPERUSER_USERNAME --email $DJANGO_SUPERUSER_EMAIL --noinput || true
fi

echo "Starting development server..."
python manage.py runserver 0.0.0.0:8000
