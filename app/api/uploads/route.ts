import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, reason: 'missing_file' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, reason: 'invalid_type' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, reason: 'file_too_large' }, { status: 413 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
    const blob = await put(`redemptions/${crypto.randomUUID()}-${safeName}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({ ok: true, url: blob.url })
  } catch (error) {
    console.error('Photo upload failed', error)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
