import Link from 'next/link';

export const metadata = {
  title: 'Delete Account',
};

export default function DeletePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', -apple-system, sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .fade-up-2 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
      `}</style>

      <div
        className='min-h-screen bg-[#FAD40B] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden'
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%), #FAD40B',
        }}
      >
        {/* Decorative rings */}
        <div className='pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]' />
        <div className='pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full border border-black/[0.07]' />
        <div className='pointer-events-none absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full border border-black/[0.05]' />

        {/* Logo */}
        <div className='fade-up-1 flex flex-col items-center mb-10 relative z-10'>
          <Link href='/' className='flex flex-col items-center group'>
            <img
              src='/icon.png'
              alt='Orca'
              className='w-20 h-20 object-contain group-hover:scale-105 transition-transform duration-300'
            />
            <h1 className='font-display text-[clamp(32px,6vw,56px)] font-extrabold text-black leading-[0.95] tracking-[-0.04em] -mt-2'>
              Orca
            </h1>
          </Link>
        </div>

        {/* Card */}
        <div className='fade-up-2 relative z-10 w-full max-w-lg'>
          <div
            className='rounded-2xl border border-black/10 bg-white/70 backdrop-blur-md shadow-xl shadow-black/10 p-8'
            style={{
              boxShadow:
                '0 8px 48px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
            }}
          >
            {/* Warning badge */}
            <div className='inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1 mb-5'>
              <span className='w-1.5 h-1.5 rounded-full bg-red-500 inline-block' />
              <span className='text-xs font-bold text-red-600 uppercase tracking-wide'>
                Irreversible action
              </span>
            </div>

            <h2 className='font-display text-3xl font-extrabold text-black tracking-tight mb-2'>
              Delete your account
            </h2>
            <p className='text-black/55 text-sm leading-relaxed mb-6'>
              We're sorry to see you go. Deleting your account will permanently
              erase all your progress, streaks, and data. This cannot be undone.
            </p>

            {/* Steps */}
            <div className='space-y-3 mb-8'>
              {[
                { step: '1', text: 'Open the Orca app on your device' },
                { step: '2', text: 'Go to Profile → Settings' },
                {
                  step: '3',
                  text: 'Scroll to "Danger Zone" and tap Delete Account',
                },
                { step: '4', text: 'Confirm with your password to proceed' },
              ].map(({ step, text }) => (
                <div key={step} className='flex items-start gap-3'>
                  <div className='w-6 h-6 rounded-full bg-black flex items-center justify-center shrink-0 mt-0.5'>
                    <span className='text-[#FAD40B] text-xs font-bold'>
                      {step}
                    </span>
                  </div>
                  <p className='text-sm text-black/70 leading-relaxed'>
                    {text}
                  </p>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className='rounded-xl bg-black/[0.04] border border-black/10 p-4'>
              <p className='text-sm text-black/60 leading-relaxed'>
                Need help?{' '}
                <a
                  href='mailto:support@orca.ahmedbna.com'
                  className='text-black font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity'
                >
                  Contact support
                </a>{' '}
                and we'll process your deletion request within 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='fade-up-3 relative z-10 flex items-center gap-6 mt-8'>
          <Link
            href='/privacy'
            className='text-sm text-black/40 hover:text-black transition-colors duration-200'
          >
            Privacy Policy
          </Link>
          <span className='text-black/20'>·</span>
          <Link
            href='/terms'
            className='text-sm text-black/40 hover:text-black transition-colors duration-200'
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </>
  );
}
