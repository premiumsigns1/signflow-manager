import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { JobsProvider } from './context/JobsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <JobsProvider>
          <App />
        </JobsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
