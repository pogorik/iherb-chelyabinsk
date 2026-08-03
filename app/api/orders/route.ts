import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Публичный маршрут: посетитель оформляет заказ из корзины (без входа в админку).
export async function POST(request: Request) {
  const body = await request.json();

  if (!body.customer_name || !body.customer_phone || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `insert into orders (customer_name, customer_phone, fulfillment, customer_comment, items, total_price)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [
      body.customer_name,
      body.customer_phone,
      body.fulfillment ?? null,
      body.customer_comment ?? null,
      JSON.stringify(body.items),
      body.total_price,
    ]
  );

  return NextResponse.json(rows[0], { status: 201 });
}

// Список заказов — только для админки.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rows } = await pool.query("select * from orders order by created_at desc");
  return NextResponse.json(rows);
}
