import React from 'react';
import { Layout } from './Layout';

export default function FacilityInfo({ user, setPage }) {
  // 司令塔（App.jsx）から渡された user.details を使います
  const info = user?.details || {};

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <header style={{ marginBottom: '30px', textAlign: 'center', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f', margin: 0 }}>施設情報</h1>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>ご登録内容の確認</p>
          </header>

          <div style={infoCardStyle}>
            <div style={itemStyle}>
              <label style={labelStyle}>施設名</label>
              <div style={valueStyle}>{info.name || '未設定'}</div>
            </div>

            <div style={itemStyle}>
              <label style={labelStyle}>施設ID</label>
              <div style={valueStyle}>{info.id || '---'}</div>
            </div>

            <div style={itemStyle}>
              <label style={labelStyle}>所在地</label>
              <div style={valueStyle}>{info.address || '未設定'}</div>
            </div>

            <div style={itemStyle}>
              <label style={labelStyle}>電話番号</label>
              <div style={valueStyle}>{info.tel || '未設定'}</div>
            </div>

            <div style={{ ...itemStyle, borderBottom: 'none' }}>
              <label style={labelStyle}>ご利用状況</label>
              <div style={{ ...valueStyle, color: '#10b981', fontWeight: 'bold' }}>契約中</div>
            </div>
          </div>

          <div style={messageBoxStyle}>
            <p style={{ margin: 0, fontSize: '13px', color: '#52796f', lineHeight: '1.6' }}>
              ※登録情報の変更を希望される場合は、<br/>
              お電話または三土手まで直接ご連絡ください。
            </p>
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>
    </div>
  );
}

// 🎨 デザイン
const infoCardStyle = { backgroundColor: 'white', borderRadius: '28px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' };
const itemStyle = { padding: '15px 0', borderBottom: '1px solid #f1f5f9' };
const labelStyle = { display: 'block', fontSize: '12px', color: '#94b0a7', fontWeight: 'bold', marginBottom: '5px' };
const valueStyle = { fontSize: '17px', color: '#2d6a4f', fontWeight: '500' };
const messageBoxStyle = { marginTop: '30px', padding: '20px', backgroundColor: '#eefcf4', borderRadius: '20px', border: '1px dashed #2d6a4f', textAlign: 'center' };