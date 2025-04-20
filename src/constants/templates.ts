import { ChartContent } from '../types/chart';

export interface ElementTemplate {
  type: string;
  content: string | ChartContent;
  label: string;
  group?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  minWidth?: number;
  heightPerLine?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  shadow?: boolean;
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
    heightPerLine: 2,
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
    content: {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [{
          label: 'Sample Data',
          data: [65, 59, 80, 81, 56],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    label: 'Bar Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  'Line Chart': {
    type: 'chart',
    content: {
      type: 'line',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [{
          label: 'Sample Data',
          data: [65, 59, 80, 81, 56],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    label: 'Line Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  'Pie Chart': {
    type: 'chart',
    content: {
      type: 'pie',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
        datasets: [{
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    },
    label: 'Pie Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  'Doughnut Chart': {
    type: 'chart',
    content: {
      type: 'doughnut',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
        datasets: [{
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    },
    label: 'Doughnut Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  barChart: {
    type: 'chart',
    content: {
      type: 'bar',
      data: {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [{
          label: 'Sales 2023',
          data: [65, 59, 80, 81, 56],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    label: 'Bar Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  lineChart: {
    type: 'chart',
    content: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Temperature',
          data: [12, 19, 15, 25, 22, 30],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    label: 'Line Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  pieChart: {
    type: 'chart',
    content: {
      type: 'pie',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
        datasets: [{
          label: 'Color Distribution',
          data: [30, 20, 15, 25, 10],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true
      }
    },
    label: 'Pie Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  doughnutChart: {
    type: 'chart',
    content: {
      type: 'doughnut',
      data: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{
          label: 'Device Usage',
          data: [60, 30, 10],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true
      }
    },
    label: 'Doughnut Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  },
  multiDatasetChart: {
    type: 'chart',
    content: {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Product A',
          data: [65, 59, 80, 81],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }, {
          label: 'Product B',
          data: [28, 48, 40, 19],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    },
    label: 'Multi Dataset Chart',
    group: 'charts',
    minWidth: 300,
    heightPerLine: 200
  }
}; 