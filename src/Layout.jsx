import React from 'react';

export const Layout = ({ children }) => (
  <div style={{ 
    width: '92%',
    // 🌟 ここを 450px から 1000px に広げました！
    // これでPC画面でも1枚目の写真のようにゆったり表示されます。
    maxWidth: '1000px', 
    margin: '0 auto',  
    padding: '20px 0 120px 0', 
    boxSizing: 'border-box'
  }}>
    {children}
  </div>
);

export const Footer = () => null;