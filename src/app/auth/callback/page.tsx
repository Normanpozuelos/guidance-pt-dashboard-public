'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/dashboard')
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/login')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0F0F0F', color: '#A0A0A0' }}
    >
      Signing you in...
    </div>
  )
}
