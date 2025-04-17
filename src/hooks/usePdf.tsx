import { useContext } from 'react';
import { PDFContext } from '../context/types';

export const usePDFContext = () => {
    const context = useContext(PDFContext);
    if (!context) {
      throw new Error('usePDFContext must be used within a PDFProvider');
    }
    return context;
  };