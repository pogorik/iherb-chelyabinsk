#!/bin/bash
# Выполняется НА сервере после rsync (см. .github/workflows/deploy.yml).
# Вынесено в отдельный файл вместо одной длинной inline-команды через ssh —
# так надёжнее (нет проблем с экранированием кавычек/переносов строк при
# передаче через GitHub Actions) и проще отлаживать напрямую на сервере.
set -e
cd "$(dirname "$0")/.."

npm ci

echo "--- DEBUG ---"
pwd
echo "PATH=$PATH"
ls -la node_modules/.bin/next || echo "next bin MISSING"
node_modules/.bin/next --version || echo "next --version FAILED"
echo "--- END DEBUG ---"

npm run build
pm2 reload iherb-chelyabinsk --update-env || pm2 start npm --name iherb-chelyabinsk -- start
pm2 save
