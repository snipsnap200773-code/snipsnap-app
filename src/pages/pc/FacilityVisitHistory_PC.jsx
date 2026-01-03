import React, { useState } from 'react';

export default function FacilityVisitHistory_PC({ historyList = [], bookingList = [], user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVisitKey, setSelectedVisitKey] = useState(null); 
  const [detailSortBy, setDetailSortBy] = useState("room"); 

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedVisitKey(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthKey = `${year}/${month.toString().padStart(2, '0')}`;

  // 🌟 この施設だけのデータを抽出し、日付ごとに集計
  const monthlyVisits = historyList
    .filter(item => item.facility === user?.name && item.date.startsWith(monthKey))
    .reduce((acc, h) => {
      const key = `${h.date}-${h.facility}`;
      if (!acc[key]) {
        acc[key] = {
          date: h.date, facility: h.facility, count: 0, members: []
        };
      }
      acc[key].members.push(h);
      acc[key].count += 1;
      return acc;
    }, {});

  const visitList = Object.values(monthlyVisits).sort((a, b) => b.date.localeCompare(a.date));
  const currentVisit = visitList.find(v => `${v.date}-${v.facility}` === selectedVisitKey);

  // 欠席（キャンセル）メンバーの特定
  const cancelMembers = (() => {
    if (!currentVisit) return [];
    const targetDateISO = currentVisit.date.replace(/\//g, '-');
    const bookingForDay = bookingList.find(b => b.date === targetDateISO && b.facility === user?.name);
    return bookingForDay?.members?.filter(m => m.status === 'cancel') || [];
  })();

  const getSortedMembers = (members) => {
    return [...members].sort((a, b) => {
      if (detailSortBy === "room") {
        return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
      }
      return (a.kana || a.name || "").localeCompare(b.kana || b.name || "", 'ja');
    });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>📜 過去の訪問実績</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>施設内での施術実績と欠席状況を確認できます</p>
        </div>
        <div style={monthNavStyle}>
          <button onClick={() => changeMonth(-1)} style={monthBtnStyle}>◀ 前月</button>
          <div style={monthLabelStyle}>{year}年 {month}月</div>
          <button onClick={() => changeMonth(1)} style={monthBtnStyle}>次月 ▶</button>
        </div>
      </header>

      <div style={contentWrapperStyle}>
        {/* --- 左側：日付リスト --- */}
        <div style={sidebarAreaStyle}>
          <div style={listHeader}>今月の訪問: {visitList.length} 件</div>
          <div style={scrollArea}>
            {visitList.map((v, i) => (
              <div key={i} onClick={() => setSelectedVisitKey(`${v.date}-${v.facility}`)}
                style={{
                  ...visitCardStyle, 
                  backgroundColor: selectedVisitKey === `${v.date}-${v.facility}` ? '#f0fdf4' : 'white', 
                  borderLeft: selectedVisitKey === `${v.date}-${v.facility}` ? '6px solid #2d6a4f' : '6px solid transparent'
                }}>
                <div style={{fontWeight:'bold'}}>{v.date.split('/')[2]}日 ({['日','月','火','水','木','金','土'][new Date(v.date).getDay()]})</div>
                <div style={{fontSize:'15px', fontWeight:'bold', margin:'4px 0'}}>施術完了: {v.count}名</div>
                <div style={{fontSize:'12px', color:'#64748b'}}>担当: 三土手</div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 右側：詳細内容 --- */}
        <div style={mainDetailStyle}>
          {currentVisit ? (
            <div style={detailContent}>
              <div style={detailHeader}>
                <div style={facilityBadgeStyle}>担当：三土手</div>
                <h3 style={{margin:'10px 0', fontSize: '22px', color: '#1e293b'}}>{currentVisit.date.replace(/\//g, '/')} 訪問実績</h3>
                <div style={statsRow}>
                  <div style={statBox}>施術完了: <strong style={{color:'#2d6a4f'}}>{currentVisit.count}</strong> 名</div>
                  {cancelMembers.length > 0 && <div style={{...statBox, color: '#e11d48', backgroundColor: '#fff1f2'}}>欠席: <strong>{cancelMembers.length}</strong> 名</div>}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                  <button onClick={() => setDetailSortBy("room")} style={{...miniSortBtn, backgroundColor: detailSortBy==='room'?'#2d6a4f':'#f1f5f9', color: detailSortBy==='room'?'white':'#2d6a4f'}}>部屋順</button>
                  <button onClick={() => setDetailSortBy("name")} style={{...miniSortBtn, backgroundColor: detailSortBy==='name'?'#2d6a4f':'#f1f5f9', color: detailSortBy==='name'?'white':'#2d6a4f'}}>名前順</button>
                </div>
              </div>

              <h4 style={sectionTitleStyle}>✅ 施術完了メンバー</h4>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>部屋</th>
                    <th style={thStyle}>お名前</th>
                    <th style={thStyle}>メニュー</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedMembers(currentVisit.members).map((m, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>{m.room}</td>
                      <td style={{...tdStyle, fontWeight:'bold'}}>{m.name} 様</td>
                      <td style={tdStyle}><span style={menuBadgeStyle}>{m.menu}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cancelMembers.length > 0 && (
                <div style={{marginTop: '40px'}}>
                  <h4 style={{...sectionTitleStyle, color:'#e11d48'}}>🚩 当日欠席</h4>
                  <table style={{...tableStyle, border: '1px solid #fee2e2'}}>
                    <tbody style={{backgroundColor: '#fff1f2'}}>
                      {cancelMembers.map((m, idx) => (
                        <tr key={idx} style={trStyle}>
                          <td style={{...tdStyle, width:'80px'}}>{m.room}</td>
                          <td style={{...tdStyle, fontWeight:'bold', color: '#e11d48'}}>{m.name} 様</td>
                          <td style={{...tdStyle, color: '#e11d48'}}>当日欠席</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={emptyStateStyle}>
              <div style={{fontSize:'60px', marginBottom: '20px'}}>👈</div>
              <p style={{fontSize: '18px'}}>左のリストから訪問日を選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定（施設用カラー：グリーン基調）
const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const monthBtnStyle = { border: 'none', backgroundColor: '#f0fdf4', color: '#2d6a4f', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' };
const monthLabelStyle = { fontSize: '18px', fontWeight: 'bold', minWidth: '120px', textAlign: 'center' };
const contentWrapperStyle = { flex: 1, display: 'flex', gap: '20px', overflow: 'hidden', minHeight: 0 };
const sidebarAreaStyle = { width: '280px', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const listHeader = { padding: '15px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '14px', color: '#64748b' };
const scrollArea = { flex: 1, overflowY: 'auto' };
const visitCardStyle = { padding: '20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: '0.2s' };
const mainDetailStyle = { flex: 1, backgroundColor: 'white', borderRadius: '20px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '40px', border: '1px solid #e2e8f0' };
const detailContent = { width: '100%' };
const detailHeader = { borderBottom: '2px solid #f1f5f9', paddingBottom: '25px', marginBottom: '25px' };
const facilityBadgeStyle = { display: 'inline-block', backgroundColor: '#2d6a4f', color: 'white', padding: '5px 15px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' };
const statsRow = { display: 'flex', gap: '25px', marginTop: '15px' };
const statBox = { fontSize: '16px', color: '#475569', backgroundColor: '#f8fafc', padding: '10px 20px', borderRadius: '12px' };
const miniSortBtn = { padding: '8px 15px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const sectionTitleStyle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden' };
const thStyle = { textAlign: 'left', padding: '15px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '14px' };
const tdStyle = { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '15px' };
const trStyle = { transition: '0.2s' };
const menuBadgeStyle = { backgroundColor: '#f0fdf4', color: '#2d6a4f', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' };
const emptyStateStyle = { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' };