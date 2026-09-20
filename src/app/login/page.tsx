'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageProvider'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert(t('Check your email to confirm your account!'))
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0F0F0F' }}>

      {/* ── Left — Hero image ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        {/* Image */}
        <img
          src="/coach-hero.png"
          alt="Personal trainer with client"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(15,15,15,0) 60%, rgba(15,15,15,1) 100%), linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)'
          }}
        />

        {/* Logo top left */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
            style={{ background: '#FF4500' }}
          >
            G
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            Guidance <span style={{ color: '#FF4500' }}>PT</span>
          </span>
        </div>

        {/* Bottom quote */}
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <p className="text-white font-black text-4xl leading-tight mb-3">
            STRONGER TODAY.<br />
            <span style={{ color: '#FF4500' }}>BETTER TOMORROW.</span>
          </p>
          <p className="text-white/60 text-base">
            The smartest way to manage your clients,<br />
            track progress and deliver results.
          </p>
        </div>
      </div>

      {/* ── Right — Login form ────────────────────────────────────────────── */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: '#FF4500' }}
            >
              G
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              Guidance <span style={{ color: '#FF4500' }}>PT</span>
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p style={{ color: '#A0A0A0' }}>
              {isSignUp
                ? 'Start managing your clients today'
                : 'Sign in to your PT dashboard'}
            </p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleAuth}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 mb-6"
            style={{ background: '#fff', color: '#1A1A1A' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
              <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px" style={{ background: '#333' }} />
            <span className="text-xs" style={{ color: '#666' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#333' }} />
          </div>

          {/* Error */}
          {error && (
            <div
              className="p-4 rounded-xl mb-6 text-sm"
              style={{ background: '#FF450015', border: '1px solid #FF4500', color: '#FF6B35' }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#A0A0A0' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="pt@example.com"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background:  '#1A1A1A',
                border:      '1px solid #333',
                color:       '#fff',
              }}
              onFocus={e => e.target.style.borderColor = '#FF4500'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>

          {/* Password */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2" style={{ color: '#A0A0A0' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: '#1A1A1A',
                border:     '1px solid #333',
                color:      '#fff',
              }}
              onFocus={e => e.target.style.borderColor = '#FF4500'}
              onBlur={e => e.target.style.borderColor = '#333'}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #FF4500, #FF6B35)' }}
          >
            {loading
              ? 'Loading...'
              : isSignUp ? 'Create Account' : 'Sign In →'}
          </button>

          {/* Toggle */}
          <p className="text-center mt-6 text-sm" style={{ color: '#666' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              className="font-semibold hover:opacity-80 transition-all"
              style={{ color: '#FF4500' }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Footer */}
          <p className="text-center mt-12 text-xs" style={{ color: '#444' }}>
            © 2026 Guidance PT. Built for personal trainers.
          </p>
        </div>
      </div>
    </div>
  )
}
