import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
Chart.register(...registerables);
Chart.register(ChartDataLabels);

interface ChartWidgetProps {
  type: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor?: string[];
      borderColor?: string;
    }[];
  };
  title?: string;
  width?: number;
  height?: number;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ type, data, title, width = 300, height = 200 }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: type !== 'bar',
                position: 'bottom' as const,
              },
              title: {
                display: !!title,
                text: title,
                font: { size: 14 },
                align: 'start' as const,
                padding: { bottom: 20 }
              },
              datalabels: {
                display: type === 'bar',
                anchor: 'end' as const,
                align: 'top' as const,
                offset: 4,
                font: { size: 11 },
                formatter: (value: number) => value.toString()
              }
            },
            scales: type === 'bar' ? {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              },
              x: {
                grid: { display: false }
              }
            } : undefined
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, title]);

  return (
    <Paper sx={{ p: 2, width, height }}>
      <canvas ref={chartRef} width={width} height={height} />
    </Paper>
  );
};

export default ChartWidget; 