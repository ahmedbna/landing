// components/admin/admin-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Route,
  Users,
  Bug,
  Activity,
  TrendingUp,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthActions } from '@convex-dev/auth/react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users & Sessions', icon: Users },
  { href: '/admin/routes', label: 'Route Analytics', icon: Route },
  { href: '/admin/devices', label: 'Devices & OS', icon: Smartphone },
  { href: '/admin/errors', label: 'Error Logs', icon: Bug },
  { href: '/admin/retention', label: 'Retention', icon: TrendingUp },
  { href: '/admin/realtime', label: 'Real-time', icon: Activity },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  return (
    <aside className='w-56 border-r bg-card flex flex-col shrink-0'>
      {/* Logo */}
      <div className='p-5 border-b'>
        <div className='flex items-center gap-2'>
          <div className='w-8 h-8 rounded-lg bg-[#FAD40B] flex items-center justify-center text-sm font-bold'>
            🐋
          </div>
          <div>
            <p className='text-sm font-bold leading-none'>Orca</p>
            <p className='text-[10px] text-muted-foreground mt-0.5'>
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className='flex-1 p-3 space-y-0.5 overflow-y-auto'>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-[#FAD40B] text-black font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className='p-3 border-t'>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start text-muted-foreground'
          onClick={() => signOut()}
        >
          <LogOut size={14} className='mr-2' />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
