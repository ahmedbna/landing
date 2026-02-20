// app/admin/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Activity,
  MousePointer,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  ios: '#000000',
  android: '#3DDC84',
  web: '#4285F4',
};

const CHART_COLORS = [
  '#FAD40B',
  '#3DDC84',
  '#4285F4',
  '#FF6B6B',
  '#A855F7',
  '#F97316',
];

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon size={16} className='text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-8 w-24' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
        {sub && <p className='text-xs text-muted-foreground mt-1'>{sub}</p>}
      </CardContent>
    </Card>
  );
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function AdminOverviewPage() {
  const [days, setDays] = useState<number>(30);
  const stats = useQuery(api.analytics.getOverviewStats, { days });
  const loading = stats === undefined;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Analytics Overview</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            Orca app usage insights
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
            <SelectItem value='90'>Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='Unique Users'
          value={stats?.totalUsers ?? 0}
          icon={Users}
          loading={loading}
          sub={`Last ${days} days`}
        />
        <StatCard
          title='Total Sessions'
          value={stats?.totalSessions ?? 0}
          icon={Activity}
          loading={loading}
        />
        <StatCard
          title='Page Views'
          value={stats?.totalPageViews ?? 0}
          icon={MousePointer}
          loading={loading}
        />
        <StatCard
          title='Active Now'
          value={stats?.activeSessionsNow ?? 0}
          icon={Wifi}
          loading={loading}
          sub='Live sessions'
        />
        <StatCard
          title='Avg Session'
          value={stats ? formatMs(stats.avgSessionDurationMs) : '–'}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title='Error Count'
          value={stats?.totalErrors ?? 0}
          icon={AlertTriangle}
          loading={loading}
          sub={`${stats?.errorRate ?? 0}% of events`}
        />
        <StatCard
          title='Error Rate'
          value={`${stats?.errorRate ?? 0}%`}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title='Platforms'
          value={stats?.platformBreakdown.length ?? 0}
          icon={Activity}
          loading={loading}
          sub='Active platforms'
        />
      </div>

      {/* Charts row 1 */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {/* Daily active users line chart */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='text-base'>
              Daily Active Users & Sessions
            </CardTitle>
            <CardDescription>Trends over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-64 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={240}>
                <LineChart data={stats?.dailyData ?? []}>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='hsl(var(--border))'
                  />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => d.slice(5)} // MM-DD
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
                  <Legend />
                  <Line
                    type='monotone'
                    dataKey='activeUsers'
                    name='Active Users'
                    stroke='#FAD40B'
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='sessions'
                    name='Sessions'
                    stroke='#3DDC84'
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type='monotone'
                    dataKey='pageViews'
                    name='Page Views'
                    stroke='#4285F4'
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Platform pie */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Platform Breakdown</CardTitle>
            <CardDescription>Sessions by platform</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-64 w-full' />
            ) : (
              <>
                <ResponsiveContainer width='100%' height={160}>
                  <PieChart>
                    <Pie
                      data={stats?.platformBreakdown ?? []}
                      dataKey='count'
                      nameKey='platform'
                      cx='50%'
                      cy='50%'
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {stats?.platformBreakdown.map((entry) => (
                        <Cell
                          key={entry.platform}
                          fill={PLATFORM_COLORS[entry.platform] ?? '#888'}
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
                <div className='space-y-2 mt-2'>
                  {stats?.platformBreakdown.map((p) => (
                    <div
                      key={p.platform}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className='w-2.5 h-2.5 rounded-full'
                          style={{
                            background: PLATFORM_COLORS[p.platform] ?? '#888',
                          }}
                        />
                        <span className='capitalize'>{p.platform}</span>
                      </div>
                      <Badge variant='secondary'>{p.count}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Top routes bar */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Top Routes</CardTitle>
            <CardDescription>Most visited screens</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-64 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={240}>
                <BarChart
                  data={stats?.topRoutes ?? []}
                  layout='vertical'
                  margin={{ left: 0, right: 16 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    horizontal={false}
                    stroke='hsl(var(--border))'
                  />
                  <XAxis type='number' tick={{ fontSize: 11 }} />
                  <YAxis
                    type='category'
                    dataKey='route'
                    tick={{ fontSize: 10 }}
                    width={120}
                    tickFormatter={(r) =>
                      r.replace('/(home)', '').slice(0, 20) || '/'
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey='count'
                    name='Views'
                    fill='#FAD40B'
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* OS version breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>OS Versions</CardTitle>
            <CardDescription>Top OS versions in use</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className='h-64 w-full' />
            ) : (
              <ResponsiveContainer width='100%' height={240}>
                <BarChart
                  data={stats?.osBreakdown ?? []}
                  layout='vertical'
                  margin={{ left: 0, right: 16 }}
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
                    tick={{ fontSize: 10 }}
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
                  <Bar
                    dataKey='count'
                    name='Sessions'
                    fill='#4285F4'
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
