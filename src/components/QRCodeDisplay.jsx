// src/components/QRCodeDisplay.jsx
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeDisplay = ({ url }) => {
  return (
    <div>
      <h3>このQRコードでゲームにアクセス！</h3>
     <QRCodeCanvas value={url} size={256} />
    </div>
  );
};


const styles = {
  container: {
    textAlign: 'center',
    marginTop: '20px',
  },
  title: {
    fontSize: '20px',
    color: '#333',
  },
  urlText: {
    marginTop: '10px',
    fontSize: '16px',
    color: '#666',
  },
};

export default QRCodeDisplay;
