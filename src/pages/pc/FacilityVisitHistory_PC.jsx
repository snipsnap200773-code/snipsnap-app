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

  // 🌟 ロジック保持
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
          <h2 style={{margin:0, color: '#4a3728', fontSize: '32px'}}>📜 過去の訪問実績</h2>
          <p style={{fontSize:'18px', color:'#7a6b5d', marginTop: '6px', fontWeight: '800'}}>施設内での施術実績と欠席状況をアーカイブしています</p>
        </div>
        <div style={monthNavStyle}>
          <button onClick={() => changeMonth(-1)} style={monthBtnStyle}>◀ 前月</button>
          <div style={monthLabelStyle}>{year}年 {month}月</div>
          <button onClick={() => changeMonth(1)} style={monthBtnStyle}>次月 ▶</button>
        </div>
      </header>

      <div style={contentWrapperStyle}>
        <div style={sidebarAreaStyle}>
          <div style={listHeader}>今月の訪問: {visitList.length} 件</div>
          <div style={scrollArea}>
            {visitList.map((v, i) => (
              <div key={i} onClick={() => setSelectedVisitKey(`${v.date}-${v.facility}`)}
                style={{
                  ...visitCardStyle, 
                  backgroundColor: selectedVisitKey === `${v.date}-${v.facility}` ? '#fdfcfb' : 'white', 
                  borderLeft: selectedVisitKey === `${v.date}-${v.facility}` ? '8px solid #4a3728' : '8px solid transparent',
                  boxShadow: selectedVisitKey === `${v.date}-${v.facility}` ? 'inset 0 0 15px rgba(74,55,40,0.05)' : 'none'
                }}>
                <div style={{fontSize: '20px', fontWeight: '900', color: '#4a3728'}}>
                  {v.date.split('/')[2]}日 ({['日','月','火','水','木','金','土'][new Date(v.date).getDay()]})
                </div>
                <div style={{fontSize:'18px', fontWeight:'800', color: '#2d6a4f', margin:'6px 0'}}>
                  施術完了: {v.count}名
                </div>
                <div style={{fontSize:'14px', color:'#94a3b8', fontWeight: 'bold'}}>担当者: 三土手</div>
              </div>
            ))}
          </div>
        </div>

        <div style={mainDetailStyle}>
          {currentVisit ? (
            <div style={detailContent}>
              <div style={detailHeader}>
                <div style={facilityBadgeStyle}>美容室 SnipSnap 訪問記録</div>
                <h3 style={{margin:'15px 0', fontSize: '28px', color: '#4a3728', fontWeight: '900'}}>
                  {currentVisit.date.replace(/\//g, '/')} 訪問実績報告
                </h3>
                <div style={statsRow}>
                  <div style={statBox}>施術完了：<strong style={{color:'#2d6a4f', fontSize: '24px'}}>{currentVisit.count}</strong> 名</div>
                  {cancelMembers.length > 0 && (
                    <div style={{...statBox, color: '#c62828', backgroundColor: '#fff5f5', border: '1px solid #ef9a9a'}}>
                      欠席：<strong style={{fontSize: '24px'}}>{cancelMembers.length}</strong> 名
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                  <button onClick={() => setDetailSortBy("room")} style={{...miniSortBtn, backgroundColor: detailSortBy==='room'?'#4a3728':'white', color: detailSortBy==='room'?'white':'#4a3728'}}>部屋順</button>
                  <button onClick={() => setDetailSortBy("name")} style={{...miniSortBtn, backgroundColor: detailSortBy==='name'?'#4a3728':'white', color: detailSortBy==='name'?'white':'#4a3728'}}>名前順</button>
                </div>
              </div>

              <h4 style={sectionTitleStyle}>✅ 施術を完了された皆様</h4>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{...thStyle, width: '120px'}}>お部屋</th>
                    <th style={thStyle}>お名前</th>
                    <th style={{...thStyle, textAlign: 'right'}}>メニュー内容</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedMembers(currentVisit.members).map((m, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={{...tdStyle, fontWeight: '800', color: '#8b5e3c'}}>{m.room} 号室</td>
                      <td style={{...tdStyle, fontWeight:'900', fontSize: '20px', color: '#4a3728'}}>{m.name} 様</td>
                      <td style={{...tdStyle, textAlign: 'right'}}>
                        <span style={menuBadgeStyle}>{m.menu}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {cancelMembers.length > 0 && (
                <div style={{marginTop: '50px'}}>
                  <h4 style={{...sectionTitleStyle, color:'#c62828'}}>🚩 当日欠席・キャンセル</h4>
                  <table style={{...tableStyle, border: '1px solid #ef9a9a'}}>
                    <tbody style={{backgroundColor: '#fffcfc'}}>
                      {cancelMembers.map((m, idx) => (
                        <tr key={idx} style={trStyle}>
                          <td style={{...tdStyle, width:'120px', color: '#c62828'}}>{m.room} 号室</td>
                          <td style={{...tdStyle, fontWeight:'800', color: '#c62828', fontSize: '18px'}}>{m.name} 様</td>
                          <td style={{...tdStyle, color: '#c62828', textAlign: 'right', fontWeight: '800'}}>当日欠席</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div style={emptyStateStyle}>
              <div style={{fontSize:'80px', marginBottom: '30px'}}>📜</div>
              <p style={{fontSize: '22px', fontWeight: '800', color: '#a39081'}}>左側のリストから訪問日を選択して<br/>詳細実績をご確認ください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定（警告箇所を修正済み）
const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px 30px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f9f7f5', padding: '10px 20px', borderRadius: '15px', border: '1px solid #e2d6cc' };

// 🌟 ここが修正ポイント：borderの重複を消しました
const monthBtnStyle = { 
  backgroundColor: 'white', 
  color: '#4a3728', 
  padding: '10px 20px', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: '800', 
  border: '1px solid #e0d6cc' 
};

const monthLabelStyle = { fontSize: '22px', fontWeight: '900', minWidth: '150px', textAlign: 'center', color: '#4a3728' };

const contentWrapperStyle = { flex: 1, display: 'flex', gap: '25px', overflow: 'hidden', minHeight: 0 };
const sidebarAreaStyle = { width: '320px', display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2d6cc' };
const listHeader = { padding: '20px 25px', backgroundColor: '#f9f7f5', borderBottom: '1px solid #e2d6cc', fontWeight: '900', fontSize: '16px', color: '#5d4037' };
const scrollArea = { flex: 1, overflowY: 'auto' };
const visitCardStyle = { padding: '25px', borderBottom: '1px solid #f2ede9', cursor: 'pointer', transition: '0.3s' };

const mainDetailStyle = { flex: 1, backgroundColor: 'white', borderRadius: '25px', overflowY: 'auto', boxShadow: '0 8px 25px rgba(74, 55, 40, 0.1)', padding: '50px', border: '1px solid #e2d6cc' };
const detailContent = { width: '100%' };
const detailHeader = { borderBottom: '3px solid #f2ede9', paddingBottom: '30px', marginBottom: '40px' };
const facilityBadgeStyle = { display: 'inline-block', backgroundColor: '#4a3728', color: 'white', padding: '8px 20px', borderRadius: '12px', fontSize: '15px', fontWeight: '900', letterSpacing: '0.1em' };
const statsRow = { display: 'flex', gap: '30px', marginTop: '20px' };
const statBox = { fontSize: '18px', color: '#4a3728', backgroundColor: '#fdfcfb', padding: '15px 30px', borderRadius: '15px', fontWeight: '800', border: '1px solid #f2ede9' };
const miniSortBtn = { padding: '10px 25px', borderRadius: '12px', border: '2px solid #4a3728', fontSize: '14px', fontWeight: '900', cursor: 'pointer', transition: '0.2s' };
const sectionTitleStyle = { fontSize: '20px', fontWeight: '900', marginBottom: '20px', color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: '10px' };

const tableStyle = { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' };
const thStyle = { textAlign: 'left', padding: '15px 20px', backgroundColor: '#fdfcfb', color: '#a39081', fontSize: '16px', fontWeight: '900', borderBottom: '2px solid #e2d6cc' };
const tdStyle = { padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #f2ede9', fontSize: '18px' };
const trStyle = { transition: '0.2s' };

const menuBadgeStyle = { backgroundColor: '#e8f5e9', color: '#1b4332', padding: '8px 18px', borderRadius: '10px', fontSize: '16px', fontWeight: '900', border: '1px solid #c8e6c9' };
const emptyStateStyle = { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cbd5e0', textAlign: 'center' };