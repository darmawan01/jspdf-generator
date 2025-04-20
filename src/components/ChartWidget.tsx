import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, ChartConfiguration, registerables } from 'chart.js';
import { ChartContent } from '../types/chart';

ChartJS.register(...registerables);

interface ChartWidgetProps {
  content: ChartContent;
  width: number;
  height: number;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ content, width, height }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Convert our simplified data structure to Chart.js format
      const chartData = {
        labels: content.data[0].x,
        datasets: content.data.map(dataset => ({
          label: dataset.label,
          data: dataset.y,
          backgroundColor: Array.isArray(dataset.color) ? dataset.color : dataset.color,
          borderColor: Array.isArray(dataset.color) ? dataset.color : dataset.color,
          borderWidth: 1
        }))
      };

      const config: ChartConfiguration = {
        type: content.type as 'bar' | 'line' | 'pie' | 'doughnut',
        data: chartData,
        options: {
          ...content.options,
          responsive: true,
          maintainAspectRatio: false
        }
      };

      chartInstance.current = new ChartJS(chartRef.current, config);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [content]);

  return (
    <div style={{ width, height }}>
      <canvas ref={chartRef} />
    </div>
  );
};

export default ChartWidget; 