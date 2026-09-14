import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Your Tooned Portrait is Waiting',
  description: 'Redeem your Tooned gift and create something wonderfully you.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}