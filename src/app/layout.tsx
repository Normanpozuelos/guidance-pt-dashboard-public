import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/ThemeProvider'
import { LanguageProvider } from '@/lib/LanguageProvider'

export const metadata: Metadata = {
  title: 'Guidance PT',
  description: 'Personal Trainer Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <LanguageProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
