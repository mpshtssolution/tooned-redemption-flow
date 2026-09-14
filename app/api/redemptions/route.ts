import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '../../lib/db'

function hashCode(code: string) {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const normalized = String(body?.code ?? '').trim().toUpperCase()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()

    if (!normalized || normalized.length > 64) {
      return NextResponse.json({ ok: false, reason: 'invalid_code' }, { status: 400 })
    }
    if (name.length < 2 || !email.includes('@')) {
      return NextResponse.json({ ok: false, reason: 'invalid_details' }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql.transaction([
      sql`
        SELECT id, status, redemption_id
        FROM gift_codes
        WHERE code_hash = ${hashCode(normalized)}
        FOR UPDATE
      `,
      sql`
        SELECT 1
        WHERE false
      `,
    ])

    const gift = rows[0][0] as { id: string; status: string; redemption_id: string | null } | undefined
    if (!gift) return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    if (gift.status === 'redeemed') return NextResponse.json({ ok: false, reason: 'already_redeemed' }, { status: 409 })
    if (gift.status === 'void' || gift.status === 'expired') {
      return NextResponse.json({ ok: false, reason: gift.status }, { status: 410 })
    }

    if (gift.status === 'in_progress' && gift.redemption_id) {
      return NextResponse.json({ ok: true, redemptionId: gift.redemption_id, status: 'in_progress' })
    }

    const redemptionRows = await sql`
      INSERT INTO redemptions (gift_code_id, name, email, status)
      VALUES (${gift.id}, ${name}, ${email}, 'started')
      RETURNING id, status
    `

    const redemption = redemptionRows[0]
    await sql`
      UPDATE gift_codes
      SET status = 'in_progress', redemption_id = ${redemption.id}
      WHERE id = ${gift.id}
    `

    return NextResponse.json({ ok: true, redemptionId: redemption.id, status: redemption.status })
  } catch (error) {
    console.error('Redemption start failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
