// app/admin/users/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Smartphone, Tablet, Monitor } from 'lucide-react';

function formatDuration(ms?: number): string {
  if (!ms) return '–';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    ios: 'bg-black text-white',
    android: 'bg-green-500 text-white',
    web: 'bg-blue-500 text-white',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[platform] ?? 'bg-muted text-muted-foreground'}`}
    >
      {platform}
    </span>
  );
}

function DeviceIcon({ type }: { type?: string }) {
  if (type === 'tablet')
    return <Tablet size={14} className='text-muted-foreground' />;
  if (type === 'phone')
    return <Smartphone size={14} className='text-muted-foreground' />;
  return <Monitor size={14} className='text-muted-foreground' />;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const sessions = useQuery(api.analytics.getRecentSessions, { limit: 200 });
  const loading = sessions === undefined;

  const filtered = sessions?.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.userName?.toLowerCase().includes(q) ||
      s.userEmail?.toLowerCase().includes(q) ||
      s.sessionId.toLowerCase().includes(q) ||
      s.platform.toLowerCase().includes(q)
    );
  });

  const activeSessions = sessions?.filter((s) => s.isActive).length ?? 0;
  const uniqueUsers = new Set(
    sessions?.filter((s) => s.userId).map((s) => s.userId),
  ).size;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Users & Sessions</h1>
        <p className='text-muted-foreground text-sm mt-0.5'>
          Recent user sessions and activity
        </p>
      </div>

      <div className='grid grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-muted-foreground'>
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{sessions?.length ?? '–'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-muted-foreground'>
              Unique Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-muted-foreground'>
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-500'>
              {activeSessions}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Session Log</CardTitle>
          <CardDescription>Most recent 200 sessions</CardDescription>
          <div className='relative mt-2'>
            <Search
              size={14}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              placeholder='Search by user, email, session ID, platform…'
              className='pl-8'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='p-6 space-y-3'>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Screens</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>
                      <div>
                        <p className='text-sm font-medium'>
                          {session.userName ?? 'Anonymous'}
                        </p>
                        {session.userEmail && (
                          <p className='text-xs text-muted-foreground'>
                            {session.userEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlatformBadge platform={session.platform} />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-1.5'>
                        <DeviceIcon type={session.deviceType} />
                        <span className='text-xs text-muted-foreground truncate max-w-[100px]'>
                          {session.deviceModel ?? '–'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-sm'>
                      {session.osVersion ?? '–'}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {session.screenCount}
                    </TableCell>
                    <TableCell className='text-sm'>
                      {formatDuration(session.durationMs)}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {timeAgo(session.startedAt)}
                    </TableCell>
                    <TableCell>
                      {session.isActive ? (
                        <Badge className='bg-green-500 text-white hover:bg-green-500'>
                          Live
                        </Badge>
                      ) : (
                        <Badge variant='secondary'>Ended</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
