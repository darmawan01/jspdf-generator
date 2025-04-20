import React, { useState, useEffect, useRef } from 'react';
import { Box, Popover, Slider, TextField, Typography } from '@mui/material';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, label }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [currentColor, setCurrentColor] = useState(color);
  const [opacity, setOpacity] = useState(100);
  const colorBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parse initial color to set opacity
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        setOpacity(parseFloat(match[4]) * 100);
      }
    }
    setCurrentColor(color);
  }, [color]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setCurrentColor(newColor);
    
    // Convert hex to rgba if opacity is less than 100
    if (opacity < 100) {
      const rgba = hexToRgba(newColor, opacity / 100);
      onChange(rgba);
    } else {
      onChange(newColor);
    }
  };

  const handleOpacityChange = (_: Event, newValue: number | number[]) => {
    const opacityValue = newValue as number;
    setOpacity(opacityValue);
    
    // Convert current color to rgba
    const rgba = hexToRgba(currentColor, opacityValue / 100);
    onChange(rgba);
  };

  // Helper function to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Helper function to get display color
  const getDisplayColor = () => {
    if (currentColor.startsWith('rgba')) {
      return currentColor;
    }
    return opacity < 100 ? hexToRgba(currentColor, opacity / 100) : currentColor;
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      {label && (
        <Typography variant="caption" display="block" gutterBottom>
          {label}
        </Typography>
      )}
      <Box
        ref={colorBoxRef}
        onClick={handleClick}
        sx={{
          width: '100%',
          height: '32px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          background: `linear-gradient(45deg, #ccc 25%, transparent 25%),
                      linear-gradient(-45deg, #ccc 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #ccc 75%),
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
          backgroundSize: '10px 10px',
          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
          position: 'relative',
          '&:hover': {
            borderColor: '#999'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: getDisplayColor(),
            borderRadius: '3px'
          }}
        />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        disablePortal
        container={anchorEl?.parentElement}
        slotProps={{
          paper: {
            sx: {
              boxShadow: 3,
              mt: 1
            }
          }
        }}
      >
        <Box sx={{ p: 2, width: 250, bgcolor: 'background.paper' }}>
          <Box sx={{ mb: 2 }}>
            <input
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              style={{ width: '100%', height: '40px' }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" gutterBottom>
              Opacity: {opacity}%
            </Typography>
            <Slider
              value={opacity}
              onChange={handleOpacityChange}
              min={0}
              max={100}
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
          </Box>
          <TextField
            fullWidth
            size="small"
            value={getDisplayColor()}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Color value"
          />
        </Box>
      </Popover>
    </Box>
  );
};

export default ColorPicker; 