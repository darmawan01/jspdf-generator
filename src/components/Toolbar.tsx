import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import { useDrag } from 'react-dnd';
import { ChartData } from 'chart.js';

type ToolContent = string | ChartData;

interface TypographyTemplate {
  type: string;
  content: string;
  label: string;
  defaultStyles: {
    fontSize: number;
    fontWeight: string;
    fontFamily: string;
  };
}

const typographyTemplates: TypographyTemplate[] = [
  {
    type: 'text',
    content: 'Main Title',
    label: 'Title (H1)',
    defaultStyles: {
      fontSize: 32,
      fontWeight: 'bold',
      fontFamily: 'Arial'
    }
  },
  {
    type: 'text',
    content: 'Subtitle',
    label: 'Subtitle (H2)',
    defaultStyles: {
      fontSize: 24,
      fontWeight: '600',
      fontFamily: 'Arial'
    }
  },
  {
    type: 'text',
    content: 'Section Heading',
    label: 'Heading (H3)',
    defaultStyles: {
      fontSize: 20,
      fontWeight: '500',
      fontFamily: 'Arial'
    }
  },
  {
    type: 'text',
    content: 'Body Text',
    label: 'Body',
    defaultStyles: {
      fontSize: 16,
      fontWeight: 'normal',
      fontFamily: 'Arial'
    }
  },
  {
    type: 'text',
    content: 'Caption Text',
    label: 'Caption',
    defaultStyles: {
      fontSize: 12,
      fontWeight: 'normal',
      fontFamily: 'Arial'
    }
  }
];

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
      textAlign: 'left'  // Default text alignment
    },
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
      <Typography 
        sx={{ 
          fontSize: defaultStyles?.fontSize ? `${defaultStyles.fontSize}px` : 'inherit',
          fontWeight: defaultStyles?.fontWeight || 'inherit',
          fontFamily: defaultStyles?.fontFamily || 'inherit',
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
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Widgets
      </Typography>

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Typography</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {typographyTemplates.map((template, index) => (
          <DraggableTool
            key={index}
            type={template.type}
            content={template.content}
            label={template.label}
            defaultStyles={template.defaultStyles}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Media</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DraggableTool type="image" content="image-url" label="Image" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Charts</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DraggableTool type="chart" content={chartTemplates.bar} label="Bar Chart" />
        <DraggableTool type="chart" content={chartTemplates.line} label="Line Chart" />
        <DraggableTool type="chart" content={chartTemplates.pie} label="Pie Chart" />
      </Box>
    </Box>
  );
};

export default Toolbar; 