import { createContext } from 'react';
import { ContentType } from '../types/pdf';

export const PDFContext = createContext<PDFContextType | undefined>(undefined);

export interface Position {
  x: number;
  y: number;
}

export interface PDFElement {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart' | 'divider' | 'card';
  content: ContentType;
  position: Position;
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
  textColor?: string;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
  zIndex: number;
}

export interface PDFContextType {
  elements: PDFElement[];
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  generatedCode: string;
  addElement: (element: Omit<PDFElement, 'id' | 'zIndex'>) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  updateElementStyle: (id: string, updates: Partial<PDFElement>) => void;
  deleteElement: (id: string) => void;
  setPaperSize: (size: string) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  saveDesign: () => string;
  loadDesign: (designString: string) => boolean;
  setGeneratedCode: (code: string) => void;
  generateCode: () => string;
} 