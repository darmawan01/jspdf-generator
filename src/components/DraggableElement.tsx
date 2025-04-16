import React, { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Box, Typography, IconButton, Menu, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { getEmptyImage } from 'react-dnd-html5-backend';

// Grid size in pixels (must match PDFEditor)
const GRID_SIZE = 10;

// Border styles
const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];

// Snap value to grid
const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

interface DraggableElementProps {
  id: string;
  type: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
  onResize: (id: string, width: number, height: number) => void;
  onStyleChange: (id: string, updates: Partial<DraggableElementProps>) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onDelete?: (id: string) => void;
}

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
  onResize,
  onStyleChange,
  onPositionChange,
  onDelete
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentPosition, setCurrentPosition] = useState({ x, y });
  const [isSelected, setIsSelected] = useState(false);
  const lastKnownPosition = useRef({ x, y });

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
      
      // Get element position relative to paper
      const relativeX = e.clientX - paperRect.left;
      const relativeY = e.clientY - paperRect.top;
      
      // Log occasionally for debugging
      if (Math.random() < 0.01) {
        console.log('DRAG - Mouse position:', { clientX: e.clientX, clientY: e.clientY });
        console.log('DRAG - Paper rect:', paperRect);
        console.log('DRAG - Relative position:', { relativeX, relativeY });
      }

      // Snap to grid
      const snappedX = snapToGrid(relativeX);
      const snappedY = snapToGrid(relativeY);

      // Ensure element stays completely within paper boundaries
      const maxX = paperRect.width - width;
      const maxY = paperRect.height - height;
      
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
    if (!isSelected) return;

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
  }, [isSelected, currentPosition, width, height, id, onPositionChange, onDelete]);
  
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

    switch (direction) {
      case 'right':
        newWidth = snapToGrid(event.clientX - rect.left);
        break;
      case 'bottom':
        newHeight = snapToGrid(event.clientY - rect.top);
        break;
      case 'bottomRight':
        newWidth = snapToGrid(event.clientX - rect.left);
        newHeight = snapToGrid(event.clientY - rect.top);
        break;
    }

    // Apply minimum size and enforce paper boundaries
    const minSize = 20; // Minimum element size
    const maxWidth = parentRect.width - currentPosition.x;
    const maxHeight = parentRect.height - currentPosition.y;

    // Ensure element does not extend beyond paper boundaries and maintains minimum size
    newWidth = Math.max(minSize, Math.min(newWidth, maxWidth));
    newHeight = Math.max(minSize, Math.min(newHeight, maxHeight));

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

  drag(elementRef);

  return (
    <Box
      ref={elementRef}
      onClick={handleElementClick}
      sx={{
        position: 'absolute',
        left: currentPosition.x,
        top: currentPosition.y,
        width,
        height,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: `${borderWidth}px ${borderStyle} ${borderColor}`,
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'all 0.1s ease',
        zIndex: isSelected ? 1000 : 1,
        outline: isSelected ? '2px solid #2196F3' : 'none',
      }}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'absolute', 
          top: 0,
          left: 0,
          margin: 0,
          padding: '2px',
          backgroundColor: 'rgba(255,255,255,0.8)',
          fontSize: '10px',
          lineHeight: 1,
          zIndex: 1002,
        }}
      >
        {type} ({Math.round(currentPosition.x)}, {Math.round(currentPosition.y)})
      </Typography>
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        padding: 0,
        margin: 0,
        boxSizing: 'border-box',
      }}>
        {type === 'text' && <Typography>{content}</Typography>}
        {type === 'title' && <Typography variant="h6">{content}</Typography>}
        {type === 'image' && <img src={content} alt="Draggable" style={{ maxWidth: '100%', maxHeight: '100%' }} />}
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            maxWidth: 'none',
            p: 2,
            minWidth: 250,
          }
        }}
        disablePortal
        keepMounted
      >
        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Width</InputLabel>
              <Select
                value={width}
                onChange={(e) => onResize(id, Number(e.target.value), height)}
                label="Width"
              >
                {[100, 150, 200, 250, 300, 350, 400].map(w => (
                  <MenuItem key={w} value={w}>{w}px</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Height</InputLabel>
              <Select
                value={height}
                onChange={(e) => onResize(id, width, Number(e.target.value))}
                label="Height"
              >
                {[50, 75, 100, 150, 200, 250, 300].map(h => (
                  <MenuItem key={h} value={h}>{h}px</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl size="small">
            <InputLabel>Border Style</InputLabel>
            <Select
              value={borderStyle}
              onChange={(e) => onStyleChange(id, { borderStyle: e.target.value })}
              label="Border Style"
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
              onChange={(e) => onStyleChange(id, { borderWidth: Number(e.target.value) })}
              label="Border Width"
            >
              {[1, 2, 3, 4, 5].map(width => (
                <MenuItem key={width} value={width}>{width}px</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption">Border Color</Typography>
            <input
              type="color"
              value={borderColor}
              onChange={(e) => onStyleChange(id, { borderColor: e.target.value })}
              style={{ width: '100%' }}
            />
          </Box>

          <Box>
            <Typography variant="caption">Background Color</Typography>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onStyleChange(id, { backgroundColor: e.target.value })}
              style={{ width: '100%' }}
            />
          </Box>
          
          <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
            Tip: Use arrow keys for pixel-perfect positioning or press Delete to remove
          </Typography>
        </Box>
      </Menu>
    </Box>
  );
};

export default DraggableElement; 