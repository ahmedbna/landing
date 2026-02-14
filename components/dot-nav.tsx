'use client';

import { useEffect, useState } from 'react';

export const DotNav = ({ total }: { total: number }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = document.getElementById('scroll-container');
    if (!container) return;

    const sections = container.querySelectorAll('section');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Array.from(sections).indexOf(e.target as HTMLElement);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { root: container, threshold: 0.5 },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (i: number) => {
    const container = document.getElementById('scroll-container');
    const sections = container?.querySelectorAll('section');
    sections?.[i]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className='fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-[10px] hidden md:flex'>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => scrollTo(i)}
          aria-label={`Go to section ${i + 1}`}
          className='w-2 h-2 rounded-full transition-all duration-300 focus:outline-none'
          style={{
            background: i === active ? '#000' : 'rgba(0,0,0,0.25)',
            transform: i === active ? 'scale(1.5)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
};
