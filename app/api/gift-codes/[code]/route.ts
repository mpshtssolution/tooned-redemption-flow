import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function hashCode(code: string) {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const normalized = code.trim().toUpperCase()

  if (!normalized || normalized.length > 64) {
    return NextResponse.json({ valid: false, reason: 'invalid_code' }, { status: 400 })
  }

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT id, code_last4, status, redemption_id
      FROM gift_codes
      WHERE code_hash = ${hashCode(normalized)}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 404 })
    }

    const gift = rows[0]

    if (gift.status === 'redeemed') {
      return NextResponse.json({ valid: false, reason: 'already_redeemed' }, { status: 409 })
    }

    if (gift.status === 'void' || gift.status === 'expired') {
      return NextResponse.json({ valid: false, reason: gift.status }, { status: 410 })
    }

    return NextResponse.json({
      valid: true,
      status: gift.status,
      codeLast4: gift.code_last4,
      redemptionId: gift.redemption_id,
    })
  } catch (error) {
    console.error('Gift code lookup failed', error)
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 })
  }
}
