import Link from 'next/link';

export default function Home() {
  return (
    <div className='bg-[#FAD40B] font-sans'>
      {/* Hero Section */}
      <div className='min-h-screen flex flex-col items-center justify-center px-6 py-12'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Logo */}
          <div className='flex flex-col items-center justify-center mb-8'>
            <img src='/swim.webp' alt='orca' className='w-[400px] h-[260px]' />
            <h1 className='text-5xl md:text-7xl font-bold text-black tracking-tight'>
              Orca
            </h1>
          </div>

          {/* Tagline */}
          <h2 className='text-3xl md:text-4xl font-bold text-black mb-6'>
            The fun way to learn a new language
          </h2>

          <p className='text-lg md:text-xl text-black/80 mb-12 max-w-2xl mx-auto leading-relaxed'>
            Speak with confidence through bite-sized lessons where you practice
            speaking, listening, and reading. Pronounce real-life phrases and
            compete with other students learning the same language.
          </p>

          {/* Download Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
            <a
              target='_blank'
              href='https://play.google.com/store/apps/details?id=com.ahmedbna.orca'
              className='flex items-center gap-3 transition-all transform hover:scale-102'
            >
              <img src='/google-play.svg' className='h-16' />
            </a>

            <a
              target='_blank'
              href='https://apps.apple.com/app/orca/id6757252035'
              className='flex items-center gap-3 transition-all transform hover:scale-102'
            >
              <img src='/app-store.svg' className='h-16' />
            </a>
          </div>
        </div>

        <div className='flex flex-col items-center justify-center px-6 py-12'>
          {/* Features Grid */}
          <div className='grid md:grid-cols-3 gap-6 mt-16 text-left'>
            <div className='bg-black/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-black/10 transition-all'>
              <div className='text-4xl mb-4'>🎯</div>
              <h3 className='text-xl font-bold text-black mb-3'>
                Native Voices
              </h3>
              <p className='text-black/70'>
                Practice listening and speaking with native human voices.
                Improve your pronunciation in real time.
              </p>
            </div>

            <div className='bg-black/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-black/10 transition-all'>
              <div className='text-4xl mb-4'>💬</div>
              <h3 className='text-xl font-bold text-black mb-3'>
                Real Conversations
              </h3>
              <p className='text-black/70'>
                Build listening skills using phrases you'll actually use in
                everyday conversations.
              </p>
            </div>

            <div className='bg-black/5 backdrop-blur-sm rounded-2xl p-6 hover:bg-black/10 transition-all'>
              <div className='text-4xl mb-4'>🌟</div>
              <h3 className='text-xl font-bold text-black mb-3'>
                Learn Together
              </h3>
              <p className='text-black/70'>
                Meet other students learning the same language. Learning is more
                motivating when you're not alone.
              </p>
            </div>
          </div>

          {/* For All Levels */}
          <div className='mt-16 bg-black/5 backdrop-blur-sm rounded-2xl p-8'>
            <h3 className='text-2xl font-bold text-black mb-4'>
              Designed for All Levels
            </h3>
            <p className='text-black/70 text-lg'>
              Whether you're a beginner or advancing your skills, Orca helps you
              prepare for real conversations while improving your vocabulary,
              pronunciation, and fluency.
            </p>
          </div>
        </div>
      </div>

      <footer className='flex items-center justify-center px-6 py-12'>
        <div className='flex gap-4'>
          <Link href='/privacy' className='hover:underline text-black'>
            Privacy Policy
          </Link>
          <Link href='/terms' className='hover:underline text-black'>
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
