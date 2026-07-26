import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const { rows } = await pool.query("select * from site_settings where id = 1");
  return NextResponse.json(rows[0] ?? null);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { rows } = await pool.query(
    `update site_settings set
       name = $1, tagline = $2, hero_title = $3, hero_subtitle = $4, phone = $5,
       phone_href = $6, whatsapp_number = $7, telegram_username = $8, max_href = $9,
       email = $10, address = $11, working_hours = $12, vk_url = $13, pickup_info = $14
     where id = 1
     returning *`,
    [
      body.name,
      body.tagline,
      body.hero_title,
      body.hero_subtitle,
      body.phone,
      body.phone_href,
      body.whatsapp_number,
      body.telegram_username,
      body.max_href,
      body.email,
      body.address,
      body.working_hours,
      body.vk_url,
      body.pickup_info,
    ]
  );

  return NextResponse.json(rows[0]);
}
