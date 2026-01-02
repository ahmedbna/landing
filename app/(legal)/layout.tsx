import { PropsWithChildren } from 'react';

export default function LegalLayout({ children }: PropsWithChildren) {
  return (
    <div className='min-h-screen p-16 bg-[#FAD40B] text-black'>
      <img src='/icon.png' alt='orca' className='w-[140px] h-[140px] -mt-9' />
      <h1 className='text-8xl font-bold -mt-9 mb-9'>Orca</h1>

      {children}
    </div>
  );
}
