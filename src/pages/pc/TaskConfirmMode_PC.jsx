import React, { useState, useEffect } from 'react';

export default function TaskConfirmMode_PC({ 
  historyList = [], 
  bookingList = [], 
  setPage, 
  facilityName, 
  user, 
  completeFacilityBooking 
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
  const todaySlash = todayStr.replace(/-/g, '/');
  
  // 🌟 今日のこの施設の完了実績
  const todaysWorkRaw = historyList.filter(h => 
    (h.date === todayStr || h.date === todaySlash) && h.facility === facilityName
  );

  // 🌟 今日の予約データから「キャンセル」の人を特定
  const todaysBookingData = bookingList.find(b => 
    b.facility === facilityName && (b.date || "").replace(/\//g, '-') === todayStr
  );
  const cancelMembers = todaysBookingData?.members?.filter(m => m.status === 'cancel') || [];
  
  const totalCount = (todaysWorkRaw.length + cancelMembers.length);

  const [sortBy, setSortBy] = useState("room"); 

  const sortedWork = [...todaysWorkRaw].sort((a, b) => {
    if (sortBy === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    if (sortBy === "name") return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
    return 0; 
  });

  const handleConfirmOK = () => {
    if (window.confirm('本日の業務記録を確定し、保存しますか？')) {
      if (typeof completeFacilityBooking === 'function') {
        completeFacilityBooking(facilityName);
      }
      alert('ご確認ありがとうございました。記録を確定しました。');
      // 管理者の場合は履歴画面へ、施設の場合はトップへ
      setPage(user?.role === 'barber' ? 'admin-history' : 'dashboard');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={contentCardStyle}>
        {/* --- ヘッダー --- */}
        <header style={headerStyle}>
          <div style={iconStyle}>📋</div>
          <h1 style={titleStyle}>本日の業務完了確認</h1>
          <p style={subTitleStyle}>施設担当者様と一緒に内容をご確認ください</p>
          
          <div style={facilityBadgeStyle}>
            <span style={{fontSize: '14px', color: '#64748b'}}>訪問先施設：</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a'}}>{facilityName} 様</span>
          </div>
        </header>

        {/* --- 集計エリア --- */}
        <div style={summaryGridStyle}>
          <div style={statBoxStyle('#10b981')}>
            <div style={statLabelStyle}>施術完了</div>
            <div style={statValueStyle}>{todaysWorkRaw.length} <small>名</small></div>
          </div>
          <div style={statBoxStyle('#ef4444')}>
            <div style={statLabelStyle}>当日キャンセル</div>
            <div style={statValueStyle}>{cancelMembers.length} <small>名</small></div>
          </div>
          <div style={statBoxStyle('#1e3a8a')}>
            <div style={statLabelStyle}>本日合計</div>
            <div style={statValueStyle}>{totalCount} <small>名</small></div>
          </div>
        </div>

        {/* --- 並べ替えコントロール --- */}
        <div style={controlRowStyle}>
          <span style={{fontSize: '14px', color: '#64748b'}}>表示順：</span>
          <div style={tabGroupStyle}>
            <button onClick={() => setSortBy('room')} style={tabBtnStyle(sortBy === 'room')}>部屋順</button>
            <button onClick={() => setSortBy('name')} style={tabBtnStyle(sortBy === 'name')}>名前順</button>
          </div>
        </div>

        {/* --- リストエリア --- */}
        <div style={listContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>状態</th>
                <th style={thStyle}>部屋</th>
                <th style={thStyle}>お名前</th>
                <th style={thStyle}>内容</th>
              </tr>
            </thead>
            <tbody>
              {/* 完了リスト */}
              {sortedWork.map((work, idx) => (
                <tr key={`done-${idx}`} style={trStyle}>
                  <td style={tdStyle}><span style={statusBadgeStyle('#10b981')}>完了</span></td>
                  <td style={tdStyle}>{work.room}</td>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{work.name} 様</td>
                  <td style={tdStyle}><span style={menuTextStyle}>{work.menu}</span></td>
                </tr>
              ))}

              {/* キャンセルリスト */}
              {cancelMembers.map((m, idx) => (
                <tr key={`cancel-${idx}`} style={{...trStyle, backgroundColor: '#fff1f2'}}>
                  <td style={tdStyle}><span style={statusBadgeStyle('#ef4444')}>欠席</span></td>
                  <td style={tdStyle}>{m.room}</td>
                  <td style={{...tdStyle, fontWeight: 'bold', color: '#e11d48'}}>{m.name} 様</td>
                  <td style={{...tdStyle, color: '#e11d48', fontSize: '13px'}}>当日キャンセル</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalCount === 0 && (
            <div style={emptyTextStyle}>本日の施術データは見つかりません</div>
          )}
        </div>

        {/* --- アクション --- */}
        <footer style={footerStyle}>
          <button onClick={() => setPage('task-input')} style={backBtnStyle}>← 入力画面に戻る</button>
          <button onClick={handleConfirmOK} style={confirmBtnStyle}>内容を確認しました（確定保存）</button>
        </footer>
      </div>
    </div>
  );
}

// --- スタイル定義 ---
const containerStyle = { padding: '40px 20px', minHeight: '100%', display: 'flex', justifyContent: 'center' };
const contentCardStyle = { width: '100%', maxWidth: '900px', backgroundColor: 'white', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '30px' };

const headerStyle = { textAlign: 'center' };
const iconStyle = { fontSize: '60px', marginBottom: '10px' };
const titleStyle = { fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 };
const subTitleStyle = { color: '#64748b', fontSize: '16px', marginTop: '10px' };
const facilityBadgeStyle = { marginTop: '20px', display: 'inline-block', padding: '10px 30px', backgroundColor: '#f8fafc', borderRadius: '50px', border: '1px solid #e2e8f0' };

const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' };
const statBoxStyle = (color) => ({ padding: '20px', borderRadius: '20px', border: `2px solid ${color}`, textAlign: 'center' });
const statLabelStyle = { fontSize: '14px', color: '#64748b', marginBottom: '5px' };
const statValueStyle = { fontSize: '32px', fontWeight: 'bold', color: '#1e293b' };

const controlRowStyle = { display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' };
const tabGroupStyle = { display: 'flex', gap: '5px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' };
const tabBtnStyle = (active) => ({ padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', backgroundColor: active ? 'white' : 'transparent', color: active ? '#1e3a8a' : '#64748b', boxShadow: active ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' });

const listContainerStyle = { flex: 1 };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '15px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px' };
const tdStyle = { padding: '15px', borderBottom: '1px solid #f8fafc', fontSize: '16px' };
const trStyle = { transition: '0.2s' };
const statusBadgeStyle = (color) => ({ backgroundColor: color, color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' });
const menuTextStyle = { backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' };
const emptyTextStyle = { textAlign: 'center', padding: '50px', color: '#94a3b8' };

const footerStyle = { display: 'flex', gap: '20px', marginTop: '20px' };
const backBtnStyle = { flex: 1, padding: '20px', borderRadius: '15px', border: '2px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' };
const confirmBtnStyle = { flex: 2, padding: '20px', borderRadius: '15px', border: 'none', backgroundColor: '#10b981', color: 'white', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(16,185,129,0.3)' };