import React, { useCallback, useState, useEffect } from 'react';
import { PDFContext, PDFElement } from './types';
import { PAPER_SIZES } from '../constants/paper';

// Font mapping to jsPDF supported fonts
const mapFontToPDF = (font: string): string => {
  const fontMap: Record<string, string> = {
    'Arial': 'helvetica',
    'Helvetica': 'helvetica',
    'Times New Roman': 'times',
    'Times': 'times',
    'Courier New': 'courier',
    'Courier': 'courier',
    'Symbol': 'symbol',
    'ZapfDingbats': 'zapfdingbats'
  };
  return fontMap[font] || 'helvetica';
};

const PDFProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
  const [elements, setElements] = useState<PDFElement[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateCode = useCallback(() => {
    // Sort elements by z-index for proper rendering order
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    
    // Get paper dimensions
    const paperDimensions = PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES];
    const actualWidth = orientation === 'landscape' ? paperDimensions.height : paperDimensions.width;
    const actualHeight = orientation === 'landscape' ? paperDimensions.width : paperDimensions.height;
    
    const lines = [
      'const pdf = new PdfWrapper({',
      `  orient: '${orientation === 'landscape' ? 'l' : 'p'}',`,
      '  x: 0,',
      '  y: 0',
      '});',
      '',
      '// Set paper size',
      'const pdfInstance = pdf.getPdfInstance();',
      'pdfInstance.setPage(1);',
      `pdfInstance.internal.pageSize.width = ${actualWidth};`,
      `pdfInstance.internal.pageSize.height = ${actualHeight};`,
      '',
      '// Initialize page without margins',
      'pdf.initPage({ header: false, footer: false });',
      '',
      '// Add elements'
    ];

    // Process each element
    sortedElements.forEach(element => {
      if (element.type === 'text' || element.type === 'title') {
        lines.push('');
        lines.push(`// Add ${element.type}`);
        lines.push(`pdfInstance.setFont('${mapFontToPDF(element.fontFamily || 'Arial')}');`);
        lines.push(`pdfInstance.setFontSize(${element.fontSize || 16});`);
        lines.push(`pdf.printText('${element.content}', {`);
        lines.push(`  x: ${Math.round(element.position.x)},`);
        lines.push(`  y: ${Math.round(element.position.y)},`);
        lines.push(`  fontName: '${mapFontToPDF(element.fontFamily || 'Arial')}',`);
        lines.push(`  fontSize: ${element.fontSize || 16},`);
        lines.push(`  fontStyle: '${element.fontStyle || 'normal'}',`);
        lines.push(`  fontWeight: '${element.fontWeight || 'normal'}',`);
        lines.push(`  align: '${element.textAlign || 'left'}',`);
        lines.push(`  color: '${element.textColor || '#000000'}'`);
        lines.push('});');
      } else if (element.type === 'chart') {
        lines.push('');
        lines.push('// Add chart');
        lines.push('console.log("Starting chart render for PDF...");');
        lines.push('');
        lines.push('// Create and setup canvas');
        lines.push('const chartCanvas = document.createElement("canvas");');
        lines.push('document.body.appendChild(chartCanvas);');
        lines.push(`chartCanvas.style.width = "${Math.round(element.width)}px";`);
        lines.push(`chartCanvas.style.height = "${Math.round(element.height)}px";`);
        lines.push(`chartCanvas.width = ${Math.round(element.width)};`);
        lines.push(`chartCanvas.height = ${Math.round(element.height)};`);
        lines.push('');
        lines.push('const ctx = chartCanvas.getContext("2d");');
        lines.push('if (!ctx) {');
        lines.push('  console.error("Failed to get canvas context");');
        lines.push('  document.body.removeChild(chartCanvas);');
        lines.push('  return;');
        lines.push('}');
        lines.push('');
        lines.push('try {');
        lines.push('  // Parse chart config');
        lines.push(`  const chartConfig = ${element.content && typeof element.content === 'string' ? element.content : '{}'};`);
        lines.push('  console.log("Chart config:", chartConfig);');
        lines.push('');
        lines.push('  // Create chart instance');
        lines.push('  const chart = new ChartJS(ctx, {');
        lines.push('    type: chartConfig.type,');
        lines.push('    data: chartConfig.data,');
        lines.push('    options: {');
        lines.push('      ...chartConfig.options,');
        lines.push('      responsive: false,');
        lines.push('      animation: false,');
        lines.push('      plugins: {');
        lines.push('        legend: {');
        lines.push('          display: true');
        lines.push('        }');
        lines.push('      }');
        lines.push('    }');
        lines.push('  });');
        lines.push('');
        lines.push('  // Force a synchronous render');
        lines.push('  chart.draw();');
        lines.push('');
        lines.push('  // Get the image data');
        lines.push('  const imageData = chartCanvas.toDataURL("image/png");');
        lines.push('  console.log("Chart rendered, image data length:", imageData.length);');
        lines.push('');
        lines.push('  // Clean up');
        lines.push('  chart.destroy();');
        lines.push('  document.body.removeChild(chartCanvas);');
        lines.push('');
        lines.push('  // Add to PDF');
        lines.push('  pdf.addImage(imageData, {');
        lines.push(`    x: ${Math.round(element.position.x)},`);
        lines.push(`    y: ${Math.round(element.position.y)},`);
        lines.push(`    w: ${Math.round(element.width)},`);
        lines.push(`    h: ${Math.round(element.height)}`);
        lines.push('  });');
        lines.push('');
        lines.push('  console.log("Chart added to PDF");');
        lines.push('} catch (error) {');
        lines.push('  console.error("Error rendering chart:", error);');
        lines.push('  if (chartCanvas.parentNode) {');
        lines.push('    document.body.removeChild(chartCanvas);');
        lines.push('  }');
        lines.push('}');
      } else if (element.type === 'image') {
        lines.push('');
        lines.push('// Add image');
        lines.push(`pdf.addImage('${element.content}', {`);
        lines.push(`  x: ${Math.round(element.position.x)},`);
        lines.push(`  y: ${Math.round(element.position.y)},`);
        lines.push(`  w: ${Math.round(element.width)},`);
        lines.push(`  h: ${Math.round(element.height)}`);
        lines.push('});');
      } else if (element.type === 'card') {
        lines.push('');
        lines.push('// Add card background');
        lines.push(`pdfInstance.setFillColor('${element.backgroundColor || '#ffffff'}');`);
        lines.push(`pdf.roundedRect(${Math.round(element.position.x)}, ${Math.round(element.position.y)}, ${Math.round(element.width)}, ${Math.round(element.height)}, ${element.borderRadius || 0}, 'F');`);
      } else if (element.type === 'divider') {
        lines.push('');
        lines.push('// Add divider');
        lines.push(`pdfInstance.setDrawColor('${element.borderColor || '#000000'}');`);
        lines.push(`pdfInstance.setLineWidth(${element.height || 1});`);
        lines.push(`pdf.line(${Math.round(element.position.x)}, ${Math.round(element.position.y)}, ${Math.round(element.position.x + element.width)}, ${Math.round(element.position.y)});`);
      }
    });

    lines.push('');
    lines.push('// Get PDF as blob and open in new window');
    lines.push('const pdfBlob = pdf.toBlob();');
    lines.push('const blobUrl = URL.createObjectURL(pdfBlob);');
    lines.push('window.open(blobUrl, "_blank");');
    lines.push('');
    lines.push('// Clean up blob URL after delay');
    lines.push('setTimeout(() => {');
    lines.push('  URL.revokeObjectURL(blobUrl);');
    lines.push('}, 1000);');

    return lines.join('\n');
  }, [elements, orientation, paperSize]);

  const addElement = useCallback((element: Omit<PDFElement, 'id' | 'zIndex'>) => {
    const newElement: PDFElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
      zIndex: elements.length // New elements are added on top
    };

    setElements(prev => {
      const newElements = [...prev, newElement];
      // Generate code immediately with the new elements
      const newCode = generateCode();
      setGeneratedCode(newCode);
      return newElements;
    });
  }, [elements.length, generateCode]);

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, position: { x: Math.max(0, x), y: Math.max(0, y) } } : el
      );
      // Generate code immediately with the updated elements
      const newCode = generateCode();
      setGeneratedCode(newCode);
      return newElements;
    });
  }, [generateCode]);

  const resizeElement = useCallback((id: string, width: number, height: number) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, width, height } : el
      );
      // Generate code immediately with the updated elements
      const newCode = generateCode();
      setGeneratedCode(newCode);
      return newElements;
    });
  }, [generateCode]);

  const updateElementStyle = useCallback((id: string, updates: Partial<PDFElement>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      );
      // Generate code immediately with the updated elements
      const newCode = generateCode();
      setGeneratedCode(newCode);
      return newElements;
    });
  }, [generateCode]);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      // Generate code immediately with the updated elements
      const newCode = generateCode();
      setGeneratedCode(newCode);
      return newElements;
    });
  }, [generateCode]);

  // Stacking operations
  const bringForward = useCallback((id: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index === -1 || index === prev.length - 1) return prev;

      const newElements = [...prev];
      const element = newElements[index];
      const nextElement = newElements[index + 1];
      
      // Swap positions
      newElements[index] = nextElement;
      newElements[index + 1] = element;
      
      // Update zIndex values
      newElements.forEach((el, i) => {
        el.zIndex = i;
      });
      
      return newElements;
    });
  }, []);

  const sendBackward = useCallback((id: string) => {
    setElements(prev => {
      const index = prev.findIndex(el => el.id === id);
      if (index <= 0) return prev;

      const newElements = [...prev];
      const element = newElements[index];
      const prevElement = newElements[index - 1];
      
      // Swap positions
      newElements[index] = prevElement;
      newElements[index - 1] = element;
      
      // Update zIndex values
      newElements.forEach((el, i) => {
        el.zIndex = i;
      });
      
      return newElements;
    });
  }, []);

  const bringToFront = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;

      const newElements = prev.filter(el => el.id !== id);
      newElements.push(element);
      
      // Update zIndex values
      newElements.forEach((el, i) => {
        el.zIndex = i;
      });
      
      return newElements;
    });
  }, []);

  const sendToBack = useCallback((id: string) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;

      const newElements = prev.filter(el => el.id !== id);
      newElements.unshift(element);
      
      // Update zIndex values
      newElements.forEach((el, i) => {
        el.zIndex = i;
      });
      
      return newElements;
    });
  }, []);

  const saveDesign = (): string => {
    const design = {
      elements,
      paperSize,
      orientation,
      version: '1.0'
    };
    return JSON.stringify(design);
  };

  const loadDesign = (designString: string): boolean => {
    try {
      const design = JSON.parse(designString);
      if (design.version !== '1.0') {
        throw new Error('Invalid design version');
      }
      
      // Clear existing elements
      setElements([]);
      
      // Set paper size and orientation
      setPaperSize(design.paperSize);
      setOrientation(design.orientation);
      
      // Add elements with new IDs
      const newElements: PDFElement[] = [];
      design.elements.forEach((element: Omit<PDFElement, 'id' | 'zIndex'>) => {
        const newElement: PDFElement = {
          ...element,
          id: Math.random().toString(36).substr(2, 9),
          zIndex: newElements.length
        };
        newElements.push(newElement);
      });
      
      // Update elements and generate code immediately
      setElements(newElements);
      const newCode = generateCode();
      setGeneratedCode(newCode);
      
      return true;
    } catch (error) {
      console.error('Error loading design:', error);
      return false;
    }
  };

  // Update code generation when paper size or orientation changes
  useEffect(() => {
    const newCode = generateCode();
    setGeneratedCode(newCode);
  }, [paperSize, orientation, generateCode]);

  const value = {
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
    setPaperSize: useCallback((size: string) => {
      setPaperSize(size);
      setGeneratedCode(generateCode());
    }, [generateCode]),
    setOrientation: useCallback((o: 'portrait' | 'landscape') => {
      setOrientation(o);
      setGeneratedCode(generateCode());
    }, [generateCode]),
    saveDesign,
    loadDesign,
    setGeneratedCode,
    generateCode
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
};

export default PDFProvider; 