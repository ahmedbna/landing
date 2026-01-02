import { LoginForm } from '@/components/login-form';
import Link from 'next/link';

export default function Login() {
  return (
    <div className='bg-[#FAD40B] font-sans'>
      {/* Hero Section */}
      <div className='min-h-screen flex flex-col items-center justify-center px-6 py-12'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Logo */}
          <div className='flex flex-col items-center justify-center mb-8'>
            <img src='/swim.webp' alt='orca' className='w-[300px] h-[160px]' />
            <h1 className='text-5xl md:text-7xl font-bold text-black'>Orca</h1>
          </div>
        </div>

        <LoginForm />

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
    </div>
  );
}
