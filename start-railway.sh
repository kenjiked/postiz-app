#!/bin/sh
# Railway startup script - prevents PORT conflict between nginx and backend
echo "=== Railway Start ==="
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "REDIS_URL: ${REDIS_URL:0:30}..."
echo "PORT env: $PORT"

# Start nginx (listens on port 5000)
nginx

# Override PORT for pm2 processes so backend uses 3000, not Railway's PORT
export PORT=3000

# Run prisma db push
echo "=== Running Prisma DB Push ==="
pnpm run prisma-db-push 2>&1
PRISMA_EXIT=$?
echo "=== Prisma exit code: $PRISMA_EXIT ==="

if [ $PRISMA_EXIT -ne 0 ]; then
    echo "=== Prisma DB Push FAILED ==="
    exit 1
fi

# Start pm2 processes
echo "=== Starting PM2 ==="
pm2 delete all 2>/dev/null || true
pnpm run --parallel pm2

# Wait for processes to start
sleep 5
pm2 list
echo "=== PM2 Started ==="

# Follow logs
pm2 logs
