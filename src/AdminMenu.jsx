import React, { useEffect } from 'react'; // 🌟 useEffectを追加
import { Layout } from './Layout';

export default function AdminMenu({ setPage, setActiveFacility, dbFacilities }) {
  
  // 🌟 画面が表示された瞬間に一番上にスクロールさせる
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 🌟 メインメニュー
  const adminMenus = [
    { id: 'task', title: '今日のタスク💪', sub: 'みんなをキレイにするぞ', color: '#1e3a8a' },
    { id: 'admin-reserve', title: '予約が入ったよ✨', sub: '全施設の予約状況・キャンセル', color: '#3b82f6' },
    { id: 'admin-ng', title: 'スケジュール管理', sub: '〇か✕', color: '#60a5fa' },
    { id: 'admin-facility-list', title: '全施設名簿マスター', sub: '連絡先・ログイン情報の確認', color: '#93c5fd' },
    { id: 'master-user-list', title: 'みんなの情報', sub: '全施設の入居者情報の編集・削除', color: '#64748b' },
    { id: 'admin-history', title: '過去の利用履歴', sub: '施設ごとの訪問実績', color: '#1d4ed8' },
    { id: 'invoice', title: '請求書管理', sub: '施術データから請求書発行', color: '#1e40af' },
    { id: 'dashboard', title: '売上分析ボード', sub: '今月の売上・施設別シェアを可視化', color: '#10b981' },
  ];

  // 🌟 施設名を「あいうえお順」に並べ替え
  const sortedFacilities = [...dbFacilities].sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <Layout>
        <div style={{ padding: '20px 0' }}>
          <header style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: 0, letterSpacing: '1px' }}>SnipSnap Admin</h1>
            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', marginTop: '5px' }}>管理者：三土手さん</p>
          </header>

          {/* メインメニューグリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
            {adminMenus.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', padding: '18px 15px',
                  backgroundColor: 'white', border: 'none', borderRadius: '24px',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.06)', borderTop: `8px solid ${item.color}`,
                  cursor: 'pointer', textAlign: 'left', minHeight: '120px'
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>{item.title}</span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '8px' }}>{item.sub}</span>
              </button>
            ))}
          </div>

          {/* 🌟 印刷セクション */}
          <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>🖨️ 現場用リスト印刷（あいうえお順）</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {sortedFacilities.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => {
                    setActiveFacility(fac.name);
                    setPage('admin-print-today');
                  }}
                  style={printBtnStyle}
                >
                  {fac.name}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem('saved_user');
              window.location.reload();
            }} 
            style={{ 
              width: '100%', padding: '18px', borderRadius: '16px', 
              border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#ef4444', 
              fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' 
            }}
          >
            管理者ログアウト
          </button>
        </div>
      </Layout>
    </div>
  );
}

const printBtnStyle = {
  padding: '12px 8px', borderRadius: '12px', border: '1px solid #e0f2fe',
  backgroundColor: '#f8fafc', color: '#1e3a8a', fontSize: '12px', fontWeight: 'bold',
  cursor: 'pointer', textAlign: 'center'
};