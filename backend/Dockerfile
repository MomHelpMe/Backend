FROM python:3.12.4-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install PostgreSQL client and development headers
RUN apt-get update && \
  apt-get install -y \
  gcc \
  libpq-dev \
  curl && \
  rm -rf /var/lib/apt/lists/* && \
  mkdir /app

WORKDIR /app

COPY . .
RUN chmod -R 755 /app

CMD ["./docker-run-server"]
