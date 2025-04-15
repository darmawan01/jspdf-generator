import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PDFEditor from './components/PDFEditor';
import Toolbar from './components/Toolbar';
import { PDFProvider } from './context/PDFContext';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <PDFProvider>
      <DndProvider backend={HTML5Backend}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ height: '100vh', display: 'flex', width: '100vw' }}>
            <Box sx={{ width: '300px', borderRight: 1, borderColor: 'divider' }}>
              <Toolbar />
            </Box>
            <Box sx={{ width: 'calc(100vw - 300px)' }}>
              <PDFEditor />
            </Box>
          </Box>
        </ThemeProvider>
      </DndProvider>
    </PDFProvider>
  );
}

export default App; 