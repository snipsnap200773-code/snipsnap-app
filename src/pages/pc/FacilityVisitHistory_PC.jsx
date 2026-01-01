import React, { useState } from 'react';

export default function FacilityVisitHistory_PC({ historyList = [], bookingList = [], user }) {
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [innerSortBy, setInnerSortBy] = useState('room'); 
  const [selectedVisit, setSelectedVisit] = useState(null);

  // 🌟 1. この施設だけの施術データを抽出（スマホ版共通）
  const myFacilityHistory = historyList.filter(h => h.facility === user?.name);

  // 🌟 2. 日付ごとにグループ化
  const groupedData = myFacilityHistory.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = { count: 0, staff: '三土手', members: [] }; 
    }
    acc[date].count += 1;
    acc[date].members.push({ ...item, type: 'done' });
    return acc;
  }, {});

  // 🌟 3. 外側（日付）の並べ替え
  const sortedDates = Object.keys(groupedData).sort((a, b) => {
    return sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b);
  });

  const displayData = sortedDates.map(date => ({
    date: date,
    count: groupedData[date].count,
    staff: groupedData[date].staff,
    members: groupedData[date].members
  }));

  // 🌟 4. 名簿の並べ替えロジック（スマホ版をそのまま継承）
  const sortMembers = (visitItem) => {
    const targetDateISO = visitItem.date.replace(/\//g, '-');
    const bookingForDay = bookingList.find(b => b.date === targetDateISO && b.facility === user?.name);
    const cancelMembers = bookingForDay?.members?.filter(m => m.status === 'cancel').map(m => ({
        ...m,
        type: 'cancel',
        menu: 'キャンセル'
    })) || [];

    const allMembersInDetail = [...visitItem.members, ...cancelMembers];

    return allMembersInDetail.sort((a, b) => {
      if (innerSortBy === 'room') {
        return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
      } else {
        const nameA = a.kana || a.name;
        const nameB = b.kana || b.name;
        return nameA.localeCompare(nameB, 'ja');
      }
    });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>📜 過去の訪問実績</h2>
          <p style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>
            これまでの施術完了データを日付ごとに確認できます。
          </p>
        </div>
        <div style={filterArea}>
          <label style={{fontSize:'12px', color:'#64748b', marginRight:'8px'}}>表示順:</label>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            style={selectStyle}
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
          </select>
        </div>
      </header>

      {/* 🌟 履歴カードのグリッド表示 */}
      <div style={historyGrid}>
        {displayData.length > 0 ? (
          displayData.map((item, i) => (
            <div key={i} style={historyCardStyle} onClick={() => setSelectedVisit(item)}>
              <div style={dateHeaderStyle}>
                <span style={{fontSize: '20px', fontWeight: 'bold'}}>{item.date.replace(/-/g, '/')}</span>
                <span style={staffBadgeStyle}>担当: {item.staff}</span>
              </div>
              <div style={countAreaStyle}>
                <div style={{ fontSize: '15px', color: '#475569' }}>
                  施術人数: <strong style={{fontSize:'18px', color:'#2d6a4f'}}>{item.count}</strong> 名
                </div>
                <div style={detailLinkStyle}>詳細を表示 ➔</div>
              </div>
            </div>
          ))
        ) : (
          <div style={emptyStateStyle}>
            <div style={{fontSize: '50px', marginBottom: '15px'}}>📁</div>
            まだ訪問記録が登録されていません。
          </div>
        )}
      </div>

      {/* 🌟 詳細モーダル（PC最適化版） */}
      {selectedVisit && (
        <div style={modalOverlayStyle} onClick={() => setSelectedVisit(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#2d6a4f' }}>訪問記録 詳細</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{selectedVisit.date.replace(/-/g, '/')}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} style={closeXStyle}>×</button>
            </div>

            <div style={popupSortArea}>
              <button 
                onClick={() => setInnerSortBy('room')} 
                style={{...miniSortBtn, backgroundColor: innerSortBy==='room'?'#2d6a4f':'#fff', color: innerSortBy==='room'?'#fff':'#2d6a4f'}}
              >
                部屋番号順
              </button>
              <button 
                onClick={() => setInnerSortBy('name')} 
                style={{...miniSortBtn, backgroundColor: innerSortBy==='name'?'#2d6a4f':'#fff', color: innerSortBy==='name'?'#fff':'#2d6a4f'}}
              >
                名前順
              </button>
            </div>

            <div style={modalListArea}>
              {sortMembers(selectedVisit).map((m, idx) => (
                <div key={idx} style={{...memberDetailRow, opacity: m.type === 'cancel' ? 0.6 : 1}}>
                  <div>
                    <span style={{fontSize: '12px', color: m.type === 'cancel' ? '#e11d48' : '#94a3b8', display:'block'}}>{m.room} 号室</span>
                    <span style={{fontWeight: 'bold', fontSize: '17px', color: m.type === 'cancel' ? '#e11d48' : '#334155'}}>{m.name} 様</span>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span style={{
                        ...menuBadgeStyle, 
                        backgroundColor: m.type === 'cancel' ? '#fff1f2' : '#f0f7f4',
                        color: m.type === 'cancel' ? '#e11d48' : '#2d6a4f'
                      }}>
                      {m.menu}
                    </span>
                    {m.type === 'cancel' && <div style={{fontSize:'10px', color:'#e11d48', marginTop:'4px'}}>※欠席</div>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedVisit(null)} style={closeBtnStyle}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' };
const filterArea = { display: 'flex', alignItems: 'center' };
const selectStyle = { padding: '8px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '14px', cursor: 'pointer', outline: 'none' };
const historyGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', overflowY: 'auto' };
const historyCardStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderLeft: '8px solid #2d6a4f', cursor: 'pointer', transition: '0.2s transform' };
const dateHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const staffBadgeStyle = { fontSize: '12px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '5px 12px', borderRadius: '15px', fontWeight: 'bold' };
const countAreaStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const detailLinkStyle = { fontSize: '14px', color: '#3b82f6', fontWeight: 'bold' };
const emptyStateStyle = { gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '32px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '500px', borderRadius: '32px', padding: '35px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '2px solid #f0f7f4', paddingBottom: '15px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '30px', cursor: 'pointer', color: '#94a3b8' };
const popupSortArea = { display: 'flex', gap: '10px', marginBottom: '20px' };
const miniSortBtn = { flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #2d6a4f', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const modalListArea = { maxHeight: '50vh', overflowY: 'auto', paddingRight: '10px' };
const memberDetailRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f8fafc' };
const menuBadgeStyle = { padding: '5px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold' };
const closeBtnStyle = { width: '100%', marginTop: '30px', padding: '15px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '18px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };