'use client';

import { Reveal } from '@/components/reveal';

export const FeatureSection = ({
  tag,
  title,
  body,
  img,
  alt,
  flip = false,
  gradient = '',
}: {
  tag: string;
  title: string;
  body: string;
  img: string;
  alt: string;
  flip?: boolean;
  gradient?: string;
}) => {
  return (
    <section
      className={`
        snap-start h-screen w-full flex items-center justify-center
        px-6 md:px-16 lg:px-24 overflow-hidden relative
        ${gradient}
      `}
    >
      {/* subtle grain overlay */}
      <div
        className='pointer-events-none absolute inset-0 opacity-[0.025]'
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />

      <div
        className={`
          relative z-10 w-full max-w-5xl mx-auto flex items-center gap-12 lg:gap-20
          ${flip ? 'flex-col-reverse md:flex-row-reverse' : 'flex-col-reverse md:flex-row'}
        `}
      >
        {/* Text */}
        <Reveal className='flex-1 min-w-0'>
          <span className='inline-block bg-black/10 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.12em] uppercase text-black mb-4'>
            {tag}
          </span>
          <h2 className='font-display text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-black mb-5'>
            {title}
          </h2>
          <p className='text-[clamp(15px,1.5vw,18px)] leading-[1.72] text-black/60 max-w-md'>
            {body}
          </p>
        </Reveal>

        {/* Phone image */}
        <Reveal delay={120} className='flex-shrink-0 flex justify-center'>
          <img
            src={img}
            alt={alt}
            className='w-[clamp(180px,22vw,260px)] h-auto rounded-[2.2rem] block'
          />
        </Reveal>
      </div>
    </section>
  );
};
