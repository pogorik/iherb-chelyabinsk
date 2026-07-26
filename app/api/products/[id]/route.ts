import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const { rows } = await pool.query(
    `update products set
       slug = $1, name = $2, brand = $3, price = $4, old_price = $5, age_group = $6,
       purposes = $7, active_components = $8, form = $9, volume = $10, description = $11,
       rating = $12, reviews_count = $13, in_stock = $14, stock_quantity = $15,
       is_hit = $16, accent = $17, image_url = $18, image_urls = $19, updated_at = now()
     where id = $20
     returning *`,
    [
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
      id,
    ]
  );

  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await pool.query("delete from products where id = $1", [id]);
  return NextResponse.json({ ok: true });
}
