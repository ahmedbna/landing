'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Reveal } from '@/components/reveal';
import { DotNav } from '@/components/dot-nav';
import { FeatureSection } from '@/components/feature-section';

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // tiny delay so the entrance animation fires visibly
    const t = setTimeout(() => setLoaded(true), 60);
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      setScrollY(el.scrollTop ?? 0);
    };
    const container = document.getElementById('scroll-container');
    container?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      container?.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');

        .font-display { font-family: 'Syne', -apple-system, sans-serif; }

        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(-5deg); }
          50%      { transform: translateY(-16px) rotate(-5deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-22px) rotate(0deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) rotate(5deg); }
          50%      { transform: translateY(-12px) rotate(5deg); }
        }
        .float-a { animation: floatA 5s   ease-in-out infinite; }
        .float-b { animation: floatB 6s   ease-in-out infinite 0.4s; }
        .float-c { animation: floatC 4.5s ease-in-out infinite 0.9s; }

        /* scroll-snap dot indicator */
        @keyframes dotPulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* ── Scroll container ── */}
      <div
        id='scroll-container'
        className='h-screen overflow-y-scroll'
        style={{ scrollSnapType: 'y mandatory', scrollBehavior: 'smooth' }}
      >
        <section
          className='snap-start h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#FAD40B]'
          style={{
            background:
              'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 65%), #FAD40B',
          }}
        >
          {/* decorative rings */}
          <div className='pointer-events-none absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full border border-black/[0.05]' />
          <div className='pointer-events-none absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full border border-black/[0.07]' />
          <div className='pointer-events-none absolute -bottom-32 -left-32 w-[440px] h-[440px] rounded-full border border-black/[0.05]' />

          {/* wordmark */}
          <div
            className='relative z-10 text-center mb-8'
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(32px)',
              transition:
                'opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <img
              src='/icon.png'
              alt='Orca'
              className='mt-36 w-64 h-64 object-contain mx-auto mb-1'
            />
            <h1 className='-mt-12 font-display text-[clamp(46px,8.5vw,88px)] font-extrabold text-black leading-[0.95] tracking-[-0.04em] mb-5'>
              The fun way to
              <br />
              learn a language
            </h1>

            {/* Store buttons */}
            <div
              className='flex gap-3 justify-center flex-wrap'
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(16px)',
                transition:
                  'opacity 1s cubic-bezier(0.16,1,0.3,1) 280ms, transform 1s cubic-bezier(0.16,1,0.3,1) 280ms',
              }}
            >
              <a
                href='https://apps.apple.com/app/orca/id6757252035'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform duration-200 hover:scale-105 active:scale-95'
              >
                <img src='/app-store.svg' alt='App Store' className='h-12' />
              </a>
              <a
                href='https://play.google.com/store/apps/details?id=com.ahmedbna.orca'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform duration-200 hover:scale-105 active:scale-95'
              >
                <img
                  src='/google-play.svg'
                  alt='Google Play'
                  className='h-12'
                />
              </a>
            </div>
          </div>

          {/* Three floating phones */}
          <div
            className='relative z-10 flex items-end justify-center gap-4 md:gap-5'
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded
                ? `translateY(${scrollY * -0.07}px)`
                : 'translateY(72px)',
              transition: loaded
                ? 'opacity 1.1s cubic-bezier(0.16,1,0.3,1) 360ms'
                : 'none',
            }}
          >
            <div
              className='float-a mb-5 opacity-75 hidden sm:block'
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.18))' }}
            >
              <img
                src='/screens/lessons.png'
                alt='Lessons'
                className='w-[150px] md:w-[170px] rounded-[1.8rem]'
              />
            </div>
            <div
              className='float-b'
              style={{ filter: 'drop-shadow(0 36px 64px rgba(0,0,0,0.22))' }}
            >
              <img
                src='/screens/home.png'
                alt='Home'
                className='w-[180px] md:w-[210px] rounded-[2rem]'
              />
            </div>
            <div
              className='float-c mb-5 opacity-75 hidden sm:block'
              style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.18))' }}
            >
              <img
                src='/screens/ai-teacher.png'
                alt='AI Teacher'
                className='w-[150px] md:w-[170px] rounded-[1.8rem]'
              />
            </div>
          </div>

          {/* scroll cue */}
          <div
            className='absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1'
            style={{ opacity: loaded ? 0.4 : 0, transition: 'opacity 1s 1.4s' }}
          >
            <span className='text-[9px] font-bold tracking-[0.16em] uppercase text-black'>
              Scroll
            </span>
            <div className='w-px h-9 bg-gradient-to-b from-black to-transparent' />
          </div>
        </section>

        <FeatureSection
          tag='Structured Learning'
          title='A journey built on the CEFR framework'
          body='Progress from A1 beginner to C1 advanced through a carefully crafted curriculum. Every lesson builds on the last — packed with grammar, vocabulary, and real-life sentences.'
          img='/screens/journey.png'
          alt='CEFR Journey'
          flip={false}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='AI-Powered'
          title='Your AI teacher, always available'
          body='Ask any question mid-lesson. Get your pronunciation scored in real time. Infinitely patient, available 24/7, and perfectly tailored to where you are.'
          img='/screens/ai-teacher.png'
          alt='AI Teacher'
          flip={true}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Community'
          title='Discuss every lesson with fellow learners'
          body='Each lesson has its own thread. Post a question, share a breakthrough, reply to others. Learning moves faster when you do it together.'
          img='/screens/discussion.png'
          alt='Discussion'
          flip={false}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Live Rooms'
          title='Study together in live voice rooms'
          body='Join a live audio room with students working on the same lesson. Speak, listen, and motivate each other — the energy of a study group, from anywhere.'
          img='/screens/voice-room.png'
          alt='Voice Rooms'
          flip={true}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Pronunciation Game'
          title='Beat the clock. Master pronunciation.'
          body="Race against the timer to nail phrases as accurately as you can. Addictive, fast, and the best way to drill pronunciation until it's muscle memory."
          img='/screens/game.png'
          alt='Pronunciation Game'
          flip={false}
          gradient='bg-[#FAD40B]'
        />

        <FeatureSection
          tag='Challenges'
          title='Challenge friends. Climb the leaderboard.'
          body='Compete in weekly challenges, meet students learning the same language, and push each other forward. Motivation through friendly competition.'
          img='/screens/challenge.png'
          alt='Challenges'
          flip={true}
          gradient='bg-[#FAD40B]'
        />

        <section
          className='snap-start h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden bg-[#FAD40B]'
          style={{
            background:
              'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,0.55) 0%, transparent 70%), #FAD40B',
          }}
        >
          {/* decorative ring */}
          <div className='pointer-events-none absolute w-[600px] h-[600px] rounded-full border border-black/[0.05]' />
          <div className='pointer-events-none absolute w-[400px] h-[400px] rounded-full border border-black/[0.07]' />

          <Reveal className='relative z-10 text-center max-w-xl'>
            <img
              src='/icon.png'
              alt='Orca'
              className='w-62 object-contain mx-auto mb-2'
            />
            <h2 className='-mt-12 font-display text-[clamp(40px,7vw,80px)] font-extrabold text-black leading-[0.97] tracking-[-0.04em] mb-5'>
              Start speaking
              <br />
              today.
            </h2>
            <p className='text-[clamp(15px,1.7vw,18px)] text-black/55 leading-relaxed mb-10 mx-auto'>
              Free to download. Start your first lesson in minutes.
            </p>
            <div className='flex gap-3 justify-center flex-wrap'>
              <a
                href='https://apps.apple.com/app/orca/id6757252035'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform duration-200 hover:scale-105 active:scale-95'
              >
                <img src='/app-store.svg' alt='App Store' className='h-14' />
              </a>
              <a
                href='https://play.google.com/store/apps/details?id=com.ahmedbna.orca'
                target='_blank'
                rel='noopener noreferrer'
                className='transition-transform duration-200 hover:scale-105 active:scale-95'
              >
                <img
                  src='/google-play.svg'
                  alt='Google Play'
                  className='h-14'
                />
              </a>
            </div>
          </Reveal>

          {/* Footer links */}
          <div className='absolute bottom-8 flex gap-8'>
            <Link
              href='/privacy'
              className='text-sm text-black/40 hover:text-black transition-colors duration-200'
            >
              Privacy Policy
            </Link>
            <Link
              href='/terms'
              className='text-sm text-black/40 hover:text-black transition-colors duration-200'
            >
              Terms of Service
            </Link>
          </div>
        </section>
      </div>

      <DotNav total={8} />
    </>
  );
}
