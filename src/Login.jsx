import React from 'react';

export default function Login({ onLogin }) {
  const handleFormSubmit = (e) => {
    e.preventDefault(); 
    const id = document.getElementById('uid').value;
    const pw = document.getElementById('upw').value;
    onLogin(id, pw);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f7f4', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {/* 🌟 ロゴ・タイトルエリア */}
      <div style={{ marginBottom: '50px' }}>
        <h1 style={{ color: '#2d6a4f', fontSize: '40px', fontWeight: 'bold', margin: 0, letterSpacing: '2px' }}>SnipSnap</h1>
        <p style={{ color: '#52796f', fontSize: '15px', marginTop: '10px', fontWeight: 'bold' }}>訪問理美容予約・管理システム</p>
      </div>

      {/* 🌟 フォームエリア：幅を PC でも寂しくない 400px まで許容 */}
      <form 
        onSubmit={handleFormSubmit} 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          maxWidth: '400px', // 🌟 320pxから少し広げました
          width: '100%', 
          backgroundColor: 'white',
          padding: '40px 30px',
          borderRadius: '32px',
          boxShadow: '0 15px 35px rgba(45, 106, 79, 0.1)'
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <label style={labelStyle}>ログインID</label>
          <input id="uid" placeholder="admin / s1" style={inputStyle} required />
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <label style={labelStyle}>パスワード</label>
          <input id="upw" type="password" placeholder="••••••••" style={inputStyle} required />
        </div>
        
        <button type="submit" style={loginBtnStyle}>
          ログイン
        </button>
      </form>

      <p style={{ marginTop: '50px', fontSize: '12px', color: '#94b0a7', fontWeight: 'bold' }}>
        &copy; 2025 SnipSnap by Midote
      </p>
    </div>
  );
}

// 🎨 デザイン（ゆったり広幅に合わせて微調整）
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#2d6a4f', marginLeft: '5px', marginBottom: '8px', display: 'block' };
const inputStyle = { 
  width: '100%', 
  padding: '16px', 
  borderRadius: '16px', 
  border: '2px solid #e0efea', 
  boxSizing: 'border-box', 
  fontSize: '16px', 
  outline: 'none', 
  backgroundColor: '#f8fafc',
  transition: '0.2s'
};
const loginBtnStyle = { 
  width: '100%', 
  padding: '20px', 
  borderRadius: '18px', 
  border: 'none', 
  backgroundColor: '#2d6a4f', 
  color: 'white', 
  fontWeight: 'bold', 
  fontSize: '17px', 
  cursor: 'pointer', 
  boxShadow: '0 8px 20px rgba(45, 106, 79, 0.2)', 
  marginTop: '15px',
  transition: '0.2s'
};