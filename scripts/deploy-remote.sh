#!/bin/bash
# Выполняется НА сервере после rsync (см. .github/workflows/deploy.yml).
# Вынесено в отдельный файл вместо одной длинной inline-команды через ssh —
# так надёжнее (нет проблем с экранированием кавычек/переносов строк при
# передаче через GitHub Actions) и проще отлаживать напрямую на сервере.
set -e
cd "$(dirname "$0")/.."

npm ci

# Собираем во временную папку, а не прямо в .next — иначе весь билд идёт
# в той же директории, откуда ЖИВОЙ процесс параллельно раздаёт сайт, и
# запрос, попавший в окно rm+build, читает наполовину пересобранные файлы
# (отсюда "client reference manifest does not exist" и подобные падения).
# npm run build (→ "next build" через npm's PATH-обёртку) в этом окружении
# необъяснимо не находит next, хотя node_modules/.bin/next существует и
# прекрасно запускается напрямую — поэтому вызываем бинарник напрямую,
# в обход npm run.
rm -rf .next-new
NEXT_DIST_DIR=.next-new ./node_modules/.bin/next build

# Переименование в пределах одной файловой системы атомарно: уже открытые
# файловые дескрипторы старого процесса остаются валидными и после rename,
# так что живой процесс продолжает нормально работать со старым .next вплоть
# до самого pm2 reload ниже — простоя на время билда нет.
rm -rf .next-old
[ -d .next ] && mv .next .next-old
mv .next-new .next
rm -rf .next-old

pm2 reload iherb-chelyabinsk --update-env || pm2 start ./node_modules/.bin/next --name iherb-chelyabinsk -- start
pm2 save
