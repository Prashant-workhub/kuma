import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { ThemeProvider } from './theme/theme.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* ThemeProvider is mounted at the very root so Login, Admin, Trainer
          and Trainee all read and write one persisted preference. */}
      <ThemeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

