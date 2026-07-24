# NutriHome

Сайт-каталог магазина витаминов и БАДов с админ-панелью. Next.js (App Router) +
TypeScript + Tailwind CSS v4, статический экспорт для GitHub Pages + Supabase
(база данных, авторизация) как бэкенд.

## Что реализовано

- **Главная**: hero-баннер, блок категорий по назначению, витрина хитов продаж.
- **Каталог** (`/catalog`): поиск, сортировка, фильтры (Назначение, Активный
  компонент, Бренд, Цена, Наличие), пилюли «Все / Взрослые / Дети / SALE»,
  быстрый просмотр товара, пагинация «Показать ещё».
- **Корзина**: хранится в `localStorage`, доступна из шапки на любой странице.
- **Оформление заказа**: мини-форма (имя/телефон/комментарий) собирает текст
  заявки, открывает WhatsApp (`wa.me`) и сохраняет заказ в базу (виден в
  админке).
- **Админка** (`/admin`, за логином/паролем): товары (добавление, редактирование,
  удаление), категории и бренды, контент сайта (hero-текст, контакты, соцсети),
  список заказов со сменой статуса, дашборд со статистикой (заказы, выручка,
  топ товаров).
- Товары, категории, бренды и настройки сайта хранятся в Supabase — витрина и
  админка читают/пишут одни и те же данные. `lib/products.ts` теперь используется
  только как seed-данные для первого заполнения базы.

## Настройка Supabase (один раз)

1. Зарегистрируйтесь на [supabase.com](https://supabase.com) и создайте проект (бесплатно).
2. В **SQL Editor** выполните целиком файл [`supabase/schema.sql`](supabase/schema.sql) —
   создаст таблицы и политики Row Level Security.
3. В **Authentication → Users** создайте одного пользователя (email + пароль) —
   это и есть логин в `/admin`.
4. В **Settings → API** возьмите `Project URL` и `anon public key`.
5. Скопируйте `.env.local.example` в `.env.local` и заполните `NEXT_PUBLIC_SUPABASE_URL`
   / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (публичные значения — безопасно использовать
   в клиентском коде, данные защищены RLS-политиками, не секретностью ключа).
6. Там же в `.env.local` укажите `SUPABASE_SERVICE_ROLE_KEY` (Settings → API →
   `service_role`, **секретный**, не путать с anon) — нужен только для
   одноразового переноса демо-товаров в базу:

   ```bash
   npm install
   npm run seed
   ```

   `SUPABASE_SERVICE_ROLE_KEY` никогда не коммитится и не используется в
   клиентском коде — только локально для `npm run seed`.

## Быстрый старт

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000), админка — на
[http://localhost:3000/admin](http://localhost:3000/admin).

## Деплой на GitHub Pages + Supabase

Помимо шагов из раздела «Деплой» ниже, добавьте в репозитории **Settings →
Secrets and variables → Actions** два секрета: `NEXT_PUBLIC_SUPABASE_URL` и
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (те же значения, что в `.env.local`) —
workflow подставит их при сборке (`.github/workflows/deploy.yml`).

## Изображения товаров

Загружаются в форме товара в админке (Supabase Storage, бакет `product-images`,
создаётся вместе с остальной схемой из `supabase/schema.sql`). Пока фото не
загружено — показывается сгенерированная SVG-заглушка (`components/product-glyph.tsx`),
логика переключения — в `components/product-image.tsx`.

## Деплой на GitHub Pages

Сайт настроен на **статический экспорт** (`output: "export"` в
`next.config.ts`) и деплоится через GitHub Actions
(`.github/workflows/deploy.yml`).

1. Создайте пустой репозиторий на GitHub и запушьте туда этот проект.
2. В настройках репозитория: **Settings → Pages → Source → GitHub Actions**.
3. При пуше в `main` workflow сам соберёт сайт и опубликует его на
   `https://<username>.github.io/<repo-name>/`.

Базовый путь (`basePath`) подставляется автоматически по имени репозитория —
менять `next.config.ts` не нужно, каким бы ни было имя репозитория.

### Локальная сборка

```bash
npm run build   # статический экспорт в папку out/
npm run start   # если нужен обычный Next.js сервер (без экспорта)
```

## Структура

```
app/(site)/     витрина: главная, каталог — с шапкой/футером/корзиной
app/admin/      админка: /admin/login (без шапки) и /admin/(protected)/* (за логином)
components/     UI-компоненты (components/admin/* — только админка)
lib/            данные, типы, контексты (корзина, каталог, настройки сайта, admin-auth), Supabase-клиент
scripts/seed.ts перенос демо-данных в Supabase (npm run seed)
supabase/       schema.sql — таблицы и RLS-политики
```
