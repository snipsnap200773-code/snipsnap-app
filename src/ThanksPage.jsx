import React from 'react';
import { Layout } from './Layout';

export default function ThanksPage({ setPage }) {
  return (
    /* 🌟 修正：flexを使って、PCでもスマホでも上下左右の真ん中にビシッと配置します */
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f0f7f4' 
    }}>
      <Layout>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          {/* 🌟 動きのあるチェックマーク */}
          <div style={{ 
            fontSize: '100px', 
            marginBottom: '30px', 
            filter: 'drop-shadow(0 10px 20px rgba(45, 106, 79, 0.1))'
          }}>
            ✅
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d6a4f', marginBottom: '16px' }}>
            ご依頼受け付けました！
          </h1>

          <p style={{ color: '#52796f', marginBottom: '50px', lineHeight: '1.8', fontSize: '16px', fontWeight: 'bold' }}>
            美容師が訪問の準備を整えます。<br/>
            内容の確認は「予約・訪問の確認」から<br/>
            いつでも行えます。
          </p>
          
          <button 
            onClick={() => setPage('menu')} 
            style={backToMenuBtnStyle}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            メニューTOPへ戻る
          </button>

          <p style={{ marginTop: '40px', fontSize: '11px', color: '#94b0a7', fontWeight: 'bold' }}>
            © 2025 SnipSnap by Midote
          </p>
        </div>
      </Layout>
    </div>
  );
}

// 🎨 デザインパーツ
const backToMenuBtnStyle = {
  backgroundColor: '#2d6a4f', 
  color: 'white', 
  border: 'none',
  padding: '22px 80px', // 🌟 ボタンを少しゆったりさせました
  borderRadius: '40px', 
  fontWeight: 'bold', 
  fontSize: '19px',
  cursor: 'pointer',
  boxShadow: '0 10px 25px rgba(45, 106, 79, 0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  maxWidth: '400px',
  width: '100%'
};