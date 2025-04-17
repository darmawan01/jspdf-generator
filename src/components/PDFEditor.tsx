import React, { useRef, useEffect, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { Box, Paper, Typography, Select, MenuItem, FormControl, InputLabel, TextareaAutosize, Button } from '@mui/material';
import { usePDFContext } from '../hooks/usePdf';
import DraggableElement from './DraggableElement';
import { jsPDF } from 'jspdf';
import PreviewIcon from '@mui/icons-material/Preview';
import { Chart, ChartConfiguration } from 'chart.js/auto';

// Grid configuration
const CELLS_X = 60; // For A4 width (595 points)
const CELLS_Y = 84; // For A4 height (842 points)

// Paper sizes in points (1/72 inch)
const PAPER_SIZES = {
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  Letter: { width: 612, height: 792 },
} as const;

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ItemTypes = {
  ELEMENT: 'element',
  TOOL: 'tool',
} as const;

// Helper function to ensure consistent coordinate calculation
const calculatePDFCoordinates = (
  clientX: number,
  clientY: number,
  paperRect: DOMRect,
  paperDimensions: { width: number; height: number }
): { x: number; y: number } => {
  // Get position relative to paper element (in pixels)
  const relativeX = clientX - paperRect.left;
  const relativeY = clientY - paperRect.top;

  // Log screen coordinates for debugging
  console.log('Screen coordinates:', { relativeX, relativeY });
  console.log('Paper dimensions (pixels):', { width: paperRect.width, height: paperRect.height });

  // Convert screen pixel position to PDF points with rounding for consistency
  const pdfX = Math.round((relativeX / paperRect.width) * paperDimensions.width);
  const pdfY = Math.round((relativeY / paperRect.height) * paperDimensions.height);
  
  // Log PDF coordinates for debugging
  console.log('PDF coordinates:', { pdfX, pdfY });

  // Ensure within bounds
  const boundedX = Math.max(0, Math.min(pdfX, paperDimensions.width));
  const boundedY = Math.max(0, Math.min(pdfY, paperDimensions.height));
  
  return { x: boundedX, y: boundedY };
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
    deleteElement,
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
    drop: (item: { 
      id?: string; 
      type: string; 
      content: string; 
      x?: number; 
      y?: number;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fontStyle?: string;
      textAlign?: 'left' | 'center' | 'right';
    }, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !paperRef.current) return;

      console.log('DROP - Client offset:', clientOffset);
      const paperRect = paperRef.current.getBoundingClientRect();
      console.log('DROP - Paper rect:', paperRect);
      
      // Use the shared coordinate calculation function
      const { x: boundedX, y: boundedY } = calculatePDFCoordinates(
        clientOffset.x,
        clientOffset.y,
        paperRect,
        paperDimensions
      );

      console.log('DROP - Final position:', { boundedX, boundedY });

      if (!item.id) {
        addElement(item.type, item.content, { x: boundedX, y: boundedY });
      }

      return { x: boundedX, y: boundedY };
    },
    hover: (item: { id?: string; type: string; content: string }, monitor) => {
      if (!item.id || !paperRef.current) return;

      const dragPreview = monitor.getSourceClientOffset();
      if (!dragPreview) return;

      // Only log occasionally to avoid console spam
      if (Math.random() < 0.05) {
        console.log('HOVER - Source offset:', dragPreview);
      }
      
      const paperRect = paperRef.current.getBoundingClientRect();
      
      // Use the shared coordinate calculation function
      const { x: boundedX, y: boundedY } = calculatePDFCoordinates(
        dragPreview.x,
        dragPreview.y,
        paperRect,
        paperDimensions
      );

      moveElement(item.id, boundedX, boundedY);
    }
  });

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: orientation === 'landscape' ? 'l' : 'p',
      unit: 'pt',
      format: paperSize.toLowerCase()
    });

    // Create a promise for each chart rendering
    const chartPromises = elements.map(element => {
      if (element.type === 'text' || element.type === 'title') {
        return Promise.resolve(() => {
          if (element.fontSize && element.fontWeight) {
            doc.setFont('helvetica', element.fontWeight === 'normal' ? 'normal' : 'bold');
            doc.setFontSize(element.fontSize);
            if (typeof element.content === 'string') {
              const adjustedY = element.position.y + (element.fontSize * 0.75);
              doc.text(element.content, element.position.x, adjustedY, {
                align: element.textAlign || 'left'
              });
            }
          }
        });
      } else if (element.type === 'chart') {
        return new Promise<() => void>((resolve) => {
          try {
            const chartData = JSON.parse(element.content);
            const chartContainer = document.createElement('div');
            chartContainer.style.width = `${element.width}px`;
            chartContainer.style.height = `${element.height}px`;
            document.body.appendChild(chartContainer);

            const canvas = document.createElement('canvas');
            chartContainer.appendChild(canvas);

            // Create chart instance with proper typing
            const chartConfig: ChartConfiguration = {
              type: chartData.datasets[0].type || 'bar',
              data: chartData,
              options: {
                responsive: true,
                animation: {
                  duration: 0
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom'
                  }
                }
              }
            };

            const chart = new Chart(canvas, chartConfig);

            // Wait for chart to render
            setTimeout(() => {
              const imageData = canvas.toDataURL('image/png');
              resolve(() => {
                doc.addImage(
                  imageData,
                  'PNG',
                  element.position.x,
                  element.position.y,
                  element.width,
                  element.height
                );
                // Cleanup
                chart.destroy();
                document.body.removeChild(chartContainer);
              });
            }, 100);
          } catch (error) {
            console.error('Error rendering chart:', error);
            resolve(() => {}); // Empty function if chart fails
          }
        });
      } else if (element.type === 'image' && typeof element.content === 'string') {
        return Promise.resolve(() => {
          doc.addImage(
            element.content,
            'PNG',
            element.position.x,
            element.position.y,
            element.width,
            element.height
          );
        });
      }
      return Promise.resolve(() => {});
    });

    // Wait for all charts to render, then add everything to PDF
    Promise.all(chartPromises).then(drawFunctions => {
      drawFunctions.forEach(draw => draw());
      
      // Create Blob and open in new tab
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      
      // Clean up the Blob URL after a delay to ensure it's loaded
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    });
  };

  const handleContentChange = (id: string, content: string) => {
    updateElementStyle(id, { content });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top toolbar */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, borderBottom: '1px solid #eee', alignItems: 'center' }}>
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
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleExportPDF}
          startIcon={<PreviewIcon />}
          sx={{ 
            backgroundColor: '#2196F3',
            '&:hover': {
              backgroundColor: '#1976D2'
            }
          }}
        >
          Preview PDF
        </Button>
      </Box>

      {/* Main content area */}
      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Center - PDF Paper */}
        <Box 
          ref={paperContainerRef}
          sx={{ 
            flex: 1,
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            bgcolor: '#f8f8f8',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            }
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
              flexShrink: 0
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
              typeof element.content === 'string' && (
                <DraggableElement
                  key={element.id}
                  {...element}
                  x={element.position.x}
                  y={element.position.y}
                  content={element.content}
                  backgroundColor={element.backgroundColor || 'white'}
                  borderStyle={element.borderStyle || 'solid'}
                  borderColor={element.borderColor || '#000'}
                  borderWidth={element.borderWidth || 1}
                  onResize={resizeElement}
                  onStyleChange={updateElementStyle}
                  onPositionChange={moveElement}
                  onContentChange={handleContentChange}
                  onDelete={deleteElement}
                />
              )
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
          gap: 1,
          overflow: 'auto'
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