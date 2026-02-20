// app/admin/errors/page.tsx
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

type ErrorEntry = {
  id: string;
  sessionId: string;
  userId?: string;
  route?: string;
  errorMessage?: string;
  errorStack?: string;
  platform: string;
  appVersion?: string;
  timestamp: number;
};

function ErrorDetailDialog({ error }: { error: ErrorEntry }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm'>
          <ChevronRight size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-red-500 flex items-center gap-2'>
            <AlertTriangle size={16} />
            Error Detail
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 text-sm'>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <p className='text-muted-foreground text-xs mb-1'>Time</p>
              <p>{new Date(error.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs mb-1'>Platform</p>
              <p className='capitalize'>{error.platform}</p>
            </div>
            <div>
              <p className='text-muted-foreground text-xs mb-1'>Route</p>
              <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                {error.route ?? '–'}
              </code>
            </div>
            <div>
              <p className='text-muted-foreground text-xs mb-1'>App Version</p>
              <p>{error.appVersion ?? '–'}</p>
            </div>
            <div className='col-span-2'>
              <p className='text-muted-foreground text-xs mb-1'>Session ID</p>
              <code className='text-xs bg-muted px-1.5 py-0.5 rounded break-all'>
                {error.sessionId}
              </code>
            </div>
          </div>

          <div>
            <p className='text-muted-foreground text-xs mb-1'>Error Message</p>
            <div className='bg-red-500/10 border border-red-500/20 rounded p-3 text-red-600 dark:text-red-400 font-mono text-xs'>
              {error.errorMessage ?? 'No message'}
            </div>
          </div>

          {error.errorStack && (
            <div>
              <p className='text-muted-foreground text-xs mb-1'>Stack Trace</p>
              <pre className='bg-muted rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all'>
                {error.errorStack}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ErrorsPage() {
  const [days, setDays] = useState(7);
  const errors = useQuery(api.analytics.getErrorLogs, { days, limit: 200 });
  const loading = errors === undefined;

  // Group by message for frequency
  const errorFreq: Record<string, number> = {};
  for (const e of errors ?? []) {
    const key = e.errorMessage ?? 'Unknown error';
    errorFreq[key] = (errorFreq[key] ?? 0) + 1;
  }
  const topErrors = Object.entries(errorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Error Logs</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            Runtime errors and crashes
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className='w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='1'>Last 24h</SelectItem>
            <SelectItem value='3'>Last 3 days</SelectItem>
            <SelectItem value='7'>Last 7 days</SelectItem>
            <SelectItem value='14'>Last 14 days</SelectItem>
            <SelectItem value='30'>Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top error types */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Most Frequent Errors</CardTitle>
          <CardDescription>Top 5 error messages by occurrence</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : topErrors.length === 0 ? (
            <p className='text-muted-foreground text-sm text-center py-8'>
              🎉 No errors in this period!
            </p>
          ) : (
            <div className='space-y-2'>
              {topErrors.map(([msg, count]) => (
                <div
                  key={msg}
                  className='flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10'
                >
                  <p className='text-sm font-mono text-red-600 dark:text-red-400 truncate flex-1 mr-4'>
                    {msg}
                  </p>
                  <Badge variant='destructive'>{count}×</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full error log */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>All Errors</CardTitle>
          <CardDescription>
            {errors?.length ?? 0} errors in the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='p-6 space-y-3'>
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : errors?.length === 0 ? (
            <p className='text-center text-muted-foreground py-12 text-sm'>
              No errors found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className='w-10' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors?.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className='max-w-[280px]'>
                      <p className='text-xs font-mono text-red-500 truncate'>
                        {error.errorMessage ?? 'Unknown error'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                        {(error.route ?? '–').replace('/(home)', '')}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className='capitalize text-sm'>
                        {error.platform}
                      </span>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {error.appVersion ?? '–'}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {timeAgo(error.timestamp)}
                    </TableCell>
                    <TableCell>
                      <ErrorDetailDialog error={error as ErrorEntry} />
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
