import { ChartConfiguration } from 'chart.js';

export type ContentType = string | ChartConfiguration;

export interface PDFDimensions {
  width: number;
  height: number;
}

export interface PDFElement {
  id: string;
  type: 'text' | 'title' | 'image' | 'chart' | 'divider' | 'card';
  content: ContentType;
  position: { x: number; y: number };
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