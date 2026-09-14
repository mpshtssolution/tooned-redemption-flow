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

export async function exportFulfillment(payload: FulfillmentPayload) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET

  if (!webhookUrl || !secret) {
    console.warn('Fulfillment export skipped: Google Sheets webhook is not configured')
    return { ok: false, skipped: true }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tooned-Secret': secret,
      },
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
