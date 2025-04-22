import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Slider, ToggleButton, ToggleButtonGroup, FormControlLabel, Switch, Paper, Button, Portal } from '@mui/material';
import { getEmptyImage } from 'react-dnd-html5-backend';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import SettingsIcon from '@mui/icons-material/Settings';
import ColorPicker from './ColorPicker';
import MediaUploader from './MediaUploader';
import { elementTemplates } from '../constants/templates';
import { PDFDimensions, ContentType } from '../types/pdf';
import { Chart as ChartJS, ChartConfiguration, registerables } from 'chart.js';
import 'chart.js/auto';

// Register all chart components
ChartJS.register(...registerables);

// Grid size in pixels (must match PDFEditor)
const GRID_SIZE = 10;

// Border styles
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

// Snap value to grid
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

interface DraggableElementProps {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart' | 'divider' | 'card';
  content: ContentType;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  zIndex: number;
  onResize: (id: string, width: number, height: number) => void;
  onStyleChange: (id: string, updates: Partial<DraggableElementProps>) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onContentChange: (id: string, content: ContentType) => void;
  onDelete?: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  paperDimensions: PDFDimensions;
  displayScale: number;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
  textColor?: string;
}

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS'
];

const FONT_WEIGHTS = [
  'normal',
  'bold',
  'bolder',
  'lighter',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900'
];

interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface ChartContent {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    scales?: {
      y?: {
        beginAtZero?: boolean;
      };
    };
  };
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    scales?: {
      y?: {
        beginAtZero?: boolean;
      };
    };
  };
}

interface ChartRendererProps {
  config: ChartConfig;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create new chart with proper configuration
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      chartInstance.current = new ChartJS(ctx, {
        type: config.type,
        data: {
          labels: config.data.labels,
          datasets: config.data.datasets.map(dataset => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor || 'rgba(54, 162, 235, 0.5)',
            borderColor: dataset.borderColor || 'rgba(54, 162, 235, 1)',
            borderWidth: dataset.borderWidth || 1
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...config.options
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [config]);

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <canvas
        ref={chartRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </Box>
  );
};

interface ChartSettings {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    scales?: {
      y?: {
        beginAtZero?: boolean;
      };
    };
  };
}

const DEFAULT_CHART_DATA: ChartSettings = {
  type: 'bar',
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }
  ],
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
};

