#!/bin/sh
set -e

# Start Verigram Shared Leaderboard API daemon
echo "Starting Verigram Leaderboard API on port 3000..."
node /app/server.js &

# Start Nginx web server
echo "Starting Nginx frontend server..."
exec nginx -g "daemon off;"
