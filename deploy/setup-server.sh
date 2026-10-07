#!/bin/bash
# One-time setup of the Nearest Essentials Finder API on an Ubuntu server that
# already runs Caddy. Safe to run again: every step checks before it changes.
#
#   sudo bash setup-server.sh essentials-api.example.duckdns.org
#
# Installs Java 21 + MySQL, tunes MySQL for a 1 GB machine, creates the database
# and a dedicated user with a random password, adds a systemd service and a
# Caddy site (automatic HTTPS) that forwards to the app on 127.0.0.1:8080.
set -euo pipefail

DOMAIN="${1:?usage: sudo bash setup-server.sh <api-domain>}"
APP_DIR=/opt/essentials-finder
ENV_FILE=/etc/essentials-finder.env
SERVICE=essentials-finder

echo "==> Swap (small servers need it for Java + MySQL)"
if ! swapon --show | grep -q .; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/90-swappiness.conf
fi

echo "==> Packages"
export DEBIAN_FRONTEND=noninteractive
if ! command -v java >/dev/null || ! command -v mysqld >/dev/null; then
  apt-get update -qq
  apt-get install -y -qq openjdk-21-jre-headless mysql-server >/dev/null
fi

echo "==> MySQL low-memory settings"
cat > /etc/mysql/mysql.conf.d/zz-low-memory.cnf <<'EOF'
[mysqld]
bind-address = 127.0.0.1
mysqlx = OFF
performance_schema = OFF
innodb_buffer_pool_size = 64M
innodb_log_buffer_size = 8M
max_connections = 30
table_open_cache = 200
key_buffer_size = 8M
EOF
systemctl restart mysql

echo "==> Service user and folders"
id -u essentials >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin essentials
mkdir -p "$APP_DIR"
chown ubuntu:ubuntu "$APP_DIR"   # deploys upload as ubuntu; the service only reads

echo "==> Database and credentials"
if [ ! -f "$ENV_FILE" ]; then
  DB_PASSWORD="$(openssl rand -base64 30 | tr -dc 'A-Za-z0-9' | head -c 32)"
  mysql <<SQL
CREATE DATABASE IF NOT EXISTS essentials_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'essentials'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
ALTER USER 'essentials'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON essentials_finder.* TO 'essentials'@'localhost';
FLUSH PRIVILEGES;
SQL
  install -m 640 -o root -g essentials /dev/null "$ENV_FILE"
  cat > "$ENV_FILE" <<EOF
# Read by the essentials-finder systemd service. Keep private.
PORT=8080
SERVER_ADDRESS=127.0.0.1
DB_URL=jdbc:mysql://localhost:3306/essentials_finder?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=essentials
DB_PASSWORD=${DB_PASSWORD}
CORS_ORIGINS=https://*.vercel.app,http://localhost:5173
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=5
SERVER_TOMCAT_THREADS_MAX=40
EOF
  echo "    created $ENV_FILE (password generated, not printed)"
fi

echo "==> systemd service"
cat > /etc/systemd/system/$SERVICE.service <<EOF
[Unit]
Description=Nearest Essentials Finder API (Spring Boot)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=essentials
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
# Small, fixed memory budget so it lives happily next to MySQL and CipherLink on 1 GB.
ExecStart=/usr/bin/java -Xms96m -Xmx256m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -Xss512k -XX:TieredStopAtLevel=1 -jar $APP_DIR/app.jar
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable $SERVICE >/dev/null 2>&1

echo "==> Caddy site for $DOMAIN"
CADDYFILE=/etc/caddy/Caddyfile
if ! grep -q "^$DOMAIN " "$CADDYFILE"; then
  # Build the new config next to the old one and only swap it in if Caddy accepts it,
  # so a mistake here can never take down the other sites on this server.
  NEW=$(mktemp)
  cp "$CADDYFILE" "$NEW"
  cat >> "$NEW" <<EOF

$DOMAIN {
	encode gzip
	reverse_proxy localhost:8080
}
EOF
  caddy validate --config "$NEW" --adapter caddyfile >/dev/null 2>&1 || { echo "Caddy rejected the new config"; rm -f "$NEW"; exit 1; }
  cp "$CADDYFILE" "$CADDYFILE.bak.$(date +%Y%m%d%H%M%S)"
  install -m 644 "$NEW" "$CADDYFILE"
  rm -f "$NEW"
  systemctl reload caddy
fi

echo "==> Done. Upload the jar to $APP_DIR/app.jar and run: sudo systemctl restart $SERVICE"
