import React, { useState } from 'react';
import { Box, Paper, Typography, Divider, IconButton, Collapse } from '@mui/material';
import { useDrag } from 'react-dnd';
import { ChartData } from 'chart.js';
import { elementTemplates } from '../constants/templates';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { ChartContent } from '../types/chart';

type ToolContent = string | ChartData | ChartContent;

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
  // Group templates by their group property
  const groupedTemplates = Object.values(elementTemplates).reduce((acc, template) => {
    const group = template.group || 'other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(template);
    return acc;
  }, {} as Record<string, typeof elementTemplates[keyof typeof elementTemplates][]>);

  // State to track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const handleGroupToggle = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
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
        fontSize: { xs: '1.1rem', sm: '1.2rem', md: '2rem' },
        fontWeight: 800,
      }}>
        Widgets
      </Typography>

      <Divider sx={{ my: 2 }} />

      {Object.entries(groupedTemplates).map(([group, templates], index) => (
        <React.Fragment key={group}>
          {index > 0 && <Divider sx={{ my: 2 }} />}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f5f5f5' },
                p: 1,
                borderRadius: 1
              }}
              onClick={() => handleGroupToggle(group)}
            >
              <Typography variant="subtitle2" sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
                fontWeight: 500,
                textTransform: 'capitalize'
              }}>
                {group}
              </Typography>
              <IconButton size="small">
                {expandedGroups[group] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expandedGroups[group]}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                {templates.map((template, templateIndex) => (
                  <DraggableTool
                    key={templateIndex}
                    type={template.type}
                    content={template.content}
                    label={template.label}
                    defaultStyles={{
                      fontSize: template.fontSize,
                      fontWeight: template.fontWeight,
                      fontFamily: template.fontFamily
                    }}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
};

export default Toolbar; 