'use client'

import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen" style={{ background: '#0F0F0F', color: '#D0D0D0' }}>
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: '#FF4500' }}>
              G
            </div>
            <span className="font-bold text-xl" style={{ color: '#FF4500' }}>Guidance PT</span>
          </div>
          <h1 className="text-4xl font-black mb-3" style={{ color: '#FFFFFF', fontFamily: 'sans-serif' }}>Privacy Policy</h1>
          <p style={{ color: '#A0A0A0' }}>Last updated: June 2026</p>
        </div>

        <div className="space-y-10" style={{ color: '#D0D0D0', lineHeight: '1.8', fontFamily: 'sans-serif' }}>

          {/* 1 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>1. Introduction</h2>
            <p>
              Guidance PT ("we", "our", or "us") is a personal training platform that connects personal trainers with their clients. This Privacy Policy explains how we collect, use and protect your personal information when you use our Android app or web dashboard.
            </p>
            <p className="mt-3">
              By using Guidance PT you agree to the collection and use of information as described in this policy.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>Account Information</p>
                <p>Email address and password when you create an account.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>Profile Information</p>
                <p>Display name, role (personal trainer or client), preferred language.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>Workout Data</p>
                <p>Exercises logged, sets, repetitions, weights, workout dates and personal records.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>Training Plans</p>
                <p>Plans assigned by your personal trainer including exercises, sets, reps and PT notes.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>Body Metrics (optional)</p>
                <p>Weight, body measurements and other fitness metrics entered by your personal trainer.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FF4500' }}>App Preferences</p>
                <p>Dark mode and text size preferences stored locally on your device.</p>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>3. How We Use Your Information</h2>
            <ul className="space-y-2 list-none">
              {[
                'To provide and operate the Guidance PT service',
                'To connect clients with their personal trainer',
                'To display training plans and track workout progress',
                'To calculate and display personal records and statistics',
                'To allow personal trainers to monitor client progress',
                'To improve the app based on usage patterns',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span style={{ color: '#FF4500', marginTop: '2px' }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>4. Who Can See Your Data</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FFFFFF' }}>As a Client</p>
                <p>Your personal trainer can see your training plans, logged workouts and body metrics. Other users cannot see your data.</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #333' }}>
                <p className="font-bold mb-1" style={{ color: '#FFFFFF' }}>As a Personal Trainer</p>
                <p>You can only see data from clients who have connected to you using your invite code. You cannot see data from other trainers' clients.</p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>5. Data Storage and Security</h2>
            <p>
              Your data is stored securely using <strong style={{ color: '#FFFFFF' }}>Supabase</strong>, a cloud database provider with enterprise-grade security. We use Row Level Security (RLS) to ensure users can only access their own data.
            </p>
            <p className="mt-3">
              All data is encrypted in transit using HTTPS/TLS. We do not sell your personal data to third parties.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you delete your account, your personal data will be removed from our systems within 30 days.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>7. Your Rights</h2>
            <p className="mb-3">Under GDPR you have the right to:</p>
            <ul className="space-y-2 list-none">
              {[
                'Access the personal data we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your account and data',
                'Object to processing of your data',
                'Data portability — receive your data in a readable format',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span style={{ color: '#FF4500', marginTop: '2px' }}>→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>8. Children's Privacy</h2>
            <p>
              Guidance PT is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify users of significant changes via email or in-app notification. Continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#FFFFFF' }}>10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or want to exercise your rights, contact us at:</p>
            <div className="mt-4 p-4 rounded-xl" style={{ background: '#1A1A1A', border: '1px solid #FF4500' }}>
              <p className="font-bold" style={{ color: '#FFFFFF' }}>Guidance PT</p>
              <p>Email: <a href="mailto:contact@example.com" style={{ color: '#FF4500' }}>contact@example.com</a></p>
              <p>Trondheim, Norway</p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 flex justify-between items-center" style={{ borderTop: '1px solid #333' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>© 2026 Guidance PT. All rights reserved.</p>
          <button onClick={() => router.back()} style={{ color: '#FF4500', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
        </div>
      </div>
    </div>
  )
}