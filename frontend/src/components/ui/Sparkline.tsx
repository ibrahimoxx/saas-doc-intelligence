"use client";

import { Suspense, lazy } from "react";

import cn from "@/lib/cn";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

interface SparklineChartProps extends SparklineProps {
  points: Array<{ value: number }>;
}

const LazySparklineChart = lazy(async () => {
  const {
    Line,
    LineChart,
    ResponsiveContainer,
  } = await import("recharts");

  function SparklineChart({
    points,
    color = "#6366f1",
    height = 40,
  }: SparklineChartProps) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return { default: SparklineChart };
});

export function Sparkline({
  data,
  color = "#6366f1",
  height = 40,
  className,
}: SparklineProps) {
  const points = data.map((value) => ({ value }));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <Suspense fallback={<div className="h-full w-full" />}>
        <LazySparklineChart
          points={points}
          color={color}
          height={height}
          data={data}
        />
      </Suspense>
    </div>
  );
}
