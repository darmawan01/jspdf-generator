import { ChartData } from 'chart.js';

export interface PDFDimensions {
  width: number;
  height: number;
}

export interface PDFElement {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart' | 'divider';
  content: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: 'normal' | 'italic';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: ChartData;
  imageUrl?: string;
  imageData?: string;
  displayScale?: number;
} 