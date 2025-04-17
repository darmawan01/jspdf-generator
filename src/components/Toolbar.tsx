import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { useDrag } from 'react-dnd';
import { ChartData } from 'chart.js';
import { elementTemplates } from '../constants/templates';

type ToolContent = string | ChartData;

interface DraggableToolProps {
  type: string;
  content: ToolContent;
  label: string;
  defaultStyles?: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    fontStyle?: string;
  };
}

const DraggableTool: React.FC<DraggableToolProps> = ({ type, content, label, defaultStyles }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'tool',
    item: { 
      type, 
      content,
      fontSize: defaultStyles?.fontSize,
      fontFamily: defaultStyles?.fontFamily,
      fontWeight: defaultStyles?.fontWeight,
      fontStyle: defaultStyles?.fontStyle,
      textAlign: 'left'
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <Paper
      ref={drag as unknown as React.RefObject<HTMLDivElement>}
      sx={{
        p: { xs: 1, sm: 1.5, md: 2 },
        m: 0.5,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        '&:hover': { bgcolor: '#f5f5f5' },
        userSelect: 'none',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <Typography 
        sx={{ 
          fontSize: defaultStyles?.fontSize ? `${defaultStyles.fontSize}px` : { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
          fontWeight: defaultStyles?.fontWeight || 'inherit',
          fontFamily: defaultStyles?.fontFamily || 'inherit',
          wordBreak: 'break-word'
        }}
      >
        {label}
      </Typography>
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
    <Box sx={{ 
      p: { xs: 1, sm: 1.5, md: 2 }, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 1,
      height: '100%',
      overflowY: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#888',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: '#555',
      }
    }}>
      <Typography variant="h6" sx={{ 
        mb: 1, 
        fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' },
        fontWeight: 500
      }}>
        Widgets
      </Typography>

      <Typography variant="subtitle2" sx={{ 
        mt: 2, 
        mb: 1, 
        fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
        fontWeight: 500
      }}>
        Typography
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Object.values(elementTemplates).map((template, index) => (
          <DraggableTool
            key={index}
            type={template.type}
            content={template.label}
            label={template.label}
            defaultStyles={{
              fontSize: template.fontSize,
              fontWeight: template.fontWeight,
              fontFamily: template.fontFamily
            }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ 
        mb: 1, 
        fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
        fontWeight: 500
      }}>
        Media
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DraggableTool type="image" content="image-url" label="Image" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ 
        mb: 1, 
        fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
        fontWeight: 500
      }}>
        Charts
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DraggableTool type="chart" content={chartTemplates.bar} label="Bar Chart" />
        <DraggableTool type="chart" content={chartTemplates.line} label="Line Chart" />
        <DraggableTool type="chart" content={chartTemplates.pie} label="Pie Chart" />
      </Box>
    </Box>
  );
};

export default Toolbar; 