import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '../../../../../lib/db'

function hashCode(code: string) {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const redemptionId = String(body?.redemptionId ?? '').trim()
    const code = String(body?.code ?? '').trim().toUpperCase()
    const address = String(body?.address ?? '').trim()
    const phone = String(body?.phone ?? '').trim()
    const photoUrl = String(body?.photoUrl ?? '').trim()

    if (!redemptionId || !code || address.length < 8 || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ ok: false, reason: 'invalid_details' }, { status: 400 })
    }

    const sql = getDb()
    const results = await sql.transaction([
      sql`
        SELECT r.id, r.gift_code_id, g.status AS gift_status
        FROM redemptions r
        JOIN gift_codes g ON g.id = r.gift_code_id
        WHERE r.id = ${redemptionId}
          AND g.code_hash = ${hashCode(code)}
        FOR UPDATE OF r, g
      `,
      sql`
        UPDATE redemptions
        SET address = ${address},
            phone = ${phone},
            photo_url = NULLIF(${photoUrl}, ''),
            status = 'ready_for_fulfillment',
            updated_at = NOW()
        WHERE id = ${redemptionId}
        RETURNING id, status
      `,
      sql`
        UPDATE gift_codes
        SET status = 'redeemed', redeemed_at = NOW()
        WHERE redemption_id = ${redemptionId}
          AND status IN ('in_progress', 'redeemed')
        RETURNING status
      `,
    ])

    const redemption = results[0][0] as { id: string; gift_code_id: string; gift_status: string } | undefined
    if (!redemption) {
      return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    }

    if (redemption.gift_status === 'redeemed') {
      return NextResponse.json({ ok: true, status: 'redeemed', redemptionId })
    }

    return NextResponse.json({ ok: true, status: 'redeemed', redemptionId })
  } catch (error) {
    console.error('Redemption finalization failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
