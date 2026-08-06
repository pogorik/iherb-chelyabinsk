import { pool } from "@/lib/db";
import { buildVkYml, type ProductRow } from "@/lib/vk-yml";

// YML-фид для импорта товаров в VK Market (отдаётся по /api/vk-feed). VK
// опрашивает его по расписанию, поэтому он всегда собирается из живой базы —
// цены и наличие актуальны. Путь без ".yml": точка в сегменте маршрута в
// Next 16 трактуется как расширение файла, и route handler не матчится.
// Route handler'ы в Next 16 по умолчанию не кэшируются; фиксируем это явно.
export const dynamic = "force-dynamic";

export async function GET() {
  const { rows } = await pool.query<ProductRow>(
    `select id, slug, name, brand, price, old_price, purposes,
            form, volume, description, in_stock, image_url, image_urls
       from products
      order by name`,
  );

  const yml = buildVkYml(rows);

  return new Response(yml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Отдаём VK кэш на 30 минут, чтобы частый опрос не бил по базе.
      "Cache-Control": "public, max-age=1800",
    },
  });
}
