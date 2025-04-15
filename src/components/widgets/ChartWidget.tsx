import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Chart as ChartJS, ChartData, ChartOptions, ChartType } from 'chart.js';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../PDFEditor';

interface ChartWidgetProps {
  id: string;
  type: ChartType;
  x: number;
  y: number;
  width: number;
  height: number;
  data: ChartData;
  options?: ChartOptions;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ id, type, x, y, width, height, data, options }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<InstanceType<typeof ChartJS> | null>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ELEMENT,
    item: { id, type, x, y },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Set canvas size to match widget dimensions
        chartRef.current.width = width;
        chartRef.current.height = height;

        chartInstance.current = new ChartJS(ctx, {
          type,
          data,
          options: {
            ...options,
            responsive: false,
            maintainAspectRatio: false,
            animation: {
              duration: 0
            },
          },
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [type, data, options, width, height]);

  return (
    <Box
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      sx={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: '1px dashed #ccc',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="caption" sx={{ position: 'absolute', top: 4, left: 4 }}>
        {type} Chart
      </Typography>
      <Box sx={{ width: '100%', height: '100%', padding: 1 }}>
        <canvas ref={chartRef} width={width} height={height} />
      </Box>
    </Box>
  );
};

export default ChartWidget; 