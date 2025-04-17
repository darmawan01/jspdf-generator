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

    elements.forEach(element => {
      if (element.type === 'text' || element.type === 'title') {
        lines.push('');
        lines.push(`// Add ${element.type}`);
        lines.push(`// Calculate baseline offset for text`);
        lines.push(`const baselineOffset_${element.id} = ${element.fontSize} * 0.75;`);
        lines.push(`const adjustedY_${element.id} = ${Math.round(element.position.y)} + baselineOffset_${element.id};`);
        lines.push(`pdf.printText('${element.content}', {`);
        lines.push(`  x: ${Math.round(element.position.x)},`);
        lines.push(`  y: adjustedY_${element.id},`);
        lines.push(`  fontName: '${mapFontToPDF(element.fontFamily)}',`);
        lines.push(`  fontSize: ${element.fontSize},`);
        lines.push(`  fontStyle: '${element.fontStyle}',`);
        lines.push(`  fontWeight: '${element.fontWeight}',`);
        lines.push(`  align: '${element.textAlign}',`);
        lines.push(`  color: '${element.borderColor}'`);
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

  const addElement = (element: {
    type: string;
    content: string;
    position: { x: number; y: number; };
    width: number;
    height: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    borderStyle?: string;
    borderColor?: string;
    borderWidth?: number;
  }) => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: element.type as PDFElement['type'],
      content: element.content,
      position: element.position,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize || 16,
      fontFamily: element.fontFamily || 'Arial',
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal',
      textAlign: element.textAlign || 'left',
      backgroundColor: element.backgroundColor || 'transparent',
      borderStyle: element.borderStyle || 'solid',
      borderColor: element.borderColor || '#000000',
      borderWidth: element.borderWidth || 1
    };

    setElements(prev => {
      const newElements = [...prev, newElement];
      setGeneratedCode(generateCode());
      return newElements;
    });
  };

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