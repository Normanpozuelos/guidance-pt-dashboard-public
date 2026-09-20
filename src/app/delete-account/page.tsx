// FILE: src/app/delete-account/page.tsx
// Public page — Google Play requires this URL in your Data Safety form.
// No login required to view this page.

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg" style={{ background: 'var(--primary)' }}>
            G
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>Guidance PT</span>
        </div>

        <h1 className="text-3xl font-black mb-2" style={{ color: 'var(--text)' }}>
          Delete Your Account
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          You can request permanent deletion of your Guidance PT account and all associated data at any time.
        </p>

        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--text)' }}>How to request deletion</h2>
          <ol className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>1. Send an email</span> to{' '}
              <a href="mailto:contact@example.com?subject=Delete%20my%20Guidance%20PT%20account"
                 className="underline font-semibold" style={{ color: 'var(--primary)' }}>
                contact@example.com
              </a>{' '}
              with the subject line &quot;Delete my Guidance PT account&quot;.
            </li>
            <li>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>2. Include the email address</span>{' '}
              associated with your account, so we can verify and locate it.
            </li>
            <li>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>3. We will process your request</span>{' '}
              and permanently delete your account and data within 30 days, and confirm by email once complete.
            </li>
          </ol>
        </div>

        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--text)' }}>What gets deleted</h2>
          <ul className="space-y-2 text-sm list-disc pl-5" style={{ color: 'var(--text-secondary)' }}>
            <li>Your profile and login credentials</li>
            <li>All logged workouts and exercise history</li>
            <li>Training plans assigned to you (or, if you are a PT, created by you)</li>
            <li>Body weight and other tracked metrics</li>
            <li>Your connection to any personal trainer or client</li>
          </ul>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,69,0,0.08)', border: '1px solid rgba(255,69,0,0.2)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--primary)' }}>Note:</span>{' '}
            Deletion is permanent and cannot be undone. We do not retain backups of deleted
            personal data beyond what is required for fraud prevention or legal compliance,
            in which case any retained data is anonymized.
          </p>
        </div>

        <p className="mt-10 text-xs" style={{ color: 'var(--text-muted)' }}>
          See also our{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}
