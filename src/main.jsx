import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store/StoreProvider.jsx';
import './styles/theme.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
