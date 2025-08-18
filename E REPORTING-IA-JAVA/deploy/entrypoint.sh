#!/bin/sh
set -e
# Ensure PORT exists (Render sets PORT for web services)
if [ -z "$PORT" ]; then
  export PORT=10000
fi
# Inject PORT into nginx config
envsubst < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf