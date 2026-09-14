import { getDb } from './db'

type FulfillmentPayload = {
  redemptionId: string
  giftCodeLast4: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  photoUrl: string | null
  upgradeKey: string | null
  amountInr: number
  paymentStatus: string
  createdAt: string
}

export async function exportRedemption(redemptionId: string) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET

  if (!webhookUrl || !secret) {
    console.warn('Fulfillment export skipped: Google Sheets webhook is not configured')
    return { ok: false, skipped: true }
  }

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        r.id,
        g.code_last4,
        r.name,
        r.email,
        r.phone,
        r.address,
        r.photo_url,
        o.upgrade_key,
        COALESCE(o.amount_inr, 0) AS amount_inr,
        COALESCE(o.payment_status, 'not_required') AS payment_status,
        r.created_at
      FROM redemptions r
      JOIN gift_codes g ON g.id = r.gift_code_id
      LEFT JOIN LATERAL (
        SELECT upgrade_key, amount_inr, payment_status
        FROM orders
        WHERE redemption_id = r.id
        ORDER BY created_at DESC
        LIMIT 1
      ) o ON true
      WHERE r.id = ${redemptionId}
      LIMIT 1
    `

    if (rows.length === 0) {
      console.error('Fulfillment export skipped: redemption not found', redemptionId)
      return { ok: false, skipped: true }
    }

    const row = rows[0]
    const payload: FulfillmentPayload = {
      redemptionId: String(row.id),
      giftCodeLast4: String(row.code_last4 ?? ''),
      name: row.name ? String(row.name) : null,
      email: row.email ? String(row.email) : null,
      phone: row.phone ? String(row.phone) : null,
      address: row.address ? String(row.address) : null,
      photoUrl: row.photo_url ? String(row.photo_url) : null,
      upgradeKey: row.upgrade_key ? String(row.upgrade_key) : null,
      amountInr: Number(row.amount_inr ?? 0),
      paymentStatus: String(row.payment_status ?? 'not_required'),
      createdAt: new Date(row.created_at).toISOString(),
    }

    const url = new URL(webhookUrl)
    url.searchParams.set('token', secret)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('Fulfillment export failed', response.status, text.slice(0, 300))
      return { ok: false, skipped: false }
    }

    return { ok: true, skipped: false }
  } catch (error) {
    console.error('Fulfillment export request failed', error)
    return { ok: false, skipped: false }
  }
}
