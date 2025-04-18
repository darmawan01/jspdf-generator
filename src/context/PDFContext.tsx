import React, { useCallback, useState } from 'react';
import { PDFContext, PDFElement } from './types';

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
    
    const lines = [
      'const pdf = new PdfWrapper({',
      `  orient: '${orientation === 'landscape' ? 'l' : 'p'}',`,
      '  x: 0,',
      '  y: 0',
      '});',
      '',
      '// Initialize page without margins',
      'pdf.initPage({ header: false, footer: false });',
      '',
      '// Add elements'
    ];

    sortedElements.forEach(element => {
      if (element.type === 'text' || element.type === 'title') {
        lines.push('');
        lines.push(`// Add ${element.type}`);
        lines.push(`// Set up text properties`);
        lines.push(`const pdfInstance_${element.id} = pdf.getPdfInstance();`);
        lines.push(`pdfInstance_${element.id}.setFont('${mapFontToPDF(element.fontFamily || 'Arial')}');`);
        lines.push(`pdfInstance_${element.id}.setFontSize(${element.fontSize || 16});`);
        lines.push(`const textWidth_${element.id} = pdfInstance_${element.id}.getTextWidth('${element.content}');`);
        lines.push(`const baselineOffset_${element.id} = ${element.fontSize || 16} * 0.75;`);
        lines.push(`const padding_${element.id} = ${element.padding || 0};`);
        lines.push(`const availableWidth_${element.id} = ${element.width} - (padding_${element.id} * 2);`);
        lines.push('');
        lines.push(`// Calculate text position`);
        lines.push(`let textX_${element.id} = ${Math.round(element.position.x)} + padding_${element.id};`);
        lines.push(`let textY_${element.id} = ${Math.round(element.position.y)} + baselineOffset_${element.id} + padding_${element.id};`);
        lines.push('');
        lines.push(`// Adjust position based on alignment`);
        if (element.textAlign === 'center') {
          lines.push(`textX_${element.id} += (availableWidth_${element.id} - textWidth_${element.id}) / 2;`);
        } else if (element.textAlign === 'right') {
          lines.push(`textX_${element.id} += availableWidth_${element.id} - textWidth_${element.id};`);
        }
        lines.push('');
        lines.push(`// Print the text`);
        lines.push(`pdf.printText('${element.content}', {`);
        lines.push(`  x: textX_${element.id},`);
        lines.push(`  y: textY_${element.id},`);
        lines.push(`  fontName: '${mapFontToPDF(element.fontFamily || 'Arial')}',`);
        lines.push(`  fontSize: ${element.fontSize || 16},`);
        lines.push(`  fontStyle: '${element.fontStyle || 'normal'}',`);
        lines.push(`  fontWeight: '${element.fontWeight || 'normal'}',`);
        lines.push(`  align: 'left',`);
        lines.push(`  color: '${element.textColor || '#000000'}'`);
        lines.push('});');
      } else if (element.type === 'chart') {
        lines.push('');
        lines.push('// Add chart');
        lines.push('const chartCanvas = document.createElement("canvas");');
        lines.push(`chartCanvas.width = ${Math.round(element.width)};`);
        lines.push(`chartCanvas.height = ${Math.round(element.height)};`);
        lines.push('const ctx = chartCanvas.getContext("2d");');
        lines.push('// Add your chart data and options here');
        lines.push(`pdf.addImage(chartCanvas.toDataURL(), {`);
        lines.push(`  x: ${Math.round(element.position.x)},`);
        lines.push(`  y: ${Math.round(element.position.y)},`);
        lines.push(`  w: ${Math.round(element.width)},`);
        lines.push(`  h: ${Math.round(element.height)}`);
        lines.push('});');
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
        lines.push(`const pdfInstance = pdf.getPdfInstance();`);
        
        // Set border color and width if border is enabled
        if (element.borderWidth && element.borderWidth > 0) {
          lines.push(`pdfInstance.setDrawColor('${element.borderColor || '#000000'}');`);
          lines.push(`pdfInstance.setLineWidth(${element.borderWidth});`);
        }

        // If shadow is enabled, draw it first
        if (element.shadow) {
          lines.push(`// Draw shadow`);
          lines.push(`pdfInstance.setFillColor(200, 200, 200);`);
          lines.push(`pdf.roundedRect(${Math.round(element.position.x + 2)}, ${Math.round(element.position.y + 2)}, ${Math.round(element.width)}, ${Math.round(element.height)}, ${element.borderRadius || 0}, 'F');`);
        }

        // Draw the main rectangle with border radius if specified
        lines.push(`// Draw main rectangle`);
        lines.push(`pdfInstance.setFillColor('${element.backgroundColor || '#ffffff'}');`);
        if (element.borderRadius && element.borderRadius > 0) {
          lines.push(`// Draw rounded rectangle with border radius`);
          lines.push(`pdf.roundedRect(${Math.round(element.position.x)}, ${Math.round(element.position.y)}, ${Math.round(element.width)}, ${Math.round(element.height)}, ${element.borderRadius}, '${element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'}');`);
        } else {
          lines.push(`// Draw regular rectangle`);
          lines.push(`pdf.rect(${Math.round(element.position.x)}, ${Math.round(element.position.y)}, ${Math.round(element.width)}, ${Math.round(element.height)}, '${element.borderWidth && element.borderWidth > 0 ? 'FD' : 'F'}');`);
        }
      } else if (element.type === 'divider') {
        lines.push('');
        lines.push('// Add divider');
        lines.push(`pdfInstance.setDrawColor('${element.borderColor || '#000000'}');`);
        lines.push(`pdfInstance.setFillColor('${element.borderColor || '#000000'}');`);
        lines.push(`pdfInstance.setLineWidth(${element.height || 1});`);
        
        // Draw the divider as a filled rectangle
        lines.push(`pdf.rect(${Math.round(element.position.x)}, ${Math.round(element.position.y)}, ${Math.round(element.width)}, ${Math.round(element.height)}, 'F');`);
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
  }, [elements, orientation]);

  const addElement = useCallback((element: Omit<PDFElement, 'id' | 'zIndex'>) => {
    const newElement: PDFElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
      zIndex: elements.length // New elements are added on top
    };

    setElements(prev => {
      const newElements = [...prev, newElement];
      setGeneratedCode(generateCode());
      return newElements;
    });
  }, [elements.length, generateCode]);

  const moveElement = useCallback((id: string, x: number, y: number) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, position: { x: Math.max(0, x), y: Math.max(0, y) } } : el
      );
      setGeneratedCode(generateCode());
      return newElements;
    });
  }, [generateCode]);

  const resizeElement = useCallback((id: string, width: number, height: number) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, width, height } : el
      );
      setGeneratedCode(generateCode());
      return newElements;
    });
  }, [generateCode]);

  const updateElementStyle = useCallback((id: string, updates: Partial<PDFElement>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      );
      setGeneratedCode(generateCode());
      return newElements;
    });
  }, [generateCode]);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id);
      setGeneratedCode(generateCode());
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
    }, [generateCode])
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
};

export default PDFProvider; 