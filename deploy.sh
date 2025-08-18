#!/usr/bin/env bash
set -euo pipefail

# One-shot VPS deployer for E REPORTING-IA-JAVA (Docker)
# Usage: ./deploy.sh [--backend-port PORT] [--frontend-port PORT] [--no-cache] [--clean]
# Examples:
#   ./deploy.sh --backend-port 9090 --frontend-port 9091
#   ./deploy.sh --clean --no-cache

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env"

BACKEND_PORT=""
FRONTEND_PORT=""
NO_CACHE="false"
DO_CLEAN="false"

log() { echo "[deploy] $*"; }
err() { echo "[deploy][error] $*" >&2; }

have_cmd(){ command -v "$1" >/dev/null 2>&1; }

require_rootless(){
  if [[ $(id -u) -ne 0 ]]; then
    SUDO="sudo"
  else
    SUDO=""
  fi
}

parse_args(){
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --backend-port)
        BACKEND_PORT="${2:?port required}"; shift 2;;
      --frontend-port)
        FRONTEND_PORT="${2:?port required}"; shift 2;;
      --no-cache)
        NO_CACHE="true"; shift;;
      --clean)
        DO_CLEAN="true"; shift;;
      -h|--help)
        cat <<EOF
Usage: ./deploy.sh [--backend-port PORT] [--frontend-port PORT] [--no-cache] [--clean]
Deploys the stack with Docker Compose. Auto-selects free ports if not provided.
EOF
        exit 0;;
      *) err "Unknown arg: $1"; exit 1;;
    esac
  done
}

install_docker(){
  if have_cmd docker && docker --version >/dev/null 2>&1; then
    log "Docker found: $(docker --version | head -n1)"
  else
    log "Installing Docker (CE)";
    $SUDO apt-get update -y
    $SUDO apt-get install -y ca-certificates curl gnupg lsb-release
    $SUDO install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO tee /etc/apt/keyrings/docker.asc >/dev/null
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
    $SUDO apt-get update -y
    $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    $SUDO systemctl enable --now docker || true
  fi
  if ! docker compose version >/dev/null 2>&1; then
    err "docker compose plugin missing"; exit 1
  fi
}

port_free(){ local p="$1"; ss -ltn "sport = :$p" | tail -n +2 | wc -l; }

choose_ports(){
  if [[ -z "${BACKEND_PORT}" || -z "${FRONTEND_PORT}" ]]; then
    local cand_b cand_f
    for cand_b in 8080 9090 10080 18080; do
      if [[ $(port_free "$cand_b") -eq 0 ]]; then BACKEND_PORT="$cand_b"; break; fi
    done
    for cand_f in 8081 9091 10081 18081; do
      if [[ $(port_free "$cand_f") -eq 0 ]]; then FRONTEND_PORT="$cand_f"; break; fi
    done
  fi
  if [[ -z "$BACKEND_PORT" || -z "$FRONTEND_PORT" ]]; then
    err "Could not find free ports. Specify with --backend-port/--frontend-port"; exit 1
  fi
  if [[ "$BACKEND_PORT" == "$FRONTEND_PORT" ]]; then
    err "Ports must differ"; exit 1
  fi
  log "Using ports -> BACKEND_PORT=$BACKEND_PORT, FRONTEND_PORT=$FRONTEND_PORT"
}

write_env(){
  cat > "$ENV_FILE" <<EOF
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF
  log "Wrote $ENV_FILE"
}

compose_down(){
  $SUDO docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down ${DO_CLEAN:+--volumes}
}

compose_build_up(){
  local build_flags=()
  [[ "$NO_CACHE" == "true" ]] && build_flags+=("--no-cache")
  DOCKER_BUILDKIT=0 $SUDO docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build "${build_flags[@]}" backend
  $SUDO docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend
  wait_http "http://127.0.0.1:$BACKEND_PORT/api/health" 120
  log "Backend healthy"

  DOCKER_BUILDKIT=0 $SUDO docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build "${build_flags[@]}" frontend
  $SUDO docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend
  wait_http "http://127.0.0.1:$FRONTEND_PORT" 120
  wait_http "http://127.0.0.1:$FRONTEND_PORT/api/health" 120 || log "Warning: frontend proxy /api/health not ready yet"
}

wait_http(){
  local url="$1"; local timeout="${2:-90}"; local t=0
  until curl -fsS "$url" >/dev/null 2>&1; do
    sleep 2; t=$((t+2));
    if (( t >= timeout )); then
      err "Timeout waiting for $url"; return 1
    fi
  done
}

open_firewall(){
  if have_cmd ufw && $SUDO ufw status | grep -q "Status: active"; then
    $SUDO ufw allow "$FRONTEND_PORT"/tcp || true
    log "Opened ufw for port $FRONTEND_PORT"
  fi
}

summary(){
  cat <<EOF

Deployment complete.
Frontend: http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT
API:      http://$(hostname -I | awk '{print $1}'):$BACKEND_PORT/api/health
EOF
}

main(){
  require_rootless
  parse_args "$@"
  install_docker
  choose_ports
  write_env
  compose_down || true
  compose_build_up
  open_firewall
  summary
}

main "$@"