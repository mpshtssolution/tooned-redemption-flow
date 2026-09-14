import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '../../../../lib/db'

function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = signature.split(',')
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2)
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3))
  if (!timestamp || signatures.length === 0) return false

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return signatures.some((candidate) => {
    const a = Buffer.from(candidate, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    return a.length === b.length && timingSafeEqual(a, b)
  })
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers.get('stripe-signature')
  const payload = await request.text()

  if (!secret || !signature || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ ok: false, reason: 'invalid_signature' }, { status: 400 })
  }

  try {
    const event = JSON.parse(payload)
    if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

    const session = event.data?.object
    const orderId = String(session?.metadata?.order_id ?? '')
    const redemptionId = String(session?.metadata?.redemption_id ?? '')
    const paymentStatus = String(session?.payment_status ?? '')

    if (!orderId || !redemptionId || paymentStatus !== 'paid') {
      return NextResponse.json({ received: true })
    }

    const sql = getDb()
    await sql.transaction([
      sql`
        UPDATE orders
        SET payment_status = 'paid', paid_at = NOW()
        WHERE id = ${orderId}
          AND redemption_id = ${redemptionId}
          AND payment_status <> 'paid'
      `,
      sql`
        UPDATE redemptions
        SET status = 'ready_for_fulfillment', updated_at = NOW()
        WHERE id = ${redemptionId}
      `,
      sql`
        UPDATE gift_codes
        SET status = 'redeemed', redeemed_at = NOW()
        WHERE redemption_id = ${redemptionId}
          AND status = 'in_progress'
      `,
    ])

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
