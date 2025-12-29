import React, { useState } from 'react';
import { Layout } from './Layout';

export default function TaskConfirmMode({ 
  historyList, 
  setPage, 
  facilityName, 
  user, 
  completeFacilityBooking // 🌟 App.jsxから受け取った消去指令
}) {
  // 今日の日付を取得 (表示用)
  const today = new Date().toLocaleDateString('ja-JP').replace(/\//g, '/');
  const todayISO = new Date().toLocaleDateString('sv-SE');
  
  // 今日のこの施設の実績だけを抽出
  const todaysWorkRaw = historyList.filter(h => 
    (h.date === today || h.date === todayISO) && h.facility === facilityName
  );
  
  const [sortBy, setSortBy] = useState("time"); 

  // 🌟 並べ替えロジック
  const sortedWork = [...todaysWorkRaw].sort((a, b) => {
    if (sortBy === "room") return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
    if (sortBy === "name") {
      const valA = a.kana || a.name;
      const valB = b.kana || b.name;
      return valA.localeCompare(valB, 'ja');
    }
    return 0; 
  });

  const handleConfirmOK = () => {
    // 🌟 1. 現場の作業メモ（localStorage）を綺麗にする
    localStorage.removeItem(`snipsnap_tasks_${facilityName}`);
    localStorage.removeItem('snipsnap_extra_members'); // 当日追加分もリセット
    
    // 🌟 2. 司令塔（App.jsx）に「この施設の今日の予約を消して」と命じる
    if (typeof completeFacilityBooking === 'function') {
      completeFacilityBooking(facilityName);
    }
    
    alert('ご確認ありがとうございました。本日の業務記録を確定しました。');
    
    // 🌟 3. 自分の役割に合わせて次の画面へ
    if (user && user.role === 'barber') {
      setPage('admin-history'); 
    } else {
      setPage('history');
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ padding: '20px', paddingTop: '40px', paddingBottom: '140px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>📋</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>本日の業務完了確認</h1>
            <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>施設担当者様と一緒に内容をご確認ください</p>
          </div>

          {/* 並べ替えスイッチ */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <button onClick={() => setSortBy('room')} style={{...sortBtnMini, backgroundColor: sortBy==='room'?'#1e3a8a':'white', color: sortBy==='room'?'white':'#1e3a8a'}}>部屋順</button>
            <button onClick={() => setSortBy('name')} style={{...sortBtnMini, backgroundColor: sortBy==='name'?'#1e3a8a':'white', color: sortBy==='name'?'white':'#1e3a8a'}}>名前順</button>
            <button onClick={() => setSortBy('time')} style={{...sortBtnMini, backgroundColor: sortBy==='time'?'#1e3a8a':'white', color: sortBy==='time'?'white':'#1e3a8a'}}>終了順</button>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryHeaderStyle}>
              <span>{facilityName} 様</span>
              <span>合計 {sortedWork.length} 名</span>
            </div>
            {sortedWork.length > 0 ? sortedWork.map((work, idx) => (
              <div key={idx} style={rowStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={roomLabelStyle}>{work.room}</span>
                  <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#334155' }}>{work.name} 様</span>
                </div>
                <div style={menuBadgeStyle}>{work.menu}</div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                本日の完了データが見つかりません
              </div>
            )}
          </div>

          <div style={footerAreaStyle}>
            <button onClick={handleConfirmOK} style={okBtnStyle}>
              内容を確認しました（OK）
            </button>
          </div>
          
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('task')}>←</button>
    </div>
  );
}

// 🎨 デザイン設定
const sortBtnMini = { flex: 1, padding: '12px 5px', borderRadius: '12px', border: '1px solid #1e3a8a', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const summaryCardStyle = { backgroundColor: 'white', borderRadius: '28px', padding: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' };
const summaryHeaderStyle = { backgroundColor: '#f8fafc', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#64748b', fontSize: '14px', borderBottom: '1px solid #edf2f7' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' };
const roomLabelStyle = { fontSize: '12px', backgroundColor: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', marginRight: '10px', fontWeight: 'bold' };
const menuBadgeStyle = { color: '#10b981', fontWeight: 'bold', fontSize: '15px', backgroundColor: '#ecfdf5', padding: '4px 12px', borderRadius: '10px' };
const footerAreaStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', backgroundColor: 'rgba(240, 247, 244, 0.9)', backdropFilter: 'blur(10px)' };
const okBtnStyle = { width: '100%', padding: '22px', borderRadius: '22px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '20px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)', cursor: 'pointer' };