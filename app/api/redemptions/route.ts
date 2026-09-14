import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'

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
    const redemptionId = randomUUID()
    const giftHash = hashCode(normalized)

    const results = await sql.transaction([
      sql`
        SELECT id, status, redemption_id
        FROM gift_codes
        WHERE code_hash = ${giftHash}
        FOR UPDATE
      `,
      sql`
        INSERT INTO redemptions (id, gift_code_id, name, email, status)
        SELECT ${redemptionId}, id, ${name}, ${email}, 'started'
        FROM gift_codes
        WHERE code_hash = ${giftHash} AND status = 'active'
        RETURNING id, status
      `,
      sql`
        UPDATE gift_codes
        SET status = 'in_progress', redemption_id = ${redemptionId}
        WHERE code_hash = ${giftHash} AND status = 'active'
        RETURNING id, status, redemption_id
      `,
    ])

    const gift = results[0][0] as { id: string; status: string; redemption_id: string | null } | undefined
    if (!gift) return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    if (gift.status === 'redeemed') return NextResponse.json({ ok: false, reason: 'already_redeemed' }, { status: 409 })
    if (gift.status === 'void' || gift.status === 'expired') {
      return NextResponse.json({ ok: false, reason: gift.status }, { status: 410 })
    }
    if (gift.status === 'in_progress' && gift.redemption_id) {
      return NextResponse.json({ ok: true, redemptionId: gift.redemption_id, status: 'in_progress' })
    }

    return NextResponse.json({ ok: true, redemptionId, status: 'started' })
  } catch (error) {
    console.error('Redemption start failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
