import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ★★ 開発中に StrictMode を外すことで、二重実行による素材の分身などを防ぎやすい ★★
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
