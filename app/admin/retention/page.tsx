// app/admin/retention/page.tsx
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
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

function RetentionGauge({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const data = [{ name: label, value, fill: color }];
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm text-muted-foreground'>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='relative'>
          <ResponsiveContainer width='100%' height={140}>
            <RadialBarChart
              cx='50%'
              cy='50%'
              innerRadius='55%'
              outerRadius='85%'
              startAngle={90}
              endAngle={-270}
              data={[
                { name: 'bg', value: 100, fill: 'hsl(var(--muted))' },
                ...data,
              ]}
            >
              <RadialBar dataKey='value' cornerRadius={6} background={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => {
                  const safeValue = value ?? 0;
                  return [`${safeValue}%`, label];
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className='absolute inset-0 flex items-center justify-center'>
            <p className='text-2xl font-bold' style={{ color }}>
              {value}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RetentionPage() {
  const [days, setDays] = useState(14);
  const data = useQuery(api.analytics.getRetentionData, { days });
  const loading = data === undefined;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Retention</h1>
          <p className='text-muted-foreground text-sm mt-0.5'>
            User return rates over time
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
          </SelectContent>
        </Select>
      </div>

      {/* Cohort summary */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Cohort Summary</CardTitle>
          <CardDescription>
            Users in the last {days} days who returned on subsequent days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className='h-16 w-full' />
          ) : (
            <div className='flex items-center gap-8'>
              <div>
                <p className='text-3xl font-bold'>
                  {data?.totalCohortUsers ?? 0}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Total users in cohort
                </p>
              </div>
              <div className='h-12 w-px bg-border' />
              <div className='text-sm text-muted-foreground'>
                <p>
                  Retention measures how many users came back after their first
                  session.
                </p>
                <p className='mt-1'>
                  <strong>Day 1</strong> = any activity; <strong>Day 2+</strong>{' '}
                  = returned on 2+ separate days.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gauges */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className='h-52' />)
        ) : (
          <>
            <RetentionGauge
              label='Day 1 Retention'
              value={data?.day1Retention ?? 0}
              color='#FAD40B'
            />
            <RetentionGauge
              label='Day 2+ Retention'
              value={data?.day2Retention ?? 0}
              color='#3DDC84'
            />
            <RetentionGauge
              label='Day 7+ Retention'
              value={data?.day7Retention ?? 0}
              color='#4285F4'
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>How to Improve Retention</CardTitle>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground space-y-2'>
          <p>
            📬 <strong>Push notifications</strong> – Already implemented! Streak
            reminders increase Day 7 retention by ~30%.
          </p>
          <p>
            🔥 <strong>Streak gamification</strong> – Your streak system is
            great. Consider 3-day and 7-day milestone rewards.
          </p>
          <p>
            📧 <strong>Re-engagement emails</strong> – Target users inactive for
            3+ days via Resend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
