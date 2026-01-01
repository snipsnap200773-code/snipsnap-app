import React from 'react';
import { Layout } from './Layout';

export default function Menu({ setPage, user }) {
  // ボタンのスタイル定義
  const menuBtnStyle = (color) => ({
    width: '100%', 
    backgroundColor: 'white', 
    border: 'none', 
    borderRadius: '20px', 
    padding: '18px 20px',
    textAlign: 'left', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)', 
    borderLeft: `10px solid ${color}`, 
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    marginBottom: '12px' 
  });

  const menus = [
    { title: 'あつまれ綺麗にしたい人', sub: '（名簿管理）', color: '#76c893', action: () => setPage('list') },
    { title: 'キープ！この日とった！', sub: '（訪問日先取り）', color: '#b5e48c', action: () => setPage('keep-date') },
    { title: 'これで決まり！予約確定！', sub: '（キープから予約へ）', color: '#52b69a', action: () => setPage('confirm') },
    { title: '予約の状況・進捗', sub: '（予約確定日と状況）', color: '#34a0a4', action: () => setPage('schedule') },
    { title: '過去の訪問記録', sub: '（あの頃君は…）', color: '#1a759f', action: () => setPage('history') },
    { title: '掲示用名簿をプリント', sub: '（フロア貼り出し用）', color: '#f59e0b', action: () => setPage('print-list') },
    // 🌟 請求・領収書発行を最後に配置
    { title: '請求・領収書発行', sub: '（履歴から書類作成）', color: '#d946ef', action: () => setPage('facility-invoice') },
  ];

  return (
    <div style={{ backgroundColor: '#f0f7f4', minHeight: '100vh', width: '100%', position: 'relative' }}>
      <button 
        onClick={() => window.location.reload()} 
        style={topRightLogoutStyle}
      >
        ログアウト
      </button>

      <Layout>
        <div style={containerStyle}>
          <header style={{ textAlign: 'center', marginBottom: 'auto', paddingTop: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2d6a4f', margin: 0, letterSpacing: '1px' }}>SnipSnap</h1>
            <div style={{ marginTop: '10px' }}>
              <span style={facilityNameBadgeStyle}>
                🏠 {user?.name || '施設'} 様
              </span>
            </div>
          </header>

          <nav style={{ width: '100%', marginTop: '40px' }}>
            {menus.map((menu, index) => (
              <button 
                key={index} 
                onClick={menu.action} 
                style={menuBtnStyle(menu.color)}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d6a4f' }}>
                  {menu.title}
                </div>
                {menu.sub && (
                  <div style={{ fontSize: '12px', color: '#74a08f', marginTop: '4px' }}>
                    {menu.sub}
                  </div>
                )}
              </button>
            ))}
          </nav>

          <p style={{ fontSize: '11px', color: '#94b0a7', marginTop: '20px', textAlign: 'center' }}>
            © 2025 SnipSnap System
          </p>
        </div>
      </Layout>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end', 
  minHeight: '90vh', 
  padding: '0 20px 40px 20px'
};

const topRightLogoutStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  padding: '8px 16px',
  color: '#e53e3e',
  border: '1px solid #fed7d7',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  zIndex: 10,
  boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
};

const facilityNameBadgeStyle = {
  backgroundColor: '#dcfce7',
  color: '#2d6a4f',
  padding: '6px 16px',
  borderRadius: '24px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: '1.5px solid #76c893',
  display: 'inline-block'
};