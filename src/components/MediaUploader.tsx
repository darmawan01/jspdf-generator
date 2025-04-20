import React, { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Tab, Tabs } from '@mui/material';
import { ChartConfiguration } from 'chart.js';

interface MediaUploaderProps {
  type: 'image' | 'chart';
  onComplete: (content: string | ChartConfiguration) => void;
  onCancel: () => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ type, onComplete, onCancel }) => {
  const [tab, setTab] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [chartConfig, setChartConfig] = useState<ChartConfiguration | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChartConfigChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const config = JSON.parse(event.target.value);
      setChartConfig(config);
    } catch (error) {
      console.error('Invalid chart configuration:', error);
    }
  };

  const handleComplete = () => {
    if (type === 'image' && imageUrl) {
      onComplete(imageUrl);
    } else if (type === 'chart' && chartConfig) {
      onComplete(chartConfig);
    }
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {type === 'image' ? 'Upload Image' : 'Configure Chart'}
      </DialogTitle>
      <DialogContent>
        {type === 'image' ? (
          <Box sx={{ p: 2 }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ marginBottom: '16px' }}
            />
            {imageUrl && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Tabs value={tab} onChange={handleTabChange}>
              <Tab label="JSON Configuration" />
              <Tab label="Chart Preview" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
              {tab === 0 ? (
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    fontFamily: 'monospace',
                    padding: '8px'
                  }}
                  placeholder="Paste chart configuration JSON here..."
                  onChange={handleChartConfigChange}
                />
              ) : (
                <Box sx={{ height: '300px' }}>
                  {/* Add chart preview here */}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={handleComplete}
          variant="contained"
          disabled={type === 'image' ? !imageUrl : !chartConfig}
        >
          {type === 'image' ? 'Upload' : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaUploader; 