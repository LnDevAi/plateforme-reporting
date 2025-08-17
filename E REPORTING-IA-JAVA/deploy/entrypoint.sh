#!/bin/sh
set -e
# Inject PORT into nginx conf and set proxy to backend 8081
envsubst < /etc/nginx/conf.d/default.conf > /tmp/default.conf
mv /tmp/default.conf /etc/nginx/conf.d/default.conf
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf