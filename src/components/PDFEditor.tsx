import React, { useRef, useEffect, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel, TextareaAutosize } from '@mui/material';
import { usePDFContext } from '../context/PDFContext';
import DraggableElement from './DraggableElement';

// Grid configuration
const CELLS_X = 60; // For A4 width (595 points)
const CELLS_Y = 84; // For A4 height (842 points)

// Paper sizes in points (1/72 inch)
const PAPER_SIZES = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
} as const;

// PDF dimensions in points (1/72 inch)
const PDF_WIDTH = 595;  // A4 width in points
const PDF_HEIGHT = 842; // A4 height in points
const Y_OFFSET = 7;    // Offset for Y coordinate adjustment

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DropResult {
  x: number;
  y: number;
}

export const ItemTypes = {
  ELEMENT: 'element',
  TOOL: 'tool',
} as const;

// Convert between PDF and viewer coordinates
const convertToPDFCoordinates = (viewerX: number, viewerY: number, pageHeight: number): { x: number, y: number } => {
  return {
    x: viewerX,
    y: pageHeight - viewerY // Flip Y coordinate
  };
};

const convertToViewerCoordinates = (pdfX: number, pdfY: number, pageHeight: number): { x: number, y: number } => {
  return {
    x: pdfX,
    y: pageHeight - pdfY // Flip Y coordinate back
  };
};

// Get precise mouse position relative to page
const getMousePositionInPage = (e: MouseEvent, paperElement: HTMLElement): { x: number, y: number } => {
  const paperRect = paperElement.getBoundingClientRect();
  const scrollElement = paperElement.parentElement;
  const scrollLeft = scrollElement?.scrollLeft || 0;
  const scrollTop = scrollElement?.scrollTop || 0;

  return {
    x: e.pageX + scrollLeft - paperRect.left,
    y: e.pageY + scrollTop - paperRect.top
  };
};

