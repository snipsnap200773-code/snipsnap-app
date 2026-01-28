import React from 'react';

export default function FacilityThanks_PC({ setPage, user }) {
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* 🎉 祝・完了アイコン（アンティークな封筒をイメージ） */}
        <div style={iconCircleStyle}>
          <span style={{ fontSize: '80px' }}>✉️</span>
        </div>

        <h1 style={titleStyle}>予約の送信が完了しました！</h1>
        
        <div style={messageBoxStyle}>
          <p style={userNameTextStyle}>
            {user?.name} 様
          </p>
          <p style={mainTextStyle}>
            ご入力ありがとうございました。
          </p>
          <p style={subTextStyle}>
            予約内容が美容師へ送信されました。<br />
            スケジュールが確定するまで、しばらくお待ちください。
          </p>
        </div>

        <div style={dividerStyle}></div>

        <div style={nextActionStyle}>
          <p style={guideTextStyle}>
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

// 🎨 デザインスタイル（文字特大・アンティーク調）
const containerStyle = { 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  height: '100%', 
  backgroundColor: '#f9f7f5' // 落ち着いたベージュ背景
};

const cardStyle = { 
  backgroundColor: 'white', 
  padding: '80px 100px', 
  borderRadius: '50px', 
  textAlign: 'center', 
  boxShadow: '0 30px 60px rgba(74, 55, 40, 0.12)',
  maxWidth: '850px',
  width: '90%',
  border: '1px solid #e2d6cc'
};

const iconCircleStyle = {
  width: '160px',
  height: '160px',
  backgroundColor: '#fdfcfb',
  borderRadius: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '0 auto 40px',
  border: '3px solid #e0d6cc',
  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)'
};

const titleStyle = { 
  fontSize: '36px', 
  fontWeight: '900', 
  color: '#4a3728', // 落ち着いたこげ茶
  marginBottom: '30px',
  letterSpacing: '0.05em'
};

const messageBoxStyle = {
  marginBottom: '50px'
};

const userNameTextStyle = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#5d4037',
  marginBottom: '10px'
};

const mainTextStyle = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#2d6a4f', // 完了をイメージする深緑
  marginBottom: '20px'
};

const subTextStyle = { 
  fontSize: '20px', 
  color: '#7a6b5d', 
  lineHeight: '1.8',
  margin: '10px 0',
  fontWeight: '500'
};

const dividerStyle = {
  height: '2px',
  backgroundColor: '#f2ede9',
  width: '80%',
  margin: '40px auto'
};

const nextActionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const guideTextStyle = {
  fontSize: '18px',
  color: '#94a3b8',
  marginBottom: '25px',
  fontWeight: 'bold'
};

const btnGroupStyle = {
  display: 'flex',
  gap: '20px'
};

const primaryBtnStyle = {
  padding: '25px 60px',
  backgroundColor: '#4a3728', // メインカラーのこげ茶
  color: 'white',
  border: 'none',
  borderRadius: '25px',
  fontWeight: '900',
  fontSize: '22px', // ボタン文字も特大
  cursor: 'pointer',
  boxShadow: '0 10px 25px rgba(74, 55, 40, 0.3)',
  transition: '0.3s'
};