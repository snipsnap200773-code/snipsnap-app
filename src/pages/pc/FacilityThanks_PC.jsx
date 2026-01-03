import React from 'react';

export default function FacilityThanks_PC({ setPage, user }) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* 🎉 祝・完了アイコン */}
        <div style={iconCircleStyle}>
          <span style={{ fontSize: '60px' }}>✉️</span>
        </div>

        <h1 style={titleStyle}>予約の送信が完了しました！</h1>
        
        <div style={messageBoxStyle}>
          <p style={textStyle}>
            {user?.name} 様、ご入力ありがとうございました。
          </p>
          <p style={textStyle}>
            予約内容が美容師へ送信されました。<br />
            スケジュールが確定するまで、しばらくお待ちください。
          </p>
        </div>

        <div style={dividerStyle}></div>

        <div style={nextActionStyle}>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
            現在の予約状況や進捗はこちらからご確認いただけます
          </p>
          <div style={btnGroupStyle}>
            <button 
              onClick={() => setPage('schedule')} 
              style={primaryBtnStyle}
            >
              📊 予約の状況・進捗を確認する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  height: '100%', 
  backgroundColor: '#f0f7f4' 
};

const cardStyle = { 
  backgroundColor: 'white', 
  padding: '60px 80px', 
  borderRadius: '40px', 
  textAlign: 'center', 
  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
  maxWidth: '700px',
  width: '90%'
};

const iconCircleStyle = {
  width: '120px',
  height: '120px',
  backgroundColor: '#eefcf4',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 30px',
  border: '2px solid #2d6a4f'
};

const titleStyle = { 
  fontSize: '28px', 
  fontWeight: 'bold', 
  color: '#2d6a4f',
  marginBottom: '20px'
};

const messageBoxStyle = {
  marginBottom: '40px'
};

const textStyle = { 
  fontSize: '16px', 
  color: '#475569', 
  lineHeight: '1.8',
  margin: '10px 0'
};

const dividerStyle = {
  height: '1px',
  backgroundColor: '#e2e8f0',
  width: '100%',
  margin: '40px 0'
};

const nextActionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const btnGroupStyle = {
  display: 'flex',
  gap: '20px'
};

const primaryBtnStyle = {
  padding: '18px 45px', // ボタンを少し大きくして目立たせました
  backgroundColor: '#2d6a4f',
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  fontWeight: 'bold',
  fontSize: '16px',
  cursor: 'pointer',
  boxShadow: '0 8px 15px rgba(45, 106, 79, 0.2)',
  transition: '0.3s'
};