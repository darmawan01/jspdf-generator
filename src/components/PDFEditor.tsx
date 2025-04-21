import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import UploadIcon from '@mui/icons-material/Upload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { 
  Box, 
  Button, 
  FormControl, 
  IconButton, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Slider, 
  Snackbar, 
  TextareaAutosize, 
  Typography 
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import PdfWrapper from '../components/PDFWrapper';
import { elementTemplates } from '../constants/templates';
import { usePDFContext } from '../hooks/usePdf';
import { ContentType } from '../types/pdf';
import DraggableElement from './DraggableElement';
import { Chart as ChartJS, registerables } from 'chart.js';
import 'chart.js/auto';

// Register Chart.js components
ChartJS.register(...registerables);

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

interface DisplayDimensions {
  width: number;
  height: number;
  scale: number;
}

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
    saveDesign,
    loadDesign,
    setGeneratedCode,
    generateCode
  } = usePDFContext();

  const paperRef = useRef<HTMLDivElement>(null);
  const paperContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const paperDimensions = useMemo(() => {
    const dimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];
    return orientation === 'landscape'
      ? { width: dimensions.height, height: dimensions.width }
      : { width: dimensions.width, height: dimensions.height };
  }, [paperSize, orientation]);

  const getDisplayDimensions = (containerWidth: number, containerHeight: number): DisplayDimensions => {
    const padding = 40; // Padding around the paper
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);

    const paperAspectRatio = paperDimensions.width / paperDimensions.height;
    const containerAspectRatio = availableWidth / availableHeight;

    let width: number;
    let height: number;
    let scale: number;

    if (containerAspectRatio > paperAspectRatio) {
      // Container is wider than paper
      height = availableHeight;
      width = height * paperAspectRatio;
      scale = height / paperDimensions.height;
    } else {
      // Container is taller than paper
      width = availableWidth;
      height = width / paperAspectRatio;
      scale = width / paperDimensions.width;
    }

    return {
      width,
      height,
      scale,
    };
  };

  const [zoom, setZoom] = useState(1);
  const [displayDimensions, setDisplayDimensions] = useState<DisplayDimensions>(getDisplayDimensions(window.innerWidth, window.innerHeight));
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Update display dimensions when paper size, orientation, or zoom changes
  useEffect(() => {
    const baseDimensions = getDisplayDimensions(window.innerWidth, window.innerHeight);
    setDisplayDimensions({
      ...baseDimensions,
      width: baseDimensions.width * zoom,
      height: baseDimensions.height * zoom,
      scale: baseDimensions.scale * zoom
    });
  }, [paperSize, orientation, zoom]);

  // Update display dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      const baseDimensions = getDisplayDimensions(window.innerWidth, window.innerHeight);
      setDisplayDimensions({
        ...baseDimensions,
        width: baseDimensions.width * zoom,
        height: baseDimensions.height * zoom,
        scale: baseDimensions.scale * zoom
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [zoom]);

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

      // Convert template dimensions to PDF points, accounting for zoom
      const elementWidth = (template?.minWidth || 300);
      const elementHeight = (template?.heightPerLine || 100);

      // Calculate maximum allowed positions to keep element within bounds
      const maxX = paperDimensions.width - elementWidth;
      const maxY = paperDimensions.height - elementHeight;

      // Ensure coordinates are within bounds considering element dimensions
      const boundedX = Math.max(0, Math.min(pdfCoords.x, maxX));
      const boundedY = Math.max(0, Math.min(pdfCoords.y, maxY));

      if (!item.id) {
        const fontSize = (item.fontSize || template?.fontSize || 16);

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
          padding: item.type === 'card' ? 10 : 0
        };

        addElement(newElement);
        // Trigger code generation after adding element
        setGeneratedCode(generateCode());
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
      // Trigger code generation after moving element
      setGeneratedCode(generateCode());
    }
  });

  const handleExportPDF = () => {
    // Get the actual paper dimensions in points
    const basePaperDimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];

    // Calculate PDF dimensions based on orientation
    const pdfWidth = orientation === 'landscape' ? basePaperDimensions.height : basePaperDimensions.width;
    const pdfHeight = orientation === 'landscape' ? basePaperDimensions.width : basePaperDimensions.height;

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

    // Create a promise for each chart rendering
    const renderPromises = elements.map(element => {
      if (element.type === 'text' || element.type === 'title') {
        return Promise.resolve(() => {
          // Set up text properties before measuring
          pdfInstance.setFont(mapFontToPDF(element.fontFamily || 'Arial'));
          const fontSize = element.fontSize || 16;
          pdfInstance.setFontSize(fontSize);

          // Get text width for alignment calculations
          const textWidth = typeof element.content === 'string'
            ? pdfInstance.getTextWidth(element.content)
            : 0;

          // Calculate baseline offset for text
          const baselineOffset = fontSize * 0.75;

          // Calculate text position
          let textX = element.position.x;
          let textY = element.position.y + baselineOffset;

          // If there's padding, adjust the position and available width
          const padding = element.padding || 0;
          const availableWidth = element.width - (padding * 2);
          textX += padding;
          textY += padding;

          // Adjust X position based on text alignment within the available width
          if (element.textAlign === 'center') {
            textX += (availableWidth - textWidth) / 2;
          } else if (element.textAlign === 'right') {
            textX += availableWidth - textWidth;
          }

          // Print the text
          if (typeof element.content === 'string') {
            pdf.printText(element.content, {
              x: textX,
              y: textY,
              fontName: mapFontToPDF(element.fontFamily || 'Arial'),
              fontSize: fontSize,
              fontStyle: element.fontStyle || 'normal',
              fontWeight: element.fontWeight || 'normal',
              align: 'left',
              color: element.textColor || '#000000'
            });
          }
        });
      } else if (element.type === 'chart') {
        return Promise.resolve(() => {
          console.log('Starting chart render for PDF...');
          
          // Create a canvas element
          const chartCanvas = document.createElement('canvas');
          document.body.appendChild(chartCanvas); // Add to DOM temporarily for proper rendering
          
          // Set canvas size
          chartCanvas.style.width = `${element.width}px`;
          chartCanvas.style.height = `${element.height}px`;
          chartCanvas.width = element.width;
          chartCanvas.height = element.height;
          
          const ctx = chartCanvas.getContext('2d');
          if (!ctx) {
            console.error('Failed to get canvas context');
            document.body.removeChild(chartCanvas);
            return;
          }

          try {
            // Parse chart config
            const chartConfig = typeof element.content === 'string' 
              ? JSON.parse(element.content) 
              : element.content;

            console.log('Chart config:', chartConfig);

            // Create chart instance
            const chart = new ChartJS(ctx, {
              type: chartConfig.type,
              data: chartConfig.data,
              options: {
                ...chartConfig.options,
                responsive: false,
                animation: false,
                plugins: {
                  legend: {
                    display: true
                  }
                }
              }
            });

            // Force a synchronous render
            chart.draw();
            
            // Get the image data
            const imageData = chartCanvas.toDataURL('image/png');
            console.log('Chart rendered, image data length:', imageData.length);

            // Clean up
            chart.destroy();
            document.body.removeChild(chartCanvas);

            // Add to PDF
            pdf.addImage(imageData, {
              x: element.position.x,
              y: element.position.y,
              w: element.width,
              h: element.height
            });

            console.log('Chart added to PDF');
          } catch (error) {
            console.error('Error rendering chart:', error);
            if (chartCanvas.parentNode) {
              document.body.removeChild(chartCanvas);
            }
          }
        });
      } else if (element.type === 'card') {
        return Promise.resolve(() => {
          // Draw card background
          const pdfInstance = pdf.getPdfInstance();
          
          // Set border color and width if border is enabled
          if (element.borderWidth && element.borderWidth > 0) {
            pdfInstance.setDrawColor(element.borderColor || '#000000');
            pdfInstance.setLineWidth(element.borderWidth);
          }

          // If shadow is enabled, draw it first
          if (element.shadow) {
            pdfInstance.setFillColor(200, 200, 200);
            pdf.roundedRect(
              element.position.x + 2,
              element.position.y + 2,
              element.width,
              element.height,
              element.borderRadius || 0,
              'F'
            );
          }

          // Draw the main rectangle
          pdfInstance.setFillColor(element.backgroundColor || '#ffffff');
          if (element.borderRadius && element.borderRadius > 0) {
            pdf.roundedRect(
              element.position.x,
              element.position.y,
              element.width,
              element.height,
              element.borderRadius,
              element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'
            );
          } else {
            pdf.rect(
              element.position.x,
              element.position.y,
              element.width,
              element.height,
              element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'
            );
          }
        });
      } else if (element.type === 'image') {
        return Promise.resolve(() => {
          if (typeof element.content === 'string') {
            pdf.addImage(element.content, {
              x: element.position.x,
              y: element.position.y,
              w: element.width,
              h: element.height
            });
          }
        });
      } else if (element.type === 'divider') {
        return Promise.resolve(() => {
          pdfInstance.setDrawColor(element.borderColor || '#000000');
          pdfInstance.setFillColor(element.borderColor || '#000000');
          pdfInstance.setLineWidth(element.height);

          pdf.rect(
            element.position.x,
            element.position.y,
            element.width,
            element.height,
            'F'
          );
        });
      }
      return Promise.resolve(() => {});
    });

    // Wait for all chart renderings to complete before generating PDF
    Promise.all(renderPromises).then((drawFunctions) => {
      console.log('All elements processed, drawing PDF...');
      
      // Execute all draw functions in sequence
      (drawFunctions as (() => void)[]).forEach(draw => {
        try {
          draw();
        } catch (error) {
          console.error('Error during draw function:', error);
        }
      });

      console.log('PDF drawing complete, creating blob...');
      const pdfBlob = pdf.toBlob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');

      // Clean up blob URL after delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    }).catch(error => {
      console.error('Error during PDF generation:', error);
    });
  };

  const handleContentChange = (id: string, content: ContentType) => {
    if (typeof content === 'string') {
    updateElementStyle(id, { content });
    } else {
      updateElementStyle(id, { content: JSON.stringify(content) });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setShowCopySuccess(true);
  };

  const handleExportDesign = () => {
    const design = saveDesign();
    const blob = new Blob([design], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'design.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportDesign = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const designString = e.target?.result as string;
      if (loadDesign(designString)) {
        // Success
        console.log('Design loaded successfully');
      } else {
        // Error
        console.error('Failed to load design');
      }
    };
    reader.readAsText(file);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
          <ZoomOutIcon fontSize="small" onClick={() => setZoom(zoom - 0.1)} />
          <Slider
            value={zoom}
            onChange={(_, value) => setZoom(value as number)}
            min={0.5}
            max={2}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
            sx={{ mx: 2 }}
          />
          <ZoomInIcon fontSize="small" onClick={() => setZoom(zoom + 0.1)} />
        </Box>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleExportPDF}
          startIcon={<PreviewIcon />}
        >
          Preview PDF
        </Button>
        <Button
          variant="outlined"
          onClick={handleExportDesign}
          startIcon={<DownloadIcon />}
        >
          Export Design
        </Button>
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          startIcon={<UploadIcon />}
        >
          Import Design
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleImportDesign}
        />
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