import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ ok: false, reason: 'missing_id' }, { status: 400 })

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT r.id, r.name, r.email, r.address, r.phone, r.photo_url, r.status, g.status AS gift_status
      FROM redemptions r
      JOIN gift_codes g ON g.id = r.gift_code_id
      WHERE r.id = ${id}
      LIMIT 1
    `
    if (!rows.length) return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    return NextResponse.json({ ok: true, redemption: rows[0] })
  } catch (error) {
    console.error('Redemption status lookup failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
