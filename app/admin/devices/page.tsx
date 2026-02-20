// app/admin/devices/page.tsx
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
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = [
  '#FAD40B',
  '#3DDC84',
  '#4285F4',
  '#FF6B6B',
  '#A855F7',
  '#F97316',
  '#06B6D4',
];

export default function DevicesPage() {
  const [days, setDays] = useState(30);
  const stats = useQuery(api.analytics.getOverviewStats, { days });
  const loading = stats === undefined;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Devices & OS</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            Platform distribution and OS versions
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

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Platform pie */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Platform Distribution</CardTitle>
            <CardDescription>
              Sessions split by iOS / Android / Web
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-72 w-full' />
            ) : (
              <>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={stats?.platformBreakdown ?? []}
                      dataKey='count'
                      nameKey='platform'
                      cx='50%'
                      cy='50%'
                      outerRadius={90}
                      paddingAngle={3}
                      label={(props) => {
                        const percent = props.percent ?? 0;
                        const platform =
                          (props.payload as { platform: string })?.platform ??
                          '';

                        return `${platform} ${(percent * 100).toFixed(0)}%`;
                      }}
                    >
                      {stats?.platformBreakdown.map((entry, i) => (
                        <Cell
                          key={entry.platform}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className='grid grid-cols-3 gap-2 mt-2'>
                  {stats?.platformBreakdown.map((p, i) => (
                    <div
                      key={p.platform}
                      className='text-center p-3 rounded-lg bg-muted'
                    >
                      <div
                        className='w-3 h-3 rounded-full mx-auto mb-1'
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <p className='text-sm font-bold'>{p.count}</p>
                      <p className='text-xs text-muted-foreground capitalize'>
                        {p.platform}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* OS versions bar */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>OS Version Breakdown</CardTitle>
            <CardDescription>Most common OS versions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-72 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={stats?.osBreakdown ?? []}
                  layout='vertical'
                  margin={{ left: 0, right: 16, top: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    horizontal={false}
                    stroke='hsl(var(--border))'
                  />
                  <XAxis type='number' tick={{ fontSize: 11 }} />
                  <YAxis
                    type='category'
                    dataKey='os'
                    tick={{ fontSize: 11 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey='count' name='Sessions' radius={[0, 4, 4, 0]}>
                    {stats?.osBreakdown.map((entry, i) => (
                      <Cell key={entry.os} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform trend over time */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Platform Trend</CardTitle>
          <CardDescription>Daily sessions by platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-64 w-full' />
          ) : (
            <p className='text-sm text-muted-foreground text-center py-8'>
              Platform-level daily breakdown requires extended data collection.
              Check back after more sessions are recorded.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
