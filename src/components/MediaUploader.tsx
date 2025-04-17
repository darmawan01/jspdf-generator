import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChartData } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';

interface MediaUploaderProps {
  type: 'image' | 'chart';
  onComplete: (content: string | ChartData) => void;
  onCancel: () => void;
}

interface ChartDataPoint {
  x: string;
  y: number;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ type, onComplete, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([
    { x: '', y: 0 },
    { x: '', y: 0 },
    { x: '', y: 0 }
  ]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChartDataChange = (index: number, field: 'x' | 'y', value: string) => {
    const newData = [...chartData];
    newData[index] = {
      ...newData[index],
      [field]: field === 'y' ? Number(value) : value
    };
    setChartData(newData);
  };

  const addDataPoint = () => {
    setChartData([...chartData, { x: '', y: 0 }]);
  };

  const removeDataPoint = (index: number) => {
    if (chartData.length > 2) {
      const newData = chartData.filter((_, i) => i !== index);
      setChartData(newData);
    }
  };

  const handleComplete = () => {
    if (type === 'image' && imagePreview) {
      onComplete(imagePreview);
    } else if (type === 'chart') {
      const chartDataConfig: ChartData = {
        labels: chartData.map(point => point.x),
        datasets: [{
          label: 'Data',
          data: chartData.map(point => point.y),
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1
        }]
      };
      onComplete(chartDataConfig);
    }
  };

  const renderChartPreview = () => {
    const chartProps = {
      data: {
        labels: chartData.map(point => point.x),
        datasets: [{
          label: 'Preview',
          data: chartData.map(point => point.y),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    };

    switch (chartType) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
    }
  };

  return (
    <Dialog open={true} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {type === 'image' ? 'Upload Image' : 'Configure Chart'}
      </DialogTitle>
      <DialogContent>
        {type === 'image' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            <Button variant="contained" component="label">
              Choose Image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 2, maxHeight: 300, overflow: 'hidden' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'pie')}
                label="Chart Type"
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chartData.map((point, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    label="Label"
                    value={point.x}
                    onChange={(e) => handleChartDataChange(index, 'x', e.target.value)}
                    size="small"
                  />
                  <TextField
                    label="Value"
                    type="number"
                    value={point.y}
                    onChange={(e) => handleChartDataChange(index, 'y', e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => removeDataPoint(index)}
                    disabled={chartData.length <= 2}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button variant="outlined" onClick={addDataPoint}>
                Add Data Point
              </Button>
            </Box>

            <Box sx={{ height: 300, mt: 2 }}>
              {renderChartPreview()}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          disabled={type === 'image' ? !imagePreview : false}
        >
          {type === 'image' ? 'Upload' : 'Create Chart'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaUploader; 