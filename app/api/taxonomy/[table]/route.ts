import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

// Общий CRUD для простых справочников вида (slug, label): purposes, brands.
const ALLOWED_TABLES = new Set(["purposes", "brands", "active_components"]);

function resolveTable(table: string): string | null {
  return ALLOWED_TABLES.has(table) ? table : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ table: string }> }) {
  const table = resolveTable((await params).table);
  if (!table) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  const { rows } = await pool.query(`select slug, label from ${table} order by label`);
  return NextResponse.json(rows);
}

export async function POST(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = resolveTable((await params).table);
  if (!table) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  const body = await request.json();
  try {
    const { rows } = await pool.query(
      `insert into ${table} (slug, label) values ($1, $2) returning slug, label`,
      [body.slug, body.label]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = resolveTable((await params).table);
  if (!table) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  const body = await request.json();
  const { rows } = await pool.query(
    `update ${table} set label = $1 where slug = $2 returning slug, label`,
    [body.label, body.slug]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ table: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = resolveTable((await params).table);
  if (!table) return NextResponse.json({ error: "Unknown table" }, { status: 400 });

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  await pool.query(`delete from ${table} where slug = $1`, [slug]);
  return NextResponse.json({ ok: true });
}
