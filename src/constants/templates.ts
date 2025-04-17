export interface ElementTemplate {
  type: string;
  content: string;
  label: string;
  fontSize: number;
  fontWeight: string;
  fontFamily: string;
  minWidth: number;
  heightPerLine: number;
}

export const elementTemplates: Record<string, ElementTemplate> = {
  'Title (H1)': {
    type: 'title',
    content: 'Main Title',
    label: 'Title (H1)',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    minWidth: 200,
    heightPerLine: 48
  },
  'Subtitle (H2)': {
    type: 'text',
    content: 'Subtitle',
    label: 'Subtitle (H2)',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Arial',
    minWidth: 150,
    heightPerLine: 36
  },
  'Heading (H3)': {
    type: 'text',
    content: 'Section Heading',
    label: 'Heading (H3)',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Arial',
    minWidth: 140,
    heightPerLine: 30
  },
  'Body': {
    type: 'text',
    content: 'Body Text',
    label: 'Body',
    fontSize: 16,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    minWidth: 100,
    heightPerLine: 24
  },
  'Caption': {
    type: 'text',
    content: 'Caption Text',
    label: 'Caption',
    fontSize: 12,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    minWidth: 80,
    heightPerLine: 18
  }
}; 