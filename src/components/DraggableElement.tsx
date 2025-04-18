import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Slider, Popover, ToggleButton, ToggleButtonGroup, FormControlLabel, Switch, Paper } from '@mui/material';
import { getEmptyImage } from 'react-dnd-html5-backend';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { ChartData } from 'chart.js';
import 'chart.js/auto';
import MediaUploader from './MediaUploader';
import { elementTemplates } from '../constants/templates';
import { PDFDimensions } from '../types/pdf';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import VerticalAlignBottomIcon from '@mui/icons-material/VerticalAlignBottom';
import SettingsIcon from '@mui/icons-material/Settings';

// Grid size in pixels (must match PDFEditor)
const GRID_SIZE = 10;

// Border styles
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

// Snap value to grid
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

interface DraggableElementProps {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart' | 'divider' | 'card';
  content: string;
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
  onContentChange: (id: string, content: string) => void;
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
  const [editContent, setEditContent] = useState(content);
  const lastKnownPosition = useRef({ x, y });
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'element',
    item: { id, type, content, x: currentPosition.x, y: currentPosition.y, width, height },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
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
      
      // Log occasionally for debugging
      if (Math.random() < 0.01) {
        console.log('DRAG - Mouse position:', { clientX: e.clientX, clientY: e.clientY });
        console.log('DRAG - Paper rect:', paperRect);
        console.log('DRAG - Relative position:', { relativeX, relativeY });
        console.log('DRAG - Zoom:', currentZoom);
        console.log('DRAG - PDF position:', { pdfX, pdfY });
      }

      // Snap to grid if needed (convert grid size to PDF points)
      const gridSizeInPoints = GRID_SIZE / currentZoom;
      const snappedX = snapToGrid(pdfX / gridSizeInPoints) * gridSizeInPoints;
      const snappedY = snapToGrid(pdfY / gridSizeInPoints) * gridSizeInPoints;

      // Ensure element stays completely within paper boundaries
      const maxX = paperDimensions.width - width;
      const maxY = paperDimensions.height - height;
      
      const boundedX = Math.max(0, Math.min(snappedX, maxX));
      const boundedY = Math.max(0, Math.min(snappedY, maxY));

      if (Math.random() < 0.01) {
        console.log('DRAG - Final position:', { boundedX, boundedY });
      }

      // Store this position so we can use it when the drag ends
      const newPosition = { x: boundedX, y: boundedY };
      lastKnownPosition.current = newPosition;
      setCurrentPosition(newPosition);
      