// Move chart config logic outside component
const getChartConfig = (content: ContentType, onContentChange: (content: ContentType) => void) => {
  let chartContent: ChartContent;
  if (!content) {
    // Initialize with default data if no content
    chartContent = {
      type: 'bar',
      data: {
        labels: DEFAULT_CHART_DATA.labels,
        datasets: DEFAULT_CHART_DATA.datasets
      },
      options: DEFAULT_CHART_DATA.options
    };
    // Set the initial content
    onContentChange(JSON.stringify(chartContent));
  } else {
    chartContent = typeof content === 'string' 
      ? JSON.parse(content) 
      : content;
  }

  return {
    type: chartContent.type || 'bar',
    data: {
      labels: chartContent.data?.labels || DEFAULT_CHART_DATA.labels,
      datasets: (chartContent.data?.datasets || DEFAULT_CHART_DATA.datasets).map((dataset: ChartDataset) => ({
        label: dataset.label || 'Dataset',
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor || 'rgba(54, 162, 235, 0.2)',
        borderColor: dataset.borderColor || 'rgba(54, 162, 235, 1)',
        borderWidth: dataset.borderWidth || 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...(chartContent.options || {})
    }
  };
};

interface ChartWrapperProps {
  content: ContentType;
  onContentChange: (content: ContentType) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ content, onContentChange }) => {
  // Only re-render when content changes
  const chartConfig = useMemo(() => 
    getChartConfig(content, onContentChange),

    [content] // Only depend on content changes
  );

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ChartRenderer config={chartConfig} />
    </Box>
  );
};

const DraggableElement: React.FC<DraggableElementProps> = ({
  id,
  type,
  content,
  x,
  y,
  width,
  height,
  backgroundColor,
  borderStyle,
  borderColor,
  borderWidth,
  fontSize = 12,
  fontFamily = 'Arial',
  fontWeight = 'normal',
  fontStyle = 'normal',
  textAlign = 'left',
  zIndex,
  onResize,
  onStyleChange,
  onPositionChange,
  onContentChange,
  onDelete,
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  paperDimensions,
  displayScale,
  borderRadius,
  padding,
  shadow,
  textColor
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x, y });
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<ContentType>(content);
  const lastKnownPosition = useRef({ x, y });
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const [chartSettings, setChartSettings] = useState<ChartSettings>(DEFAULT_CHART_DATA);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [initialMenuPosition, setInitialMenuPosition] = useState<{ top: number; left: number } | null>(null);

  // Disable drag when settings are open
  const isSettingsOpen = Boolean(anchorEl);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { id, type, content, x: currentPosition.x, y: currentPosition.y, width, height },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => !isSettingsOpen, // Disable drag when settings are open
    end: (_, monitor) => {
      if (!monitor.didDrop()) {
        setCurrentPosition({ x, y }); // Reset if not dropped
        return;
      }
      
      // Use the last known hover position, which will be consistent with what the user sees
      // during dragging, rather than the drop result which may have different coordinates
      console.log('END DRAG - Last known hover position:', lastKnownPosition.current);
      console.log('END DRAG - Current position before update:', { x, y });
      
      setCurrentPosition(lastKnownPosition.current);
      onPositionChange(id, lastKnownPosition.current.x, lastKnownPosition.current.y);
      
      console.log('END DRAG - Position after update:', lastKnownPosition.current);
    }
  });

  // Use empty image for HTML5 drag preview (we'll render our own preview)
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Update current position when props change
  useEffect(() => {
    setCurrentPosition({ x, y });
    lastKnownPosition.current = { x, y };
  }, [x, y]);

  // Live position update during drag
  useEffect(() => {
    if (!isDragging || !elementRef.current) return;

    const updatePosition = (e: MouseEvent) => {
      const paperElement = elementRef.current?.parentElement;
      if (!paperElement) return;

      const paperRect = paperElement.getBoundingClientRect();
      
      // Get the current zoom level
      const currentZoom = paperRect.width / paperDimensions.width;
      
      // Get element position relative to paper
      const relativeX = e.clientX - paperRect.left;
      const relativeY = e.clientY - paperRect.top;
      
      // Convert to PDF points, accounting for zoom
      const pdfX = Math.round(relativeX / currentZoom);
      const pdfY = Math.round(relativeY / currentZoom);
      
      // Snap to grid if needed (convert grid size to PDF points)
      const gridSizeInPoints = GRID_SIZE / currentZoom;
      const snappedX = snapToGrid(pdfX / gridSizeInPoints) * gridSizeInPoints;
      const snappedY = snapToGrid(pdfY / gridSizeInPoints) * gridSizeInPoints;

      // Ensure element stays completely within paper boundaries
      const maxX = paperDimensions.width - width;
      const maxY = paperDimensions.height - height;
      
      const boundedX = Math.max(0, Math.min(snappedX, maxX));
      const boundedY = Math.max(0, Math.min(snappedY, maxY));

      // Store this position so we can use it when the drag ends
      const newPosition = { x: boundedX, y: boundedY };
      lastKnownPosition.current = newPosition;
      setCurrentPosition(newPosition);
      
      // Update position in parent component to ensure code generation is accurate
      onPositionChange(id, boundedX, boundedY);
    };

    document.addEventListener('mousemove', updatePosition);
    return () => document.removeEventListener('mousemove', updatePosition);
  }, [isDragging, width, height, id, onPositionChange, paperDimensions.width, paperDimensions.height]);

  // Update after drag ends
  useEffect(() => {
    if (isDragging) return; // Skip while dragging
    
    // Ensure position is within bounds
    if (elementRef.current?.parentElement) {
      const paperRect = elementRef.current.parentElement.getBoundingClientRect();
      
      // Ensure element stays completely within paper boundaries
      const maxX = paperRect.width - width;
      const maxY = paperRect.height - height;
      
      const boundedX = Math.max(0, Math.min(x, maxX));
      const boundedY = Math.max(0, Math.min(y, maxY));
      
      if (boundedX !== x || boundedY !== y) {
        setCurrentPosition({ x: boundedX, y: boundedY });
        onPositionChange(id, boundedX, boundedY);
      }
    }
  }, [x, y, width, height, id, isDragging, onPositionChange]);

  // Handle arrow key navigation for pixel-by-pixel movement
  useEffect(() => {
    if (!isSelected || isEditing || isSettingsOpen) return; // Disable keyboard navigation when settings are open

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!elementRef.current?.parentElement) return;
      
      const paperRect = elementRef.current.parentElement.getBoundingClientRect();
      const maxX = paperRect.width - width;
      const maxY = paperRect.height - height;
      
      let newX = currentPosition.x;
      let newY = currentPosition.y;
      
      // Move 1px at a time with arrow keys
      switch (e.key) {
        case 'ArrowLeft':
          newX = Math.max(0, currentPosition.x - 1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          newX = Math.min(maxX, currentPosition.x + 1);
          e.preventDefault();
          break;
        case 'ArrowUp':
          newY = Math.max(0, currentPosition.y - 1);
          e.preventDefault();
          break;
        case 'ArrowDown':
          newY = Math.min(maxY, currentPosition.y + 1);
          e.preventDefault();
          break;
        case 'Delete':
          if (onDelete) {
            onDelete(id);
            e.preventDefault();
          }
          break;
      }
      
      if (newX !== currentPosition.x || newY !== currentPosition.y) {
        const newPosition = { x: newX, y: newY };
        lastKnownPosition.current = newPosition;
        setCurrentPosition(newPosition);
        onPositionChange(id, newX, newY);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, currentPosition, width, height, id, onPositionChange, onDelete]);
  
  // Handle click outside to deselect the element
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStyleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (!anchorEl) {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const menuWidth = Math.min(300, window.innerWidth - 16); // Responsive width
      const menuHeight = 350; // Further reduced to match actual content height
      
      // Calculate available space below and above
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Determine if we should show above or below
      const showAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      
      // Calculate position
      let left = buttonRect.left;
      let top = showAbove 
        ? buttonRect.top - menuHeight - 10
        : buttonRect.bottom + 8;
      
      // Check if menu would go off the right edge
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      
      // Ensure menu stays within viewport
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));
      
      setInitialMenuPosition({ top, left });
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
      setInitialMenuPosition(null);
    }
  };

  // Add click outside handler
  useEffect(() => {
    if (!anchorEl) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !settingsButtonRef.current?.contains(event.target as Node)
      ) {
        setAnchorEl(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anchorEl]);

  const handleStyleChange = (updates: Partial<DraggableElementProps>) => {
    onStyleChange(id, updates);
  };

  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
  };

  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleResize = (event: MouseEvent, direction: string) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const parentRect = elementRef.current.parentElement?.getBoundingClientRect();
    
    if (!parentRect) return;

    // Convert mouse position to PDF points
    const currentZoom = parentRect.width / paperDimensions.width;
    const relativeX = (event.clientX - rect.left) / currentZoom;
    const relativeY = (event.clientY - rect.top) / currentZoom;

    let newWidth = width;
    let newHeight = height;

    // Calculate new dimensions based on cursor position relative to the element
    switch (direction) {
      case 'right':
        newWidth = Math.max(50 / currentZoom, relativeX);
        break;
      case 'bottom':
        // Allow dividers to be resized to a smaller height
        if (type === 'divider') {
          newHeight = Math.max(1 / currentZoom, relativeY);
        } else {
          newHeight = Math.max(30 / currentZoom, relativeY);
        }
        break;
      case 'bottomRight':
        newWidth = Math.max(50 / currentZoom, relativeX);
        if (type === 'divider') {
          newHeight = Math.max(1 / currentZoom, relativeY);
        } else {
          newHeight = Math.max(30 / currentZoom, relativeY);
        }
        break;
    }

    // Ensure element does not extend beyond paper boundaries
    const maxWidth = (paperDimensions.width - currentPosition.x);
    const maxHeight = (paperDimensions.height - currentPosition.y);

    // Apply boundaries
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);

    // Only update if size has changed
    if (newWidth !== width || newHeight !== height) {
      onResize(id, newWidth, newHeight);
    }
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isResizing && resizeDirection) {
        handleResize(event, resizeDirection);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResizing, resizeDirection]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (type === 'text' || type === 'title') {
      e.stopPropagation();
      setIsEditing(true);
    } else if (type === 'image') {
      setShowMediaUploader(true);
    } else if (type === 'chart') {
      setShowMediaUploader(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value;
    setEditContent(newContent);
  };

  const handleContentBlur = () => {
    setIsEditing(false);
    if (typeof editContent === 'string') {
      onContentChange(id, editContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentBlur();
    }
  };

  const selectMenuProps = {
    PaperProps: {
      sx: {
        maxHeight: 300,
        '& .MuiList-root': {
          padding: 0,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',  // Firefox
          msOverflowStyle: 'none',  // IE/Edge
          overflowY: 'scroll'
        }
      }
    },
    anchorOrigin: {
      vertical: 'bottom' as const,
      horizontal: 'left' as const,
    },
    transformOrigin: {
      vertical: 'top' as const,
      horizontal: 'left' as const,
    },
    slotProps: {
      paper: {
        elevation: 3
      }
    }
  };

  const handleAlignChange = (_: React.MouseEvent<HTMLElement>, newAlignment: 'left' | 'center' | 'right' | null) => {
    if (newAlignment !== null) {
      handleStyleChange({ textAlign: newAlignment });
    }
  };

  const handleFontStyleChange = (_: React.MouseEvent<HTMLElement>, newStyle: string | null) => {
    handleStyleChange({ fontStyle: newStyle === 'italic' ? 'italic' : 'normal' });
  };

  const handleMediaComplete = (newContent: string | ChartConfiguration) => {
    setShowMediaUploader(false);
    onContentChange(id, typeof newContent === 'string' ? newContent : JSON.stringify(newContent));
  };

  // Get minimum width from template based on type and content
  const getMinWidth = () => {
    // Find matching template
    const template = Object.values(elementTemplates).find(
      t => t.type === type && t.content === content
    );
    
    let baseWidth = 100; // Default base width
    
    if (template) {
      baseWidth = template.minWidth || baseWidth;
    } else {
      // Default values if no template matches
      switch (type) {
        case 'text':
          baseWidth = 100;
          break;
        case 'title':
          baseWidth = 200;
          break;
        case 'image':
          baseWidth = 100;
          break;
        case 'chart':
          baseWidth = 200;
          break;
        default:
          baseWidth = 100;
      }
    }
    
    return baseWidth;
  };

  // Get height per line from template
  const getHeightPerLine = () => {
    const template = Object.values(elementTemplates).find(
      t => t.type === type && t.content === content
    );
    
    let baseHeight = fontSize * 1.5; // Default line height
    
    if (template) {
      baseHeight = template.heightPerLine || baseHeight;
    }
    
    return baseHeight;
  };

  drag(elementRef);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsSelected(true);
  };

  const handleMouseLeave = () => {
    if (!anchorEl) {
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsSelected(false);
      }, 300); // 300ms delay before hiding
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleChartTypeChange = (newType: 'bar' | 'line' | 'pie' | 'doughnut') => {
    setChartSettings(prev => ({
      ...prev,
      type: newType
    }));
    onContentChange(id, JSON.stringify({
      ...chartSettings,
      type: newType
    }));
  };

  const handleChartDataChange = (index: number, field: string, value: string | number[]) => {
    console.log('Chart data change:', { index, field, value, currentData: chartSettings.datasets[index] });
    
    const newSettings = { ...chartSettings };
    if (field === 'label') {
      newSettings.datasets[index].label = value as string;
    } else if (field === 'data') {
      try {
        // Ensure we have a valid array of numbers
        let dataArray: number[] = [];
        
        if (typeof value === 'string') {
          // Handle comma-separated string input
          dataArray = value
            .split(',')
            .map(num => parseFloat(num.trim()))
            .filter(num => !isNaN(num));
        } else if (Array.isArray(value)) {
          // Handle direct array input
          dataArray = value.filter(num => typeof num === 'number' && !isNaN(num));
        }
        
        // Ensure we have a valid array before updating
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          newSettings.datasets[index].data = dataArray;
        } else {
          console.error('Invalid data array:', dataArray);
          // Keep the existing data if the new data is invalid
          return;
        }
      } catch (error) {
        console.error('Error processing chart data:', error);
        // Keep the existing data if there's an error
        return;
      }
    }
    
    // Update the chart settings and content
    setChartSettings(newSettings);
    onContentChange(id, JSON.stringify(newSettings));
  };

  const handleChartLabelChange = (labels: string[]) => {
    const newSettings = { ...chartSettings, labels };
    setChartSettings(newSettings);
    onContentChange(id, JSON.stringify(newSettings));
  };

  const renderContent = () => {
    if (type === 'text' || type === 'title') {
      if (isEditing && typeof content === 'string') {
        return (
          <TextField
            value={editContent}
            onChange={handleTextChange}
            onBlur={handleContentBlur}
            onKeyDown={handleKeyDown}
            multiline
            fullWidth
            autoFocus
            variant="standard"
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                fontSize: `${fontSize * displayScale}px`,
                fontFamily,
                fontWeight,
                fontStyle,
                textAlign,
                padding: 0,
                lineHeight: 1.2,
                color: textColor || '#000000',
                '&:before, &:after': {
                  display: 'none'
                }
              },
              '& .MuiInputBase-input': {
                padding: 0,
                lineHeight: 1.2,
                textAlign,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: textColor || '#000000'
              }
            }}
          />
        );
      }

      if (typeof content === 'string') {
        return (
          <Typography
            variant={type === 'title' ? 'h5' : 'body1'}
            component="div"
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: `${fontSize * displayScale}px`,
              fontFamily,
              fontWeight,
              fontStyle,
              textAlign,
              color: textColor || '#000000',
              lineHeight: 1.2
            }}
          >
            {content}
          </Typography>
        );
      }
    }

    if (type === 'image' && content) {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            '& img': {
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }
          }}
        >
          <img 
            src={typeof content === 'string' ? content : ''} 
            alt="Uploaded content"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </Box>
      );
    }

    if (type === 'chart') {
      try {
        return (
          <ChartWrapper 
            content={content} 
            onContentChange={(newContent) => onContentChange(id, newContent)} 
          />
        );
      } catch (error) {
        console.error('Error rendering chart:', error);
        return (
          <Typography variant="body2" color="error">
            Error rendering chart
          </Typography>
        );
      }
    }

    if (type === 'card') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColor || 'white',
            borderRadius: borderRadius ? `${borderRadius * displayScale}px` : 0,
            boxShadow: shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
            padding: padding ? `${padding * displayScale}px` : 0,
            border: borderWidth > 0 ? `${borderWidth * displayScale}px ${borderStyle} ${borderColor}` : 'none',
            boxSizing: 'border-box'
          }}
        />
      );
    }

    if (type === 'divider') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: borderColor || '#000000',
            border: 'none'
          }}
        />
      );
    }

    return null;
  };

  return (
    <Box
      ref={elementRef}
      onClick={handleElementClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'absolute',
        left: `${currentPosition.x * displayScale}px`,
        top: `${currentPosition.y * displayScale}px`,
        width: `${width * displayScale}px`,
        minWidth: `${getMinWidth() * displayScale}px`,
        height: `${height * displayScale}px`,
        minHeight: `${getHeightPerLine() * displayScale}px`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: borderWidth > 0 ? `${borderWidth * displayScale}px ${borderStyle} ${borderColor}` : 'none',
        backgroundColor: backgroundColor || 'transparent',
        display: 'flex',
        flexDirection: 'column',
        padding: padding ? `${padding * displayScale}px` : 0,
        margin: 0,
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'all 0.1s ease',
        zIndex: isSelected ? zIndex + 1 : zIndex,
        outline: isSelected ? '2px solid #2196F3' : 'none',
        fontSize: `${fontSize * displayScale}px`,
        transform: 'none',
        borderRadius: borderRadius ? `${borderRadius * displayScale}px` : 0,
        boxShadow: shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
        overflow: 'visible',
        '&:hover': {
          outline: '2px solid #2196F3'
        }
      }}
    >
      {/* Position indicator */}
      {isSelected && (
        <Typography 
          variant="caption" 
          sx={{ 
            position: 'absolute', 
            top: -16,
            left: 0,
            margin: 0,
            padding: '2px',
            backgroundColor: 'rgba(255,255,255,0.8)',
            fontSize: '10px',
            lineHeight: 1,
            zIndex: 1002,
            pointerEvents: 'none'
          }}
        >
          {type} ({Math.round(currentPosition.x)}, {Math.round(currentPosition.y)})
        </Typography>
      )}
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        {renderContent()}
      </Box>

      {isSelected && (
        <>
          {/* Resize handles */}
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              width: 6,
              height: 20,
              backgroundColor: '#1976d2',
              cursor: 'e-resize',
              transform: 'translateY(-50%) translateX(50%)',
              zIndex: 1001,
              borderRadius: '3px',
            }}
            onMouseDown={handleResizeStart('right')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: 20,
              height: 6,
              backgroundColor: '#1976d2',
              cursor: 's-resize',
              transform: 'translateX(-50%) translateY(50%)',
              zIndex: 1001,
              borderRadius: '3px',
            }}
            onMouseDown={handleResizeStart('bottom')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 10,
              height: 10,
              backgroundColor: '#1976d2',
              cursor: 'se-resize',
              transform: 'translate(50%, 50%)',
              zIndex: 1001,
              borderRadius: '50%',
            }}
            onMouseDown={handleResizeStart('bottomRight')}
            onClick={(e) => e.stopPropagation()}
          />
        </>
      )}

      {showMediaUploader && (
        <MediaUploader
          type={type as 'image' | 'chart'}
          onComplete={handleMediaComplete}
          onCancel={() => setShowMediaUploader(false)}
        />
      )}

      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: '-48px',
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: 2,
              borderRadius: 1
            }}
          >
            <IconButton size="small" onClick={() => sendToBack(id)} title="Send to Back">
              <VerticalAlignBottomIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => sendBackward(id)} title="Send Backward">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => bringForward(id)} title="Bring Forward">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => bringToFront(id)} title="Bring to Front">
              <VerticalAlignTopIcon fontSize="small" />
            </IconButton>
            <IconButton 
              ref={settingsButtonRef}
              size="small" 
              onClick={handleStyleClick}
              title="Style Settings"
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
            {onDelete && (
              <IconButton 
                size="small" 
                onClick={() => onDelete(id)} 
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Paper>
        </Box>
      )}

      {Boolean(anchorEl) && initialMenuPosition && (
        <Portal>
          <Paper
            ref={menuRef}
            sx={{
              position: 'fixed',
              top: initialMenuPosition.top,
              left: initialMenuPosition.left,
              width: { 
                xs: 'calc(100vw - 16px)',
                sm: 'auto',
                md: 'auto'
              },
              minWidth: {
                xs: 'calc(100vw - 16px)',
                sm: '280px',
                md: '320px'
              },
              maxWidth: {
                xs: 'calc(100vw - 16px)',
                sm: '350px',
                md: '400px'
              },
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 3,
              p: 2, // Reduced from p: 2
              zIndex: 9999,
              '& .MuiFormControl-root': {
                width: '100%',
                minHeight: 'auto',
                marginBottom: '8px' // Reduced from 12px
              },
              '& .MuiInputBase-root': {
                height: '36px' // Reduced from 40px
              },
              '& .MuiSelect-select': {
                paddingTop: '6px',
                paddingBottom: '6px',
                height: '24px'
              },
              '& .MuiInputLabel-root': {
                transform: 'translate(14px, 6px) scale(1)',
                '&.Mui-focused, &.MuiFormLabel-filled': {
                  transform: 'translate(14px, -9px) scale(0.75)'
                }
              },
              '& .MuiSlider-root': {
                padding: '8px 0',
                marginTop: '4px',
                marginBottom: '4px'
              },
              '& .MuiTypography-caption': {
                fontSize: '0.75rem',
                marginBottom: '2px'
              },
              '& .MuiBox-root': {
                gap: 0.75 // Reduced from 1
              },
              '@media (max-width: 600px)': {
                left: '8px !important',
                right: '8px !important',
                width: 'calc(100vw - 16px) !important'
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5, // Reduced from 2
              '& > *': {
                minHeight: 'unset'
              },
              '& .MuiFormControl-root': {
                marginTop: 0
              },
              '& .MuiInputBase-root': {
                minHeight: 'unset'
              },
              '& .MuiToggleButtonGroup-root': {
                height: '32px' // Reduced from 36px
              },
              '& .MuiToggleButton-root': {
                padding: '4px 8px' // Reduced from 6px 12px
              },
              '& .MuiSlider-root': {
                marginTop: '4px',
                marginBottom: '4px'
              }
            }}>
              {(type === 'text' || type === 'title') && (
                <>
                  <FormControl size="small">
                    <InputLabel>Font Family</InputLabel>
                    <Select
                      value={fontFamily}
                      onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
                      label="Font Family"
                      MenuProps={selectMenuProps}
                    >
                      {FONT_FAMILIES.map(font => (
                        <MenuItem key={font} value={font}>{font}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small">
                    <InputLabel>Font Weight</InputLabel>
                    <Select
                      value={fontWeight}
                      onChange={(e) => handleStyleChange({ fontWeight: e.target.value })}
                      label="Font Weight"
                      MenuProps={selectMenuProps}
                    >
                      {FONT_WEIGHTS.map(weight => (
                        <MenuItem key={weight} value={weight}>{weight}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: 32 }}>
                    <Typography variant="caption" sx={{ minWidth: 70 }}>Text Style</Typography>
                    <ToggleButtonGroup
                      value={fontStyle === 'italic' ? 'italic' : 'normal'}
                      exclusive
                      onChange={handleFontStyleChange}
                      aria-label="text style"
                      size="small"
                    >
                      <ToggleButton value="normal" aria-label="normal text">
                        <TextFieldsIcon />
                      </ToggleButton>
                      <ToggleButton value="italic" aria-label="italic text">
                        <FormatItalicIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: 32 }}>
                    <Typography variant="caption" sx={{ minWidth: 70 }}>Alignment</Typography>
                    <ToggleButtonGroup
                      value={textAlign}
                      exclusive
                      onChange={handleAlignChange}
                      aria-label="text alignment"
                      size="small"
                    >
                      <ToggleButton value="left" aria-label="left aligned">
                        <FormatAlignLeftIcon />
                      </ToggleButton>
                      <ToggleButton value="center" aria-label="center aligned">
                        <FormatAlignCenterIcon />
                      </ToggleButton>
                      <ToggleButton value="right" aria-label="right aligned">
                        <FormatAlignRightIcon />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  <Box sx={{ width: '100%', height: 45 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 0.5
                    }}>
                      <Typography variant="caption">Font Size</Typography>
                      <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right' }}>{fontSize}px</Typography>
                    </Box>
                    <Box sx={{ px: 0.5 }}>
                      <Slider
                        value={fontSize}
                        onChange={(_, value) => handleStyleChange({ fontSize: value as number })}
                        min={8}
                        max={72}
                        step={1}
                        sx={{
                          '& .MuiSlider-thumb': {
                            width: 12,
                            height: 12,
                          },
                          '& .MuiSlider-rail': {
                            opacity: 0.3,
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ width: '100%' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Text Color</Typography>
                    <ColorPicker
                      color={textColor || '#000000'}
                      onChange={(color) => handleStyleChange({ textColor: color })}
                    />
                  </Box>
                </>
              )}

              {(type === 'divider' || type === 'card') && (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption">Border Width</Typography>
                    <Slider
                      value={borderWidth}
                      onChange={(_, value) => handleStyleChange({ borderWidth: value as number })}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="caption">Border Color</Typography>
                    <ColorPicker
                      color={borderColor}
                      onChange={(color) => handleStyleChange({ borderColor: color })}
                    />
                  </Box>

                  <FormControl size="small">
                    <InputLabel>Border Style</InputLabel>
                    <Select
                      value={borderStyle}
                      onChange={(e) => handleStyleChange({ borderStyle: e.target.value })}
                      label="Border Style"
                      MenuProps={selectMenuProps}
                    >
                      {BORDER_STYLES.map(style => (
                        <MenuItem key={style} value={style}>{style}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {type === 'divider' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="caption">Divider Height</Typography>
                      <Slider
                        value={height}
                        onChange={(_, value) => onResize(id, width, value as number)}
                        min={1}
                        max={20}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}

                  {type === 'card' && (
                    <>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption">Background Color</Typography>
                        <ColorPicker
                          color={backgroundColor}
                          onChange={(color) => handleStyleChange({ backgroundColor: color })}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption">Border Radius</Typography>
                        <Slider
                          value={borderRadius || 0}
                          onChange={(_, value) => handleStyleChange({ borderRadius: value as number })}
                          min={0}
                          max={20}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption">Padding</Typography>
                        <Slider
                          value={padding || 0}
                          onChange={(_, value) => handleStyleChange({ padding: value as number })}
                          min={0}
                          max={32}
                          step={4}
                          marks
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={shadow}
                            onChange={(e) => handleStyleChange({ shadow: e.target.checked })}
                          />
                        }
                        label="Shadow"
                      />
                    </>
                  )}
                </>
              )}
              
              {type === 'chart' && (
                <>
                  <FormControl size="small">
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={chartSettings.type}
                      onChange={(e) => handleChartTypeChange(e.target.value as 'bar' | 'line' | 'pie' | 'doughnut')}
                      label="Chart Type"
                    >
                      <MenuItem value="bar">Bar</MenuItem>
                      <MenuItem value="line">Line</MenuItem>
                      <MenuItem value="pie">Pie</MenuItem>
                      <MenuItem value="doughnut">Doughnut</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Labels (comma separated)"
                    value={chartSettings.labels.join(', ')}
                    onChange={(e) => handleChartLabelChange(e.target.value.split(',').map(label => label.trim()))}
                    fullWidth
                  />

                  {chartSettings.datasets.map((dataset, index) => {
                    // Ensure we have valid data before rendering
                    const dataValue = Array.isArray(dataset.data) 
                      ? dataset.data.join(', ') 
                      : typeof dataset.data === 'string'
                        ? dataset.data
                        : '';
                    
                    return (
                      <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption">Dataset {index + 1}</Typography>
                        <TextField
                          size="small"
                          label="Label"
                          value={dataset.label || ''}
                          onChange={(e) => handleChartDataChange(index, 'label', e.target.value)}
                          fullWidth
                        />
                        <TextField
                          size="small"
                          label="Data (comma separated numbers)"
                          value={dataValue}
                          onChange={(e) => handleChartDataChange(index, 'data', e.target.value)}
                          fullWidth
                        />
                      </Box>
                    );
                  })}

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const newSettings = {
                        ...chartSettings,
                        datasets: [
                          ...chartSettings.datasets,
                          {
                            label: `Dataset ${chartSettings.datasets.length + 1}`,
                            data: chartSettings.labels.map(() => 0),
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                          }
                        ]
                      };
                      setChartSettings(newSettings);
                      onContentChange(id, JSON.stringify(newSettings));
                    }}
                  >
                    Add Dataset
                  </Button>
                </>
              )}
              
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                Tip: Use arrow keys for pixel-perfect positioning or press Delete to remove
              </Typography>
            </Box>
          </Paper>
        </Portal>
      )}
    </Box>
  );
};

export default DraggableElement; 