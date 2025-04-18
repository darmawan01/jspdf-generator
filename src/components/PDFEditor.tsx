import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Snackbar, TextareaAutosize, Typography } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import PdfWrapper from '../components/PDFWrapper';
import { elementTemplates } from '../constants/templates';
import { usePDFContext } from '../hooks/usePdf';
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

interface GridCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DropItem {
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
  minWidth?: number;
  heightPerLine?: number;
}

export const ItemTypes = {
  ELEMENT: 'element',
  TOOL: 'tool',
} as const;

// Font mapping to jsPDF supported fonts
const mapFontToPDF = (font: string): string => {
  const fontMap: Record<string, string> = {
    'Arial': 'helvetica',
    'Helvetica': 'helvetica',
    'Times New Roman': 'times',
    'Times': 'times',
    'Courier New': 'courier',
    'Courier': 'courier'
  };
  return fontMap[font] || 'helvetica';
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
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    setPaperSize,
    setOrientation,
  } = usePDFContext();

  const paperRef = useRef<HTMLDivElement>(null);
  const paperContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const paperDimensions = useMemo(() => {
    const dimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];
    return orientation === 'landscape'
      ? { width: dimensions.height, height: dimensions.width }
      : { width: dimensions.width, height: dimensions.height };
  }, [paperSize, orientation]);

  // Calculate display dimensions for responsive design
  const getDisplayDimensions = useCallback(() => {
    const containerWidth = window.innerWidth - 600; // Account for sidebars and padding
    const containerHeight = window.innerHeight - 200; // Account for header and padding

    // Target to use 80% of available space while maintaining aspect ratio
    const targetWidth = containerWidth * 0.8;
    const targetHeight = containerHeight * 0.8;

    const aspectRatio = paperDimensions.width / paperDimensions.height;
    
    if (targetWidth / aspectRatio <= targetHeight) {
      // Width limited
      return {
        width: targetWidth,
        height: targetWidth / aspectRatio,
        scale: targetWidth / paperDimensions.width
      };
    } else {
      // Height limited
      return {
        width: targetHeight * aspectRatio,
        height: targetHeight,
        scale: targetHeight / paperDimensions.height
      };
    }
  }, [paperDimensions]);

  const [displayDimensions, setDisplayDimensions] = useState(getDisplayDimensions());
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Update display dimensions when paper size or orientation changes
  useEffect(() => {
    setDisplayDimensions(getDisplayDimensions());
  }, [paperSize, orientation, getDisplayDimensions]);

  // Update display dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDisplayDimensions(getDisplayDimensions());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getDisplayDimensions]);

  // Handle orientation change
  const handleOrientationChange = (newOrientation: 'portrait' | 'landscape') => {
    if (newOrientation === orientation) return;

    // Update orientation
    setOrientation(newOrientation);

    // Adjust element positions and dimensions for the new orientation
    elements.forEach(element => {
      const oldX = element.position.x;
      const oldY = element.position.y;
      const oldWidth = element.width;
      const oldHeight = element.height;

      // Calculate new position to maintain relative position in new orientation
      const newX = oldY * (paperDimensions.height / paperDimensions.width);
      const newY = oldX * (paperDimensions.width / paperDimensions.height);

      // Update element position and dimensions
      moveElement(element.id, newX, newY);
      resizeElement(element.id, oldWidth, oldHeight);
    });
  };

  // Convert display coordinates to PDF coordinates
  const displayToPdfCoordinates = (displayX: number, displayY: number) => {
    return {
      x: displayX / displayDimensions.scale,
      y: displayY / displayDimensions.scale
    };
  };

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
    drop: (item: DropItem, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !paperRef.current) return;

      const paperRect = paperRef.current.getBoundingClientRect();
      const relativeX = clientOffset.x - paperRect.left;
      const relativeY = clientOffset.y - paperRect.top;

      // Convert to PDF coordinates
      const pdfCoords = displayToPdfCoordinates(relativeX, relativeY);

      // Get the element's dimensions
      const template = Object.values(elementTemplates).find(
        t => t.type === item.type && t.content === item.content
      );
      
      // Convert template dimensions to PDF points
      const elementWidth = (template?.minWidth || 300) / displayDimensions.scale;
      const elementHeight = (template?.heightPerLine || 100) / displayDimensions.scale;
      
      // Calculate maximum allowed positions to keep element within bounds
      const maxX = paperDimensions.width - elementWidth;
      const maxY = paperDimensions.height - elementHeight;
      
      // Ensure coordinates are within bounds considering element dimensions
      const boundedX = Math.max(0, Math.min(pdfCoords.x, maxX));
      const boundedY = Math.max(0, Math.min(pdfCoords.y, maxY));

      if (!item.id) {
        const fontSize = (item.fontSize || template?.fontSize || 16) / displayDimensions.scale;

        console.log('Creating new element with PDF dimensions:', {
          x: boundedX,
          y: boundedY,
          width: elementWidth,
          height: elementHeight,
          fontSize,
          scale: displayDimensions.scale,
          type: item.type
        });

        const newElement = {
          type: item.type as 'text' | 'title' | 'image' | 'chart' | 'divider' | 'card',
          content: item.content,
          position: { x: boundedX, y: boundedY },
          width: elementWidth,
          height: elementHeight,
          fontSize,
          fontFamily: item.fontFamily || template?.fontFamily || 'Arial',
          fontWeight: item.fontWeight || template?.fontWeight || 'normal',
          fontStyle: item.fontStyle || 'normal',
          textAlign: item.textAlign || 'left',
          backgroundColor: template?.backgroundColor || 'transparent',
          borderStyle: 'none',
          borderColor: '#000000',
          borderWidth: 0,
          padding: item.type === 'card' ? 10 / displayDimensions.scale : 0
        };

        addElement(newElement);
      }

      return { x: boundedX, y: boundedY };
    },
    hover: (item: { id?: string; type: string; content: string; }, monitor) => {
      if (!item.id || !paperRef.current) return;

      const dragPreview = monitor.getSourceClientOffset();
      if (!dragPreview) return;
      
      const paperRect = paperRef.current.getBoundingClientRect();
      const relativeX = dragPreview.x - paperRect.left;
      const relativeY = dragPreview.y - paperRect.top;

      // Convert to PDF coordinates
      const pdfCoords = displayToPdfCoordinates(relativeX, relativeY);

      // Get the element's current dimensions
      const element = elements.find(el => el.id === item.id);
      if (!element) return;

      // Calculate maximum allowed positions
      const maxX = paperDimensions.width - element.width;
      const maxY = paperDimensions.height - element.height;
      
      // Ensure coordinates are within bounds considering element dimensions
      const boundedX = Math.max(0, Math.min(pdfCoords.x, maxX));
      const boundedY = Math.max(0, Math.min(pdfCoords.y, maxY));

      moveElement(item.id, boundedX, boundedY);
    }
  });

  const handleExportPDF = () => {
    // Get the actual paper dimensions in points
    const basePaperDimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];
    
    // Calculate PDF dimensions based on orientation
    const pdfWidth = orientation === 'landscape' ? basePaperDimensions.height : basePaperDimensions.width;
    const pdfHeight = orientation === 'landscape' ? basePaperDimensions.width : basePaperDimensions.height;

    // Calculate the scale factor based on the actual paper dimensions
    const scaleX = pdfWidth / paperDimensions.width;
    const scaleY = pdfHeight / paperDimensions.height;

    const pdf = new PdfWrapper({
      orient: orientation === 'landscape' ? 'l' : 'p',
      x: 0,
      y: 0
    });

    // Set the paper size
    const pdfInstance = pdf.getPdfInstance();
    pdfInstance.setPage(1);
    pdfInstance.internal.pageSize.width = pdfWidth;
    pdfInstance.internal.pageSize.height = pdfHeight;

    // Initialize the page without any margins
    pdf.initPage({ header: false, footer: false });

    // Draw grid (optional, for debugging)
    const drawGrid = false; // Set to true to see the grid in PDF
    if (drawGrid) {
      pdfInstance.setDrawColor(200, 200, 200);
      pdfInstance.setLineWidth(0.1);

      // Draw vertical lines
      for (let x = 0; x <= CELLS_X; x++) {
        const xPos = (x * pdfWidth) / CELLS_X;
        pdfInstance.line(xPos, 0, xPos, pdfHeight);
      }

      // Draw horizontal lines
      for (let y = 0; y <= CELLS_Y; y++) {
        const yPos = (y * pdfHeight) / CELLS_Y;
        pdfInstance.line(0, yPos, pdfWidth, yPos);
      }
    }

    // Create a promise for each chart rendering
    const chartPromises = elements.map(element => {
      if (element.type === 'text' || element.type === 'title') {
        return Promise.resolve(() => {
          // Set up text properties before measuring
          pdfInstance.setFont(mapFontToPDF(element.fontFamily || 'Arial'));
          pdfInstance.setFontSize(element.fontSize || 16);
          
          // Get text width for alignment calculations
          const textWidth = pdfInstance.getTextWidth(element.content);
          
          // Calculate baseline offset for text
          const baselineOffset = (element.fontSize || 16) * 0.75;

          // Calculate text position with proper scaling
          let textX = element.position.x * scaleX;
          let textY = element.position.y * scaleY + baselineOffset;

          // If there's padding, adjust the position and available width
          const padding = (element.padding || 0) * scaleX;
          const availableWidth = element.width * scaleX - (padding * 2);
          textX += padding;
          textY += padding;

          // Adjust X position based on text alignment within the available width
          if (element.textAlign === 'center') {
            textX += (availableWidth - textWidth) / 2;
          } else if (element.textAlign === 'right') {
            textX += availableWidth - textWidth;
          }

          // Print the text
          pdf.printText(element.content, {
            x: textX,
            y: textY,
            fontName: mapFontToPDF(element.fontFamily || 'Arial'),
            fontSize: element.fontSize || 16,
            fontStyle: element.fontStyle || 'normal',
            fontWeight: element.fontWeight || 'normal',
            align: 'left', // We handle alignment manually through x position
            color: element.textColor || '#000000'
          });
        });
      } else if (element.type === 'card') {
        return Promise.resolve(() => {
          // Draw card background
          // Set border color and width if border is enabled
          if (element.borderWidth && element.borderWidth > 0) {
            pdfInstance.setDrawColor(element.borderColor || '#000000');
            pdfInstance.setLineWidth(element.borderWidth * scaleX);
          }

          // If shadow is enabled, draw it first
          if (element.shadow) {
            pdfInstance.setFillColor(200, 200, 200);
            pdf.roundedRect(
              element.position.x * scaleX + (2 * scaleX),
              element.position.y * scaleY + (2 * scaleY),
              element.width * scaleX,
              element.height * scaleY,
              element.borderRadius ? element.borderRadius * scaleX : 0,
              'F'
            );
          }

          // Draw the main rectangle with border radius if specified
          pdfInstance.setFillColor(element.backgroundColor || '#ffffff');
          if (element.borderRadius && element.borderRadius > 0) {
            pdf.roundedRect(
              element.position.x * scaleX,
              element.position.y * scaleY,
              element.width * scaleX,
              element.height * scaleY,
              element.borderRadius * scaleX,
              element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'
            );
          } else {
            pdf.rect(
              element.position.x * scaleX,
              element.position.y * scaleY,
              element.width * scaleX,
              element.height * scaleY,
              element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'
            );
          }
        });
      } else if (element.type === 'chart' || element.type === 'image') {
        return Promise.resolve(() => {
          pdf.addImage(element.content, {
            x: element.position.x * scaleX,
            y: element.position.y * scaleY,
            w: element.width * scaleX,
            h: element.height * scaleY
          });
        });
      } else if (element.type === 'divider') {
        return Promise.resolve(() => {
          pdfInstance.setDrawColor(element.borderColor || '#000000');
          pdfInstance.setFillColor(element.borderColor || '#000000');
          pdfInstance.setLineWidth(element.height * scaleY);
          
          pdf.rect(
            element.position.x * scaleX,
            element.position.y * scaleY,
            element.width * scaleX,
            element.height * scaleY,
            'F'
          );
        });
      }
      return Promise.resolve(() => {});
    });

    Promise.all(chartPromises).then(drawFunctions => {
      drawFunctions.forEach(draw => draw());
      const pdfBlob = pdf.toBlob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    });
  };

  const handleContentChange = (id: string, content: string) => {
    updateElementStyle(id, { content });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setShowCopySuccess(true);
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
            onChange={(e) => handleOrientationChange(e.target.value as 'portrait' | 'landscape')}
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
            },
            '&:active': {
              border: 'none',
              outline: 'none'
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
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            bgcolor: '#f8f8f8',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '12px',
              height: '12px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '6px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '6px',
              border: '3px solid #f1f1f1'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555'
            }
          }}
        >
          <Paper
            ref={(node) => {
              paperRef.current = node;
              drop(node);
            }}
            sx={{
              width: `${displayDimensions.width}px`,
              height: `${displayDimensions.height}px`,
              position: 'relative',
              backgroundColor: 'white',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              padding: 0,
              margin: 0,
              boxSizing: 'border-box',
              flexShrink: 0,
              transition: 'width 0.3s ease, height 0.3s ease'
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
                  backgroundColor={element.backgroundColor || 'transparent'}
                  borderStyle={element.borderStyle || 'solid'}
                  borderColor={element.borderColor || '#000000'}
                  borderWidth={element.borderWidth || 1}
                  onResize={resizeElement}
                  onStyleChange={updateElementStyle}
                  onPositionChange={moveElement}
                  onContentChange={handleContentChange}
                  onDelete={deleteElement}
                  bringForward={bringForward}
                  sendBackward={sendBackward}
                  bringToFront={bringToFront}
                  sendToBack={sendToBack}
                  paperDimensions={paperDimensions}
                  displayScale={displayDimensions.scale}
                />
              )
            ))}
          </Paper>
        </Box>

        {/* Right sidebar - Generated Code */}
        <Box sx={{
          width: '300px',
          borderLeft: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: 'calc(100vh - 100px)'
        }}>
          <Box sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee'
          }}>
            <Typography variant="h6">Generated Code</Typography>
            <IconButton 
              onClick={handleCopyCode}
              size="small"
              sx={{ 
                color: '#2196F3',
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.04)'
                }
              }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Box>
          <Box sx={{ 
            flex: 1,
            overflow: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f5f5f5'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#ddd',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#ccc'
            },
            height: '100%'
          }}>
            <TextareaAutosize
              value={generatedCode}
              readOnly
              style={{
                width: '100%',
                height: 'calc(100vh - 230px)',
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

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        message="Code copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default PDFEditor; 