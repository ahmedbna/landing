// app/admin/realtime/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Users, Smartphone, Tablet } from 'lucide-react';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function PlatformBadge({ platform }: { platform: string }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    ios: { bg: 'bg-black', text: 'text-white' },
    android: { bg: 'bg-green-600', text: 'text-white' },
    web: { bg: 'bg-blue-600', text: 'text-white' },
  };
  const { bg, text } = cfg[platform] ?? {
    bg: 'bg-muted',
    text: 'text-foreground',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}
    >
      {platform}
    </span>
  );
}

export default function RealtimePage() {
  // Auto-refreshes via Convex reactivity
  const sessions = useQuery(api.analytics.getRecentSessions, { limit: 500 });
  const overview = useQuery(api.analytics.getOverviewStats, { days: 1 });

  const loading = sessions === undefined;
  const activeSessions = sessions?.filter((s) => s.isActive) ?? [];

  const platformCounts = activeSessions.reduce<Record<string, number>>(
    (acc, s) => {
      acc[s.platform] = (acc[s.platform] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold flex items-center gap-2'>
          <span className='w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block' />
          Real-time
        </h1>
        <p className='text-muted-foreground text-sm mt-0.5'>
          Live activity — auto-updates via Convex
        </p>
      </div>

      {/* Live stats */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-muted-foreground flex items-center gap-2'>
              <Activity size={14} className='text-green-500' />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-3xl font-bold text-green-500'>
                {activeSessions.length}
              </div>
            )}
          </CardContent>
        </Card>

        {Object.entries(platformCounts).map(([platform, count]) => (
          <Card key={platform}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm text-muted-foreground capitalize'>
                {platform}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold'>{count}</div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-muted-foreground flex items-center gap-2'>
              <Users size={14} />
              Today's Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-8 w-16' />
            ) : (
              <div className='text-3xl font-bold'>
                {overview?.totalUsers ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active session cards */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Active Sessions</CardTitle>
          <CardDescription>
            {activeSessions.length} users currently in the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className='h-28' />
              ))}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <Activity size={40} className='mx-auto mb-3 opacity-20' />
              <p className='text-sm'>No active sessions right now</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {activeSessions.map((s) => (
                <div
                  key={s._id}
                  className='border rounded-lg p-3 space-y-2 bg-card hover:bg-muted/50 transition-colors'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
                      <p className='text-sm font-medium truncate max-w-[120px]'>
                        {s.userName ?? 'Anonymous'}
                      </p>
                    </div>
                    <PlatformBadge platform={s.platform} />
                  </div>

                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    {s.deviceType === 'tablet' ? (
                      <Tablet size={12} />
                    ) : (
                      <Smartphone size={12} />
                    )}
                    <span>{s.deviceModel ?? 'Unknown device'}</span>
                  </div>

                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span>OS {s.osVersion ?? '–'}</span>
                    <span>{s.screenCount} screens</span>
                  </div>

                  <p className='text-xs text-muted-foreground'>
                    Started {timeAgo(s.startedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
