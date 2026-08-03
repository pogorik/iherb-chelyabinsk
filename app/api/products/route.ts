import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  const { rows } = await pool.query("select * from products order by name");
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = randomUUID();

  const { rows } = await pool.query(
    `insert into products (
       id, slug, name, brand, price, old_price, age_group, purposes, active_components,
       form, volume, description, rating, reviews_count, in_stock, stock_quantity,
       is_hit, accent, image_url, image_urls, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, now())
     returning *`,
    [
      id,
      body.slug,
      body.name,
      body.brand,
      body.price,
      body.old_price ?? null,
      body.age_group,
      body.purposes ?? [],
      body.active_components ?? [],
      body.form,
      body.volume,
      body.description ?? "",
      body.rating ?? 0,
      body.reviews_count ?? 0,
      body.in_stock,
      body.stock_quantity ?? 0,
      body.is_hit ?? false,
      body.accent ?? "brand",
      body.image_url ?? null,
      body.image_urls ?? [],
    ]
  );

  return NextResponse.json(rows[0], { status: 201 });
}
