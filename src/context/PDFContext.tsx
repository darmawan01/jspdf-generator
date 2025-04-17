import { ChartData } from 'chart.js';
import React, { useCallback, useState } from 'react';
import { PDFContext, PDFElement, Position } from './types';

const PDFProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
  const [elements, setElements] = useState<PDFElement[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateCode = useCallback(() => {
    const lines = [
      'const doc = new jsPDF({',
      `  orientation: '${orientation}',`,
      `  unit: 'pt',`,
      `  format: '${paperSize.toLowerCase()}'`,
      '});',
      '',
      '// Add elements',
    ];

    elements.forEach(element => {
      if (element.type === 'text' || element.type === 'title') {
        lines.push('');
        lines.push(`// Add ${element.type}`);
        lines.push(`doc.setFont('helvetica', '${element.fontWeight === 'normal' ? 'normal' : 'bold'}')`);
        lines.push(`doc.setFontSize(${element.fontSize})`);
        lines.push(`doc.text('${element.content}',`);
        lines.push(`  ${Math.round(element.position.x)},`);
        lines.push(`  ${Math.round(element.position.y)},`);
        lines.push(`  { align: '${element.textAlign}' }`);
        lines.push(');');
      } else if (element.type === 'chart') {
        lines.push('');
        lines.push('// Add chart');
        lines.push('const chartCanvas = document.createElement("canvas");');
        lines.push(`chartCanvas.width = ${Math.round(element.width)};`);
        lines.push(`chartCanvas.height = ${Math.round(element.height)};`);
        lines.push('const ctx = chartCanvas.getContext("2d");');
        lines.push('// Add your chart data and options here');
        lines.push(`doc.addImage(chartCanvas.toDataURL(), 'PNG',`);
        lines.push(`  ${Math.round(element.position.x)},`);
        lines.push(`  ${Math.round(element.position.y)},`);
        lines.push(`  ${Math.round(element.width)},`);
        lines.push(`  ${Math.round(element.height)}`);
        lines.push(');');
      }
    });

    lines.push('');
    lines.push('// Open PDF in new tab');
    lines.push('const pdfDataUri = doc.output("datauristring");');
    lines.push('window.open(pdfDataUri);');

    return lines.join('\n');
  }, [elements, orientation, paperSize]);

  const addElement = useCallback((type: string, content: string | ChartData, position: Position) => {
    const newElement: PDFElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as PDFElement['type'],
      content: typeof content === 'string' ? content : JSON.stringify(content),
      position,
      width: 200,
      height: 100,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderColor: '#000000',
      borderWidth: 1
    };

    setElements(prev => {
      const newElements = [...prev, newElement];
      setGeneratedCode(generateCode());
      return newElements;
    });
  }, [generateCode]);

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