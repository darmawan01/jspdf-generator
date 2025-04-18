export interface ElementTemplate {
  type: string;
  content: string;
  label: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  minWidth: number;
  heightPerLine: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
  group: string;
}

export const elementTemplates: Record<string, ElementTemplate> = {
  'Title (H1)': {
    type: 'title',
    content: 'Main Title',
    label: 'Title (H1)',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    minWidth: 160,
    heightPerLine: 53,
    group: 'typography'
  },
  'Subtitle (H2)': {
    type: 'text',
    content: 'Subtitle',
    label: 'Subtitle (H2)',
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Arial',
    minWidth: 150,
    heightPerLine: 28,
    group: 'typography'
  },
  'Heading (H3)': {
    type: 'text',
    content: 'Section Heading',
    label: 'Heading (H3)',
    fontSize: 20,
    fontWeight: '500',
    fontFamily: 'Arial',
    minWidth: 170,
    heightPerLine: 28,
    group: 'typography'
  },
  'Body': {
    type: 'text',
    content: 'Body Text',
    label: 'Body',
    fontSize: 16,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    minWidth: 100,
    heightPerLine: 24,
    group: 'typography'
  },
  'Caption': {
    type: 'text',
    content: 'Caption Text',
    label: 'Caption',
    fontSize: 12,
    fontWeight: 'normal',
    fontFamily: 'Arial',
    minWidth: 80,
    heightPerLine: 18,
    group: 'typography'
  },
  'Divider': {
    type: 'divider',
    content: 'divider',
    label: 'Divider',
    minWidth: 100,
    heightPerLine: 10,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    group: 'layout'
  },
  'Card': {
    type: 'card',
    content: 'Card Content',
    label: 'Card',
    minWidth: 200,
    heightPerLine: 150,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 16,
    shadow: true,
    group: 'layout'
  },
  'Image': {
    type: 'image',
    content: 'image-url',
    label: 'Image',
    minWidth: 200,
    heightPerLine: 150,
    group: 'media'
  },
  'Bar Chart': {
    type: 'chart',
    content: JSON.stringify({
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'bar',
        data: [1, 2, 3]
      }]
    }),
    label: 'Bar Chart',
    minWidth: 300,
    heightPerLine: 200,
    group: 'charts'
  },
  'Line Chart': {
    type: 'chart',
    content: JSON.stringify({
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'line',
        data: [1, 2, 3]
      }]
    }),
    label: 'Line Chart',
    minWidth: 300,
    heightPerLine: 200,
    group: 'charts'
  },
  'Pie Chart': {
    type: 'chart',
    content: JSON.stringify({
      labels: ['A', 'B', 'C'],
      datasets: [{
        type: 'pie',
        data: [1, 2, 3]
      }]
    }),
    label: 'Pie Chart',
    minWidth: 300,
    heightPerLine: 200,
    group: 'charts'
  }
}; 