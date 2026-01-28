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
    marginBottom: '12px',
    display: 'block'
  });

  // 🌟 PC版サイドバーと同じ順序に整理しました
  const menus = [
    { title: 'あつまれ綺麗にしたい人', sub: '（名簿管理）', color: '#76c893', action: () => setPage('list') },
    { title: 'キープ！この日とった！', sub: '（訪問日先取り）', color: '#b5e48c', action: () => setPage('keep-date') },
    { title: 'これで決まり！予約確定！', sub: '（キープから予約へ）', color: '#52b69a', action: () => setPage('confirm') },
    { title: '掲示用名簿をプリント', sub: '（フロア貼り出し用）', color: '#f59e0b', action: () => setPage('print-list') }, // 🌟 ここへ移動
    { title: '予約の状況・進捗', sub: '（予約確定日と状況）', color: '#34a0a4', action: () => setPage('schedule') },
    { title: '過去の訪問記録', sub: '（あの頃君は…）', color: '#1a759f', action: () => setPage('history') },
    { title: '請求・領収書発行', sub: '（履歴から書類作成）', color: '#d946ef', action: () => setPage('facility-invoice') },
  ];

  // 🌟 ログアウト処理
  const handleLogoutClick = () => {
    if (window.confirm('ログアウトしてログイン画面に戻りますか？')) {
      localStorage.removeItem('saved_user');
      window.location.reload();
    }
  };

  return (
    <div style={{ backgroundColor: '#f9f7f5', minHeight: '100vh', width: '100%', position: 'relative', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' }}>
      
      <Layout>
        <div style={containerStyle}>
          <header style={{ textAlign: 'center', marginBottom: '30px', paddingTop: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#4a3728', margin: 0, letterSpacing: '2px' }}>SnipSnap</h1>
            <div style={{ marginTop: '15px' }}>
              <span style={facilityNameBadgeStyle}>
                🏠 {user?.name || '施設'} 様
              </span>
            </div>
          </header>

          <nav style={{ width: '100%', marginTop: '20px' }}>
            {menus.map((menu, index) => (
              <button 
                key={index} 
                onClick={menu.action} 
                style={menuBtnStyle(menu.color)}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#4a3728' }}>
                  {menu.title}
                </div>
                {menu.sub && (
                  <div style={{ fontSize: '12px', color: '#7a6b5d', marginTop: '4px', fontWeight: 'bold' }}>
                    {menu.sub}
                  </div>
                )}
              </button>
            ))}

            {/* 💡 使い方ガイド */}
            <button 
              onClick={() => setPage('manual')}
              style={{ ...menuBtnStyle('#ed8936'), backgroundColor: '#fffaf0' }}
            >
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#c05621' }}>
                💡 使い方ガイド
              </div>
              <div style={{ fontSize: '12px', color: '#dd6b20', marginTop: '4px', fontWeight: 'bold' }}>
                （操作に困ったときはここ）
              </div>
            </button>

            {/* 🚪 ログアウトボタン */}
            <button 
              onClick={handleLogoutClick}
              style={logoutBtnStyle}
            >
              🚪 ログアウト
            </button>
          </nav>

          <p style={{ fontSize: '11px', color: '#a39081', marginTop: '30px', textAlign: 'center', fontWeight: 'bold' }}>
            © 2026 SnipSnap System
          </p>
        </div>
      </Layout>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '90vh', 
  padding: '0 20px 60px 20px'
};

const facilityNameBadgeStyle = {
  backgroundColor: '#fdfcfb',
  color: '#4a3728',
  padding: '8px 20px',
  borderRadius: '24px',
  fontSize: '15px',
  fontWeight: '900',
  border: '2px solid #e0d6cc',
  display: 'inline-block',
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
};

const logoutBtnStyle = {
  width: '100%',
  marginTop: '30px',
  padding: '18px',
  backgroundColor: 'transparent',
  border: '2px solid #fca5a5',
  borderRadius: '20px',
  color: '#e53e3e',
  fontSize: '16px',
  fontWeight: '900',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px'
};