      // Update position in parent component to ensure code generation is accurate
      onPositionChange(id, boundedX, boundedY);
    };

    document.addEventListener('mousemove', updatePosition);
    return () => document.removeEventListener('mousemove', updatePosition);
  }, [isDragging, width, height, id, onPositionChange]);

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
    if (!isSelected || isEditing) return;

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
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

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
        newHeight = Math.max(30 / currentZoom, relativeY);
        break;
      case 'bottomRight':
        newWidth = Math.max(50 / currentZoom, relativeX);
        newHeight = Math.max(30 / currentZoom, relativeY);
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
    } else if (type === 'image' || type === 'chart') {
      setShowMediaUploader(true);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditContent(e.target.value);
  };

  const handleContentBlur = () => {
    setIsEditing(false);
    if (editContent !== content) {
      onContentChange(id, editContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(content); // Reset to original content
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

  const handleMediaComplete = (newContent: string | ChartData) => {
    setShowMediaUploader(false);
    onContentChange(id, typeof newContent === 'string' ? newContent : JSON.stringify(newContent));
  };

  // Get minimum width from template based on type and content
  const getMinWidth = () => {
    // Find matching template
    const template = Object.values(elementTemplates).find(
      t => t.type === type && t.content === content
    );
    
    if (template) {
      return template.minWidth;
    }
    
    // Default values if no template matches
    switch (type) {
      case 'text':
        return 100;
      case 'title':
        return 200;
      case 'image':
        return 100;
      case 'chart':
        return 200;
      default:
        return 100;
    }
  };

  // Get height per line from template
  const getHeightPerLine = () => {
    const template = Object.values(elementTemplates).find(
      t => t.type === type && t.content === content
    );
    
    if (template) {
      return template.heightPerLine;
    }
    
    return fontSize * 1.5; // Default line height
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
        border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
        backgroundColor: backgroundColor || 'transparent',
        display: 'flex',
        flexDirection: 'column',
        padding: padding ? `${padding}px` : 0,
        margin: 0,
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'all 0.1s ease',
        zIndex: isSelected ? zIndex + 1 : zIndex,
        outline: isSelected ? '2px solid #2196F3' : 'none',
        fontSize: `${fontSize * displayScale}px`,
        transform: 'none',
        borderRadius: borderRadius ? `${borderRadius}px` : 0,
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
        {type === 'text' && (
          isEditing ? (
            <TextField
              value={editContent}
              onChange={handleContentChange}
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
                  overflowWrap: 'break-word',
                  color: textColor || '#000000'
                }
              }}
            />
          ) : (
            <Box sx={{
              width: '100%',
              textAlign,
              padding: 0,
              margin: 0
            }}>
              <Typography
                sx={{
                  fontSize: `${fontSize * displayScale}px`,
                  fontFamily,
                  fontWeight,
                  fontStyle,
                  padding: 0,
                  margin: 0,
                  lineHeight: 1.2,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  color: textColor || '#000000',
                  display: 'inline-block',
                  maxWidth: '100%'
                }}
              >
                {content}
              </Typography>
            </Box>
          )
        )}
        {type === 'title' && (
          isEditing ? (
            <TextField
              value={editContent}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              onKeyDown={handleKeyDown}
              multiline
              fullWidth
              autoFocus
              variant="standard"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: `${fontSize * displayScale}px`,
                  fontFamily,
                  fontWeight,
                  fontStyle,
                  textAlign,
                  padding: 0,
                  color: textColor || '#000000',
                  '&:before, &:after': {
                    display: 'none'
                  }
                },
                '& .MuiInputBase-input': {
                  padding: 0,
                  lineHeight: 1.5,
                  textAlign,
                  color: textColor || '#000000'
                }
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontSize: `${fontSize * displayScale}px`,
                fontFamily,
                fontWeight,
                fontStyle,
                textAlign,
                width: '100%',
                padding: 0,
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                display: 'block',
                color: textColor || '#000000'
              }}
            >
              {content}
            </Typography>
          )
        )}
        {type === 'divider' && (
          <Box
            sx={{
              width: '100%',
              height: `${height}px`,
              backgroundColor: borderColor || '#000000',
              borderStyle: borderStyle || 'solid',
              borderWidth: `${borderWidth}px`,
              transform: `scaleY(${displayScale})`,
              margin: 'auto'
            }}
          />
        )}
        {type === 'image' && (
          content ? (
            <img 
              src={content} 
              alt="Draggable" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain' 
              }} 
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                borderRadius: 1,
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
              }}
              onClick={() => setShowMediaUploader(true)}
            >
              <Typography>Click to upload image</Typography>
            </Box>
          )
        )}
        {type === 'chart' && (
          content ? (
            <Box sx={{ width: '100%', height: '100%' }}>
              {(() => {
                try {
                  const chartData = JSON.parse(content);
                  const chartProps = {
                    data: chartData,
                    options: {
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'bottom' as const
                        }
                      }
                    }
                  };

                  switch (chartData.datasets[0].type) {
                    case 'line':
                      return <Line {...chartProps} />;
                    case 'bar':
                      return <Bar {...chartProps} />;
                    case 'pie':
                      return <Pie {...chartProps} />;
                    default:
                      return <Bar {...chartProps} />;
                  }
                } catch (error) {
                  console.error('Error rendering chart:', error);
                  return (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed #ccc',
                        borderRadius: 1,
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                      }}
                      onClick={() => setShowMediaUploader(true)}
                    >
                      <Typography>Click to configure chart</Typography>
                    </Box>
                  );
                }
              })()}
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                borderRadius: 1,
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
              }}
              onClick={() => setShowMediaUploader(true)}
            >
              <Typography>Click to configure chart</Typography>
            </Box>
          )
        )}
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
            top: '-48px', // Increased gap
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Paper
            sx={{
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: 2,
              zIndex: zIndex + 2,
              borderRadius: 1,
              transition: 'opacity 0.2s ease',
              opacity: 1,
              '&:hover': {
                opacity: 1
              }
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

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              minWidth: 250,
              maxWidth: 'none',
              overflow: 'visible',
              borderRadius: 1,
              boxShadow: 3,
              zIndex: zIndex + 3,
              position: 'absolute',
              top: 'auto',
              left: 'auto'
            }
          }
        }}
        disablePortal={true}
        keepMounted={false}
      >
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
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

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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

              <Box>
                <Typography variant="caption">Font Size</Typography>
                <Slider
                  value={fontSize}
                  onChange={(_, value) => handleStyleChange({ fontSize: value as number })}
                  min={8}
                  max={72}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption">Text Color</Typography>
                <input
                  type="color"
                  value={textColor || '#000000'}
                  onChange={(e) => handleStyleChange({ textColor: e.target.value })}
                  style={{ width: '100%' }}
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
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => handleStyleChange({ borderColor: e.target.value })}
                  style={{ width: '100%' }}
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
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                      style={{ width: '100%' }}
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
          
          <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
            Tip: Use arrow keys for pixel-perfect positioning or press Delete to remove
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

export default DraggableElement; 