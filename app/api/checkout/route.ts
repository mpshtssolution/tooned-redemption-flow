import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '../../../lib/db'

const upgrades = {
  print: { name: 'Make it big', price: 899 },
  frame: { name: 'Put a frame on it', price: 1499 },
  second: { name: 'Toon someone else', price: 699 },
  rush: { name: 'Skip the queue', price: 299 },
} as const

function hashCode(code: string) {
  return createHash('sha256').update(code.trim().toUpperCase()).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const redemptionId = String(body?.redemptionId ?? '').trim()
    const code = String(body?.code ?? '').trim().toUpperCase()
    const upgradeKey = String(body?.upgradeKey ?? '') as keyof typeof upgrades
    const address = String(body?.address ?? '').trim()
    const phone = String(body?.phone ?? '').trim()
    const photoUrl = String(body?.photoUrl ?? '').trim()

    const upgrade = upgrades[upgradeKey]
    if (!redemptionId || !code || !upgrade || address.length < 8 || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ ok: false, reason: 'invalid_details' }, { status: 400 })
    }

    const secret = process.env.STRIPE_SECRET_KEY
    if (!secret) return NextResponse.json({ ok: false, reason: 'stripe_not_configured' }, { status: 503 })

    const sql = getDb()
    const rows = await sql`
      SELECT r.id, r.name, r.email, g.status AS gift_status
      FROM redemptions r
      JOIN gift_codes g ON g.id = r.gift_code_id
      WHERE r.id = ${redemptionId}
        AND g.code_hash = ${hashCode(code)}
      LIMIT 1
    `
    const redemption = rows[0] as { id: string; name: string; email: string; gift_status: string } | undefined
    if (!redemption) return NextResponse.json({ ok: false, reason: 'not_found' }, { status: 404 })
    if (redemption.gift_status === 'redeemed') return NextResponse.json({ ok: false, reason: 'already_redeemed' }, { status: 409 })

    await sql`
      UPDATE redemptions
      SET address = ${address}, phone = ${phone}, photo_url = NULLIF(${photoUrl}, ''), updated_at = NOW()
      WHERE id = ${redemptionId}
    `

    const orderRows = await sql`
      INSERT INTO orders (redemption_id, upgrade_key, amount_inr, payment_status)
      VALUES (${redemptionId}, ${upgradeKey}, ${upgrade.price}, 'pending')
      RETURNING id
    `
    const orderId = String(orderRows[0].id)

    const origin = new URL(request.url).origin
    const form = new URLSearchParams()
    form.set('mode', 'payment')
    form.set('success_url', `${origin}/?payment=success&redemption_id=${encodeURIComponent(redemptionId)}&session_id={CHECKOUT_SESSION_ID}`)
    form.set('cancel_url', `${origin}/?payment=cancelled&redemption_id=${encodeURIComponent(redemptionId)}`)
    form.set('customer_email', redemption.email)
    form.set('metadata[order_id]', orderId)
    form.set('metadata[redemption_id]', redemptionId)
    form.set('line_items[0][price_data][currency]', 'inr')
    form.set('line_items[0][price_data][unit_amount]', String(upgrade.price * 100))
    form.set('line_items[0][price_data][product_data][name]', `Tooned — ${upgrade.name}`)
    form.set('line_items[0][price_data][product_data][description]', 'Optional upgrade added to your gifted Tooned portrait')
    form.set('line_items[0][quantity]', '1')

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const session = await stripeResponse.json()
    if (!stripeResponse.ok || !session.url) {
      console.error('Stripe checkout creation failed', session)
      return NextResponse.json({ ok: false, reason: 'checkout_failed' }, { status: 502 })
    }

    await sql`
      UPDATE orders
      SET stripe_payment_id = ${session.id}
      WHERE id = ${orderId}
    `

    return NextResponse.json({ ok: true, url: session.url })
  } catch (error) {
    console.error('Checkout creation failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
