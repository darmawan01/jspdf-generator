import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useDrag } from 'react-dnd';
import { ChartData } from 'chart.js';

type ToolContent = string | ChartData;

interface DraggableToolProps {
  type: string;
  content: ToolContent;
  label: string;
}

const DraggableTool: React.FC<DraggableToolProps> = ({ type, content, label }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'tool',
    item: { type, content },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Paper
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      sx={{
        p: 2,
        m: 1,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        '&:hover': { bgcolor: '#f5f5f5' },
        userSelect: 'none'
      }}
    >
      <Typography>{label}</Typography>
    </Paper>
  );
};

const Toolbar: React.FC = () => {
  const chartTemplates: Record<string, ChartData> = {
    bar: {
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'bar',
        data: [1, 2, 3]
      }]
    },
    line: {
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'line',
        data: [1, 2, 3]
      }]
    },
    pie: {
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'pie',
        data: [1, 2, 3]
      }]
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Widgets
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DraggableTool type="text" content="New Text" label="Text Block" />
        <DraggableTool type="title" content="New Title" label="Title" />
        <DraggableTool type="image" content="image-url" label="Image" />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Charts</Typography>
        <DraggableTool type="chart" content={chartTemplates.bar} label="Bar Chart" />
        <DraggableTool type="chart" content={chartTemplates.line} label="Line Chart" />
        <DraggableTool type="chart" content={chartTemplates.pie} label="Pie Chart" />
      </Box>
    </Box>
  );
};

export default Toolbar; 