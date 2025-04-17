import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import PDFEditor from './components/PDFEditor';
import Toolbar from './components/Toolbar';
import PDFProvider from './context/PDFContext';

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
          <Box sx={{ 
            display: 'flex', 
            height: '100vh', 
            width: '100vw',
            overflow: 'hidden'
          }}>
            {/* Sidebar */}
            <Box sx={{ 
              width: { xs: '250px', md: '300px' },
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              overflowY: 'auto'
            }}>
              <Toolbar />
            </Box>

            {/* Main Content */}
            <Box sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              width: { xs: 'calc(100% - 250px)', md: 'calc(100% - 300px)' }
            }}>
              <PDFEditor />
            </Box>
          </Box>
        </ThemeProvider>
      </DndProvider>
    </PDFProvider>
  );
}

export default App; 