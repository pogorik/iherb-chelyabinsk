#!/bin/bash
# Выполняется НА сервере после rsync (см. .github/workflows/deploy.yml).
# Вынесено в отдельный файл вместо одной длинной inline-команды через ssh —
# так надёжнее (нет проблем с экранированием кавычек/переносов строк при
# передаче через GitHub Actions) и проще отлаживать напрямую на сервере.
set -e
cd "$(dirname "$0")/.."

npm ci

# npm run build (→ "next build" через npm's PATH-обёртку) в этом окружении
# необъяснимо не находит next, хотя node_modules/.bin/next существует и
# прекрасно запускается напрямую — поэтому вызываем бинарник напрямую,
# в обход npm run.
./node_modules/.bin/next build
pm2 reload iherb-chelyabinsk --update-env || pm2 start npm --name iherb-chelyabinsk -- start
pm2 save
