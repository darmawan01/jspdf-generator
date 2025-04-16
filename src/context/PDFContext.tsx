import React, { createContext, useContext, useState, useEffect } from 'react';

interface DraggableItem {
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
}

interface PDFContextType {
  elements: DraggableItem[];
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  generatedCode: string;
  addElement: (type: string, content: string, x: number, y: number) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  updateElementStyle: (id: string, updates: Partial<DraggableItem>) => void;
  deleteElement: (id: string) => void;
  setPaperSize: (size: string) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
}

const PDFContext = createContext<PDFContextType | null>(null);

export const usePDFContext = () => {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDFContext must be used within a PDFProvider');
  }
  return context;
};

export const PDFProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [elements, setElements] = useState<DraggableItem[]>([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [generatedCode, setGeneratedCode] = useState('');

  const addElement = (type: string, content: string, x: number, y: number) => {
    const newElement: DraggableItem = {
      id: Date.now().toString(),
      type,
      content,
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 200,
      height: 100,
      backgroundColor: 'white',
      borderStyle: 'dashed',
      borderColor: '#ccc',
      borderWidth: 1,
    };
    setElements(prev => [...prev, newElement]);
  };

  const moveElement = (id: string, x: number, y: number) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { 
        ...el, 
        x: Math.max(0, x),
        y: Math.max(0, y)
      } : el))
    );
  };

  const resizeElement = (id: string, width: number, height: number) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, width, height } : el))
    );
  };

  const updateElementStyle = (id: string, updates: Partial<DraggableItem>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    console.log(`Element with ID ${id} has been deleted`);
  };

  useEffect(() => {
    const generateCode = () => {
      const lines = [
        'const pdf = new PdfWrapper({',
        `  orient: '${orientation === 'landscape' ? 'l' : 'p'}',`,
        '  x: 0,',
        '  y: 0,',
        '});',
        '',
        '// Add elements',
      ];

      elements.forEach(element => {
        if (element.type === 'text' || element.type === 'title') {
          lines.push('');
          lines.push(`// Add ${element.type}`);
          lines.push(`pdf.printText('${element.content}', {`);
          lines.push(`  x: ${Math.round(element.x)},`);
          lines.push(`  y: ${Math.round(element.y)},`);
          lines.push(`  fontSize: ${element.type === 'title' ? 16 : 12},`);
          lines.push(`  fontName: 'Helvetica',`);
          lines.push(`  color: 'black',`);
          lines.push(`});`);
        } else if (element.type === 'chart') {
          lines.push('');
          lines.push('// Add chart');
          lines.push('const chartCanvas = document.createElement("canvas");');
          lines.push(`chartCanvas.width = ${Math.round(element.width)};`);
          lines.push(`chartCanvas.height = ${Math.round(element.height)};`);
          lines.push('const ctx = chartCanvas.getContext("2d");');
          lines.push('// Add your chart data and options here');
          lines.push(`pdf.addImage(chartCanvas, {`);
          lines.push(`  x: ${Math.round(element.x)},`);
          lines.push(`  y: ${Math.round(element.y)},`);
          lines.push(`  w: ${Math.round(element.width)},`);
          lines.push(`  h: ${Math.round(element.height)},`);
          lines.push(`  format: 'PNG'`);
          lines.push(`});`);
        }
      });

      lines.push('');
      lines.push('// Export the PDF');
      lines.push('pdf.export("generated.pdf");');

      return lines.join('\n');
    };

    setGeneratedCode(generateCode());
  }, [elements, orientation]);

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
    setPaperSize,
    setOrientation,
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
};

export default PDFProvider; 