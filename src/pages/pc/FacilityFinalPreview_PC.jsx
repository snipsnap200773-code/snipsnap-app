import React, { useState } from 'react';

export default function FacilityFinalPreview_PC({ 
  keepDates = [], 
  selectedMembers = [], 
  scheduleTimes = {}, 
  setPage,
  finalizeBooking
}) {
  // 🌟 スマホ版と同じ月判定ロジック
  const sortedKeepDates = [...keepDates].sort();
  const firstDate = sortedKeepDates[0];
  const activeMonth = firstDate ? firstDate.substring(0, 7) : "";
  const activeDates = keepDates.filter(date => date.startsWith(activeMonth));

  // 🌟 スマホ版と同じ並べ替えロジック
  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  const sortedMembers = [...selectedMembers].sort((a, b) => {
    let valA, valB;
    if (sortKey === 'name') {
      valA = a.kana || a.name || "";
      valB = b.kana || b.name || "";
    } else {
      valA = a[sortKey] || "";
      valB = b[sortKey] || "";
    }
    if (sortOrder === 'desc') [valA, valB] = [valB, valA];
    return valA.toString().localeCompare(valB.toString(), 'ja', { numeric: true });
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const datePart = `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
    const timePart = scheduleTimes[dateStr] || '未設定';
    return `${datePart} ${timePart} 〜`;
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>🏁 内容確認、最終チェック</h2>
          <p style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>
            {activeMonth.replace('-', '年 ')}月分の予約内容を送信します
          </p>
        </div>
      </header>

      <div style={contentWrapperStyle}>
        {/* 📅 左側：訪問スケジュール */}
        <div style={leftPaneStyle}>
          <div style={cardHeaderStyle}>📅 訪問スケジュール</div>
          <div style={cardBodyStyle}>
            {activeDates.length === 0 ? (
              <p style={{ color: '#999' }}>日付が選択されていません</p>
            ) : (
              activeDates.map(date => (
                <div key={date} style={dateRowStyle}>
                  {formatDateTime(date)}
                </div>
              ))
            )}
            {keepDates.length > activeDates.length && (
              <p style={infoTextStyle}>
                ※ 翌月以降の分は、今回の確定後に再度お手続きいただけます。
              </p>
            )}
          </div>
        </div>

        {/* 👥 右側：施術希望者リスト */}
        <div style={rightPaneStyle}>
          <div style={{...cardHeaderStyle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>👥 施術を受ける方</span>
            <span style={countBadgeStyle}>{selectedMembers.length}名</span>
          </div>
          
          <div style={cardBodyStyle}>
            {/* 並べ替えボタン */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <button onClick={() => toggleSort('room')} style={{...pcSortBtn, backgroundColor: sortKey === 'room' ? '#2d6a4f' : 'white', color: sortKey === 'room' ? 'white' : '#666'}}>
                部屋順 {sortKey === 'room' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
              <button onClick={() => toggleSort('name')} style={{...pcSortBtn, backgroundColor: sortKey === 'name' ? '#2d6a4f' : 'white', color: sortKey === 'name' ? 'white' : '#666'}}>
                名前順 {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
            </div>

            <div style={memberListStyle}>
              {sortedMembers.map(user => (
                <div key={user.id} style={memberRowStyle}>
                  <div style={{ fontWeight: 'bold' }}>
                    <span style={roomNumStyle}>{user.room}</span> {user.name} 様
                  </div>
                  <div style={badgeContainerStyle}>
                    {(user.menus || []).map(m => (
                      <span key={m} style={pcBadgeStyle}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer style={pcFooterStyle}>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
          上記の内容で美容師へ依頼を送信します。よろしければ送信してください。
        </p>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={() => setPage('timeselect')} style={pcBackBtn}>戻る</button>
          <button onClick={finalizeBooking} style={pcFinalBtn}>
            この内容で予約を送信する
          </button>
        </div>
      </footer>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' };
const contentWrapperStyle = { flex: 1, display: 'flex', gap: '25px', minHeight: 0 };

const leftPaneStyle = { flex: '0 0 350px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e0efea', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const rightPaneStyle = { flex: 1, backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e0efea', display: 'flex', flexDirection: 'column', overflow: 'hidden' };

const cardHeaderStyle = { padding: '20px', backgroundColor: '#f0f7f4', color: '#2d6a4f', fontWeight: 'bold', borderBottom: '1px solid #e0efea' };
const cardBodyStyle = { padding: '25px', flex: 1, overflowY: 'auto' };

const dateRowStyle = { fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f', marginBottom: '15px' };
const infoTextStyle = { fontSize: '12px', color: '#94b0a7', marginTop: '20px', fontWeight: 'bold' };

const countBadgeStyle = { backgroundColor: '#dcfce7', color: '#2d6a4f', padding: '4px 15px', borderRadius: '15px', fontSize: '14px' };
const pcSortBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' };

const memberListStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f8f9fa' };
const roomNumStyle = { fontSize: '12px', color: '#94a3b8', marginRight: '10px' };
const badgeContainerStyle = { display: 'flex', gap: '5px' };
const pcBadgeStyle = { fontSize: '12px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1e5de', fontWeight: 'bold' };

const pcFooterStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' };
const pcBackBtn = { padding: '12px 30px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const pcFinalBtn = { padding: '15px 50px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(45, 106, 79, 0.3)' };