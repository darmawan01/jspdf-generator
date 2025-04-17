import { ChartData } from 'chart.js';
import { createContext } from 'react';

export const PDFContext = createContext<PDFContextType | undefined>(undefined);

export interface Position {
  x: number;
  y: number;
}

export interface PDFElement {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart';
  content: string;
  position: Position;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
}

export interface PDFContextType {
  elements: PDFElement[];
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  generatedCode: string;
  addElement: (type: string, content: string | ChartData, position: Position) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  updateElementStyle: (id: string, updates: Partial<PDFElement>) => void;
  deleteElement: (id: string) => void;
  setPaperSize: (size: string) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
} 