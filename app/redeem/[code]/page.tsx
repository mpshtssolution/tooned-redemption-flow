import { redirect } from 'next/navigation'

export default async function RedeemCode({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  redirect(`/?code=${encodeURIComponent(code)}`)
}
