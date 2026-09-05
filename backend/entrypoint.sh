#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-localhost} ${DB_PORT:-5432}; do
  sleep 1
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis..."
while ! nc -z ${REDIS_HOST:-localhost} ${REDIS_PORT:-6379}; do
  sleep 1
done
echo "Redis is ready!"

# Run migrations
echo "Running database migrations..."
npm run migrate || echo "Migrations may have already run"

# Start the application
echo "Starting backend application..."
exec npm start