const PDFEditor: React.FC = () => {
  const {
    elements,
    paperSize,
    orientation,
    generatedCode,
    addElement,
    moveElement,
    resizeElement,
    updateElementStyle,
    setPaperSize,
    setOrientation,
  } = usePDFContext();

  const paperRef = useRef<HTMLDivElement>(null);
  const paperContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paperDimensions = (() => {
    const dimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];
    return orientation === 'landscape'
      ? { width: dimensions.height, height: dimensions.width }
      : { width: dimensions.width, height: dimensions.height };
  })();

  // Calculate grid cells
  const grid = useMemo(() => {
    const cellWidth = paperDimensions.width / CELLS_X;
    const cellHeight = paperDimensions.height / CELLS_Y;
    const cells: GridCell[][] = [];

    for (let y = 0; y < CELLS_Y; y++) {
      cells[y] = [];
      for (let x = 0; x < CELLS_X; x++) {
        cells[y][x] = {
          x: x * cellWidth,
          y: y * cellHeight,
          width: cellWidth,
          height: cellHeight
        };
      }
    }
    return cells;
  }, [paperDimensions]);

  // Find nearest grid cell
  const findNearestCell = (clientX: number, clientY: number): GridCell | null => {
    if (!paperRef.current) return null;

    const paperRect = paperRef.current.getBoundingClientRect();
    
    // Get relative position within the paper
    const relativeX = clientX - paperRect.left;
    const relativeY = clientY - paperRect.top;

    // Convert to cell coordinates
    const cellX = Math.floor((relativeX / paperRect.width) * CELLS_X);
    const cellY = Math.floor((relativeY / paperRect.height) * CELLS_Y);

    // Ensure within bounds
    if (cellX >= 0 && cellX < CELLS_X && cellY >= 0 && cellY < CELLS_Y) {
      return grid[cellY][cellX];
    }
    return null;
  };

  // Draw grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = paperDimensions.width;
    canvas.height = paperDimensions.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cell borders
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    grid.forEach(row => {
      row.forEach(cell => {
        ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
      });
    });

    // Draw major grid lines
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 1;

    for (let x = 0; x <= CELLS_X; x += 5) {
      const xPos = (x * paperDimensions.width) / CELLS_X;
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, paperDimensions.height);
      ctx.stroke();
    }

    for (let y = 0; y <= CELLS_Y; y += 5) {
      const yPos = (y * paperDimensions.height) / CELLS_Y;
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(paperDimensions.width, yPos);
      ctx.stroke();
    }
  }, [grid, paperDimensions]);

  const [, drop] = useDrop({
    accept: ['tool', 'element'],
    drop: (item: { id?: string; type: string; content: string; x?: number; y?: number }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !paperRef.current) return;

      const paperRect = paperRef.current.getBoundingClientRect();
      const x = clientOffset.x - paperRect.left;
      const y = clientOffset.y - paperRect.top;

      // Ensure within bounds
      const boundedX = Math.max(0, Math.min(x, paperDimensions.width));
      const boundedY = Math.max(0, Math.min(y, paperDimensions.height));

      if (!item.id) {
        addElement(item.type, item.content, boundedX, boundedY);
      }

      return { x: boundedX, y: boundedY };
    },
    hover: (item: { id?: string; type: string; content: string }, monitor) => {
      if (!item.id || !paperRef.current) return;

      const dragPreview = monitor.getSourceClientOffset();
      if (!dragPreview) return;

      const paperRect = paperRef.current.getBoundingClientRect();
      const containerWidth = paperRect.width;
      const containerHeight = paperRect.height;

      // Get position relative to container
      const htmlX = dragPreview.x - paperRect.left;
      const htmlY = dragPreview.y - paperRect.top;

      // Convert HTML coordinates to PDF coordinates
      const pdfX = (htmlX * PDF_WIDTH) / containerWidth;
      // Flip Y coordinate for PDF space (PDF has 0,0 at bottom-left)
      const pdfY = PDF_HEIGHT - ((htmlY * PDF_HEIGHT) / containerHeight) - Y_OFFSET;

      // Ensure within bounds
      const boundedX = Math.max(0, Math.min(pdfX, PDF_WIDTH));
      const boundedY = Math.max(0, Math.min(pdfY, PDF_HEIGHT));

      moveElement(item.id, boundedX, boundedY);
    }
  });

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee' }}>
        <FormControl size="small">
          <InputLabel>Paper Size</InputLabel>
          <Select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value)}
            label="Paper Size"
          >
            <MenuItem value="A4">A4</MenuItem>
            <MenuItem value="A3">A3</MenuItem>
            <MenuItem value="Letter">Letter</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Orientation</InputLabel>
          <Select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
            label="Orientation"
          >
            <MenuItem value="portrait">Portrait</MenuItem>
            <MenuItem value="landscape">Landscape</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Main content area */}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Center - PDF Paper */}
        <Box 
          ref={paperContainerRef}
          sx={{ 
            width: 'calc(100% - 300px)', 
            p: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#f8f8f8',
            overflowY: 'auto'
          }}
        >
          <Paper
            ref={(node) => {
              paperRef.current = node;
              drop(node);
            }}
            sx={{
              width: `${paperDimensions.width}px`,
              height: `${paperDimensions.height}px`,
              position: 'relative',
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />
            {elements.map((element) => (
              <DraggableElement
                key={element.id}
                {...element}
                onResize={resizeElement}
                onStyleChange={updateElementStyle}
                onPositionChange={moveElement}
              />
            ))}
          </Paper>
        </Box>

        {/* Right sidebar - Generated Code */}
        <Box sx={{ 
          width: '300px', 
          borderLeft: '1px solid #eee',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Typography variant="h6">Generated Code</Typography>
          <TextareaAutosize
            value={generatedCode}
            readOnly
            style={{
              width: '100%',
              height: '100%',
              minHeight: '500px',
              fontFamily: 'monospace',
              padding: '8px',
              color: 'black',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'none'
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PDFEditor; 