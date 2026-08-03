#!/bin/bash
# Выполняется НА сервере после rsync (см. .github/workflows/deploy.yml).
# Вынесено в отдельный файл вместо одной длинной inline-команды через ssh —
# так надёжнее (нет проблем с экранированием кавычек/переносов строк при
# передаче через GitHub Actions) и проще отлаживать напрямую на сервере.
set -e
cd "$(dirname "$0")/.."

npm ci

# .next исключён из rsync (см. deploy.yml), поэтому между деплоями остаётся
# старый .next/cache — Turbopack иногда переиспользует из него устаревший
# скомпилированный чанк вместо актуального кода. Полная пересборка с нуля
# каждый раз стоит нескольких секунд, зато не даёт закэшировать баг.
rm -rf .next

# npm run build (→ "next build" через npm's PATH-обёртку) в этом окружении
# необъяснимо не находит next, хотя node_modules/.bin/next существует и
# прекрасно запускается напрямую — поэтому вызываем бинарник напрямую,
# в обход npm run.
./node_modules/.bin/next build
pm2 delete iherb-chelyabinsk 2>/dev/null || true
pm2 start npm --name iherb-chelyabinsk -- start
pm2 save
