import { LoginForm } from '@/components/login-form';
import Link from 'next/link';

export default function Login() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', -apple-system, sans-serif; }

        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-14px) rotate(-3deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-20px); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) rotate(3deg); }
          50%      { transform: translateY(-10px) rotate(3deg); }
        }
        .float-a { animation: floatA 5s ease-in-out infinite; }
        .float-b { animation: floatB 6s ease-in-out infinite 0.4s; }
        .float-c { animation: floatC 4.5s ease-in-out infinite 0.9s; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up-1 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.25s both; }
        .fade-up-3 { animation: fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both; }
      `}</style>

      <div
        className='min-h-screen bg-[#FAD40B] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden'
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%), #FAD40B',
        }}
      >
        {/* Decorative rings */}
        <div className='pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]' />
        <div className='pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full border border-black/[0.07]' />
        <div className='pointer-events-none absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full border border-black/[0.05]' />
        <div className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-black/[0.03]' />

        {/* Logo + wordmark */}
        <div className='fade-up-1 flex flex-col items-center mb-8 relative z-10'>
          <img
            src='/icon.png'
            alt='Orca'
            className='w-24 h-24 object-contain'
          />
          <h1 className='font-display text-[clamp(40px,8vw,72px)] font-extrabold text-black leading-[0.95] tracking-[-0.04em] -mt-3'>
            Orca
          </h1>
          <p className='text-black/50 text-sm font-medium mt-1 tracking-wide'>
            The fun way to learn a language
          </p>
        </div>

        {/* Form card */}
        <div className='fade-up-2 relative z-10 w-full max-w-sm'>
          <LoginForm />
        </div>

        {/* Footer */}
        <footer className='fade-up-3 relative z-10 flex items-center gap-6 mt-10'>
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
        </footer>
      </div>
    </>
  );
}
