#!/bin/sh
set -e

# Default DISABLE_AUTH to true for local docker unless overridden
: "${DISABLE_AUTH:=true}"

echo "window.ENV={DISABLE_AUTH:'${DISABLE_AUTH}'};" > /usr/share/nginx/html/env.js

exec nginx -g 'daemon off;'

