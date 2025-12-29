import React from 'react';
import { Layout } from './Layout';

export default function AdminFacilityList({ facilityMaster, setPage }) {
  return (
    /* 🌟 修正ポイント：widthを100%にし、LayoutがMaxWidth 1000pxまで広がるようにしました */
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <header style={{ marginBottom: '25px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>全施設名簿マスター</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>契約施設の一覧とログイン情報の確認</p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {facilityMaster.map((f) => (
              <div key={f.id} style={facilityCardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{f.name}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                      <span style={idBadgeStyle}>ID: {f.id}</span>
                      <span style={pwBadgeStyle}>PW: {f.pw}</span>
                    </div>
                  </div>
                  <div style={statusBadgeStyle}>契約中</div>
                </div>
                
                <div style={infoContentStyle}>
                  <div style={infoItemStyle}>
                    <span style={iconStyle}>📍</span>
                    <span>{f.address}</span>
                  </div>
                  <div style={infoItemStyle}>
                    <span style={iconStyle}>📞</span>
                    <span>{f.tel}</span>
                  </div>
                </div>

                <div style={{ marginTop: '18px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => window.location.href = `tel:${f.tel}`} style={actionBtnStyle('#3b82f6')}>📞 電話をかける</button>
                  <button style={actionBtnStyle('#10b981')}>💬 LINE連携</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// 🎨 デザイン（ゆったり広幅に合わせて微調整）
const facilityCardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '24px', 
  padding: '24px', 
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
  borderLeft: '10px solid #3b82f6',
  transition: '0.2s'
};

const cardHeaderStyle = { 
  borderBottom: '2px solid #f8fafc', 
  paddingBottom: '15px', 
  marginBottom: '15px', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'flex-start' 
};

const idBadgeStyle = { 
  backgroundColor: '#eff6ff', 
  color: '#3b82f6', 
  fontSize: '12px', 
  padding: '4px 10px', 
  borderRadius: '8px', 
  fontWeight: 'bold' 
};

const pwBadgeStyle = { 
  backgroundColor: '#f1f5f9', 
  color: '#64748b', 
  fontSize: '12px', 
  padding: '4px 10px', 
  borderRadius: '8px', 
  fontWeight: 'bold' 
};

const statusBadgeStyle = {
  fontSize: '11px',
  color: '#10b981',
  backgroundColor: '#ecfdf5',
  padding: '4px 12px',
  borderRadius: '20px',
  fontWeight: 'bold'
};

const infoContentStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '10px',
  color: '#475569', 
  fontSize: '14px' 
};

const infoItemStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const iconStyle = { fontSize: '16px' };

const actionBtnStyle = (color) => ({ 
  flex: 1, 
  padding: '12px', 
  borderRadius: '14px', 
  border: `1.5px solid ${color}`, 
  backgroundColor: 'white', 
  color: color,
  fontSize: '13px', 
  cursor: 'pointer', 
  fontWeight: 'bold',
  transition: '0.2s'
});