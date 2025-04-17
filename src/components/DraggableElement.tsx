import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, IconButton, FormControl, InputLabel, Select, MenuItem, TextField, Slider, Popover, ToggleButton, ToggleButtonGroup } from '@mui/material';
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

// Grid size in pixels (must match PDFEditor)
const GRID_SIZE = 10;

// Border styles
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

// Snap value to grid
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

interface DraggableElementProps {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart';
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
  onResize: (id: string, width: number, height: number) => void;
  onStyleChange: (id: string, updates: Partial<DraggableElementProps>) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onContentChange: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  paperDimensions: PDFDimensions;
  displayScale: number;
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
  onResize,
  onStyleChange,
  onPositionChange,
  onContentChange,
  onDelete,
  paperDimensions,
  displayScale
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentPosition, setCurrentPosition] = useState({ x, y });
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const lastKnownPosition = useRef({ x, y });
  const [showMediaUploader, setShowMediaUploader] = useState(false);

  const elementRef = useRef<HTMLDivElement>(null);
  const gearButtonRef = useRef<HTMLButtonElement>(null);

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
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.right + window.scrollX - 250 // 250 is the popover width
    });
  };

  const handleClose = () => {
    setPopoverPosition(null);
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

    let newWidth = width;
    let newHeight = height;

    // Calculate new dimensions based on cursor position relative to the element
    switch (direction) {
      case 'right':
        newWidth = Math.max(50, event.clientX - rect.left);
        break;
      case 'bottom':
        newHeight = Math.max(30, event.clientY - rect.top);
        break;
      case 'bottomRight':
        newWidth = Math.max(50, event.clientX - rect.left);
        newHeight = Math.max(30, event.clientY - rect.top);
        break;
    }

    // Ensure element does not extend beyond paper boundaries
    const maxWidth = parentRect.width - currentPosition.x;
    const maxHeight = parentRect.height - currentPosition.y;

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

  return (
    <Box
      ref={elementRef}
      onClick={handleElementClick}
      onDoubleClick={handleDoubleClick}
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
        border: isSelected ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
        backgroundColor: backgroundColor || 'transparent',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'all 0.1s ease',
        zIndex: isSelected ? 1000 : 1,
        outline: isSelected ? '2px solid #2196F3' : 'none',
        fontSize: `${fontSize * displayScale}px`,
        transform: `scale(${1 / displayScale})`,
        transformOrigin: 'top left'
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
            pointerEvents: 'none',
          }}
        >
          {type} ({Math.round(currentPosition.x)}, {Math.round(currentPosition.y)})
        </Typography>
      )}
      <Box sx={{ 
        width: `${width * displayScale}px`, 
        height: `${height * displayScale}px`,
        display: 'flex',
        alignItems: textAlign === 'center' ? 'center' : 'flex-start',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        transform: `scale(${1 / displayScale})`,
        transformOrigin: 'top left'
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
                '& .MuiInputBase-root': {
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  fontWeight,
                  fontStyle,
                  textAlign,
                  padding: 0,
                  lineHeight: 1.2,
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
                  overflowWrap: 'break-word'
                }
              }}
            />
          ) : (
            <Typography
              sx={{
                fontSize: `${fontSize}px`,
                fontFamily,
                fontWeight,
                fontStyle,
                textAlign,
                width: '100%',
                padding: 0,
                margin: 0,
                lineHeight: 1.2,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                display: 'block'
              }}
            >
              {content}
            </Typography>
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
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  fontWeight,
                  fontStyle,
                  textAlign,
                  padding: 0,
                  '&:before, &:after': {
                    display: 'none'
                  }
                },
                '& .MuiInputBase-input': {
                  padding: 0,
                  lineHeight: 1.5,
                  textAlign
                }
              }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontSize: `${fontSize}px`,
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
                display: 'block'
              }}
            >
              {content}
            </Typography>
          )
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
          <IconButton
            ref={gearButtonRef}
            size="small"
            onClick={handleStyleClick}
            sx={{
              position: 'absolute',
              right: -25,
              top: -25,
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            ⚙️
          </IconButton>

          {/* Resize handles */}
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              right: -6,
              top: '50%',
              width: 12,
              height: 12,
              backgroundColor: '#1976d2',
              cursor: 'e-resize',
              borderRadius: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1001,
            }}
            onMouseDown={handleResizeStart('right')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              bottom: -6,
              left: '50%',
              width: 12,
              height: 12,
              backgroundColor: '#1976d2',
              cursor: 's-resize',
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1001,
            }}
            onMouseDown={handleResizeStart('bottom')}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            className="resize-handle"
            style={{
              position: 'absolute',
              right: -6,
              bottom: -6,
              width: 12,
              height: 12,
              backgroundColor: '#1976d2',
              cursor: 'se-resize',
              borderRadius: '50%',
              zIndex: 1001,
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

      <Popover
        open={Boolean(popoverPosition)}
        anchorReference="anchorPosition"
        anchorPosition={popoverPosition ? {
          top: popoverPosition.top,
          left: popoverPosition.left
        } : undefined}
        onClose={handleClose}
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
              overflow: 'visible'
            }
          }
        }}
        container={document.body}
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
            </>
          )}

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

          <FormControl size="small">
            <InputLabel>Border Width</InputLabel>
            <Select
              value={borderWidth}
              onChange={(e) => handleStyleChange({ borderWidth: Number(e.target.value) })}
              label="Border Width"
              MenuProps={selectMenuProps}
            >
              {[1, 2, 3, 4, 5].map(width => (
                <MenuItem key={width} value={width}>{width}px</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption">Border Color</Typography>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => handleStyleChange({ borderColor: e.target.value })}
              style={{ width: '30%' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1}}>
            <Typography variant="caption">Background Color</Typography>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
              style={{ width: '30%' }}
            />
          </Box>
          
          <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
            Tip: Use arrow keys for pixel-perfect positioning or press Delete to remove
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

export default DraggableElement; 