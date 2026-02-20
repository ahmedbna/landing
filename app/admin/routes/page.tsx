// app/admin/routes/page.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatMs(ms: number): string {
  if (!ms) return '–';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function cleanRoute(route: string): string {
  return route.replace('/(home)', '').replace('/(modal)', '') || '/';
}

export default function RoutesPage() {
  const [days, setDays] = useState(30);
  const data = useQuery(api.analytics.getRouteAnalytics, { days });
  const loading = data === undefined;

  const chartData = data?.slice(0, 12).map((r) => ({
    ...r,
    route: cleanRoute(r.route).slice(0, 20),
  }));

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Route Analytics</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            Screen usage and time-on-screen
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className='w-36'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7'>Last 7 days</SelectItem>
            <SelectItem value='14'>Last 14 days</SelectItem>
            <SelectItem value='30'>Last 30 days</SelectItem>
            <SelectItem value='60'>Last 60 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bar chart of top routes */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Page Views by Route</CardTitle>
          <CardDescription>Top 12 most visited screens</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-64 w-full' />
          ) : (
            <ResponsiveContainer width='100%' height={260}>
              <BarChart data={chartData} margin={{ bottom: 40 }}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  stroke='hsl(var(--border))'
                />
                <XAxis
                  dataKey='route'
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor='end'
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey='pageViews'
                  name='Page Views'
                  fill='#FAD40B'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='uniqueUsers'
                  name='Unique Users'
                  fill='#4285F4'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>All Routes</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='p-6 space-y-3'>
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className='h-10 w-full' />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead className='text-right'>Page Views</TableHead>
                  <TableHead className='text-right'>Unique Users</TableHead>
                  <TableHead className='text-right'>
                    Avg Time on Screen
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((row) => (
                  <TableRow key={row.route}>
                    <TableCell>
                      <code className='text-xs bg-muted px-1.5 py-0.5 rounded'>
                        {cleanRoute(row.route)}
                      </code>
                    </TableCell>
                    <TableCell className='text-right font-medium'>
                      {row.pageViews}
                    </TableCell>
                    <TableCell className='text-right'>
                      {row.uniqueUsers}
                    </TableCell>
                    <TableCell className='text-right text-muted-foreground'>
                      {formatMs(row.avgDurationMs)}
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
