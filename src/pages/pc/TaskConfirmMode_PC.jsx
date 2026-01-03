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

  // 🌟 モバイル版の成功ロジックをそのまま移植
  // 「今日」の日付を予約リスト(bookingList)から直接特定する
  const targetBooking = bookingList.find(b => {
    const bDate = (b.date || "").replace(/-/g, '/'); // 2026/01/01 形式に統一
    const d = new Date();
    const todayStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    return b.facility === facilityName && bDate === todayStr;
  });

  // 予約データのメンバー状態を正解とする
  const currentMembers = targetBooking?.members || [];
  const doneMembers = currentMembers.filter(m => m.status === 'done');
  const cancelMembers = currentMembers.filter(m => m.status === 'cancel');
  
  const totalCount = doneMembers.length + cancelMembers.length;

  const [sortBy, setSortBy] = useState("room"); 

  // 表示用リストの並び替え
  const sortedWork = [...doneMembers].sort((a, b) => {
    if (sortBy === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    if (sortBy === "name") return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
    return 0; 
  });

  // 🌟【修正箇所】ボタンを押した時の処理
  const handleConfirmOK = () => {
    // 🌟 モバイル版と同じく、単純に完了関数を呼び出すだけにする（削除命令をここで出さない）
    if (typeof completeFacilityBooking === 'function') {
      completeFacilityBooking(facilityName);
    }
    alert('ご確認ありがとうございました。本日の業務記録を確定しました。');
    // 確定後、管理者は履歴画面へ移動
    setPage(user?.role === 'barber' ? 'admin-history' : 'dashboard');
  };

  return (
    <div style={containerStyle}>
      <div style={contentCardStyle}>
        <header style={headerStyle}>
          <div style={iconStyle}>📋</div>
          <h1 style={titleStyle}>本日の業務完了確認 (PC)</h1>
          <p style={subTitleStyle}>施設担当者様と一緒に内容をご確認ください</p>
          
          <div style={facilityBadgeStyle}>
            <span style={{fontSize: '14px', color: '#64748b'}}>訪問先施設：</span>
            <span style={{fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a'}}>{facilityName} 様</span>
          </div>
        </header>

        {/* 集計エリア */}
        <div style={summaryGridStyle}>
          <div style={statBoxStyle('#10b981')}>
            <div style={statLabelStyle}>施術完了</div>
            <div style={statValueStyle}>{doneMembers.length} <small>名</small></div>
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

        {/* 並べ替えコントロール */}
        <div style={controlRowStyle}>
          <span style={{fontSize: '14px', color: '#64748b'}}>表示順：</span>
          <div style={tabGroupStyle}>
            <button onClick={() => setSortBy('room')} style={tabBtnStyle(sortBy === 'room')}>部屋順</button>
            <button onClick={() => setSortBy('name')} style={tabBtnStyle(sortBy === 'name')}>名前順</button>
          </div>
        </div>

        {/* リストエリア */}
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
              {sortedWork.map((m, idx) => (
                <tr key={`done-${idx}`} style={trStyle}>
                  <td style={tdStyle}><span style={statusBadgeStyle('#10b981')}>完了</span></td>
                  <td style={tdStyle}>{m.room}</td>
                  <td style={{...tdStyle, fontWeight: 'bold'}}>{m.name} 様</td>
                  <td style={tdStyle}><span style={menuTextStyle}>{(m.menus || ["カット"]).join(' / ')}</span></td>
                </tr>
              ))}
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

        {/* アクション */}
        <footer style={footerStyle}>
          <button onClick={() => setPage('task')} style={backBtnStyle}>← 入力画面に戻る</button>
          <button onClick={handleConfirmOK} style={confirmBtnStyle}>内容を確認しました（確定保存）</button>
        </footer>
      </div>
    </div>
  );
}

// --- スタイル定義 (以前のPC版のデザインを維持) ---
const containerStyle = { padding: '40px 20px', minHeight: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#f0f7f4' };
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
const tabGroupStyle = { display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' };
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