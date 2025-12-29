import React, { useState } from 'react';
import { Layout } from './Layout';

// 🌟 bookingList を受け取れるように引数を追加
export default function VisitHistory({ historyList = [], bookingList = [], user, setPage }) {
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [innerSortBy, setInnerSortBy] = useState('room'); 
  const [selectedVisit, setSelectedVisit] = useState(null);

  // 1. この施設だけの施術データを抽出
  const myFacilityHistory = historyList.filter(h => h.facility === user?.name);

  // 2. 日付ごとにグループ化
  const groupedData = myFacilityHistory.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = { count: 0, staff: '三土手', members: [] }; 
    }
    acc[date].count += 1;
    acc[date].members.push({ ...item, type: 'done' }); // 実際に施術した人
    return acc;
  }, {});

  // 3. 外側（日付）の並べ替え
  const sortedDates = Object.keys(groupedData).sort((a, b) => {
    return sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b);
  });

  const displayData = sortedDates.map(date => ({
    date: date,
    count: groupedData[date].count,
    staff: groupedData[date].staff,
    members: groupedData[date].members
  }));

  // 🌟 名簿の並べ替え（施術完了＋欠席を混ぜてソート）
  const sortMembers = (visitItem) => {
    // クラウドの予約データからその日の「欠席者」を探して合流させる
    const targetDateISO = visitItem.date.replace(/\//g, '-');
    const bookingForDay = bookingList.find(b => b.date === targetDateISO && b.facility === user?.name);
    const cancelMembers = bookingForDay?.members?.filter(m => m.status === 'cancel').map(m => ({
        ...m,
        type: 'cancel',
        menu: '欠席'
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
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '120px' }}>
          <header style={{ marginBottom: '20px', textAlign: 'center', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f', margin: 0 }}>過去の訪問記録</h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
              {user?.name} 様の施術実績
            </p>
          </header>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              style={selectStyle}
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {displayData.length > 0 ? (
              displayData.map((item, i) => (
                <div key={i} style={historyCardStyle} onClick={() => setSelectedVisit(item)}>
                  <div style={dateHeaderStyle}>
                    <span style={{fontSize: '18px', fontWeight: 'bold'}}>{item.date}</span>
                    <span style={staffBadgeStyle}>訪問担当: {item.staff}</span>
                  </div>
                  <div style={countAreaStyle}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>合計施術人数: {item.count} 名</span>
                    <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 'bold' }}>詳細 ＞</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={emptyStateStyle}>
                <div style={{fontSize: '40px', marginBottom: '15px'}}>📁</div>
                まだ訪問記録がありません
              </div>
            )}
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>

      {/* 🌟 訪問詳細ポップアップ */}
      {selectedVisit && (
        <div style={modalOverlayStyle} onClick={() => setSelectedVisit(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#2d6a4f' }}>訪問記録 詳細</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{selectedVisit.date}</p>
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

            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }}>
              {sortMembers(selectedVisit).map((m, idx) => (
                <div key={idx} style={{...memberDetailRow, opacity: m.type === 'cancel' ? 0.6 : 1}}>
                  <div>
                    <span style={{fontSize: '12px', color: m.type === 'cancel' ? '#e11d48' : '#94a3b8', display:'block'}}>{m.room} 号室</span>
                    <span style={{fontWeight: 'bold', fontSize: '16px', color: m.type === 'cancel' ? '#e11d48' : '#334155'}}>{m.name} 様</span>
                  </div>
                  <span style={{
                      ...menuBadgeStyle, 
                      backgroundColor: m.type === 'cancel' ? '#fff1f2' : '#f0f7f4',
                      color: m.type === 'cancel' ? '#e11d48' : '#2d6a4f'
                    }}>
                    {m.menu}
                  </span>
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

// 🎨 デザインパーツ（既存を維持）
const historyCardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderLeft: '6px solid #2d6a4f', cursor: 'pointer' };
const dateHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#2d6a4f' };
const selectStyle = { padding: '8px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontSize: '13px', fontWeight: 'bold', color: '#475569', outline: 'none' };
const staffBadgeStyle = { fontSize: '11px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' };
const countAreaStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const emptyStateStyle = { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '450px', borderRadius: '32px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', borderBottom: '2px solid #f0f7f4', paddingBottom: '15px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' };
const memberDetailRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8fafc' };
const menuBadgeStyle = { padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' };
const closeBtnStyle = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
const popupSortArea = { display: 'flex', gap: '10px', marginBottom: '15px', padding: '5px 0' };
const miniSortBtn = { flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #2d6a4f', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' };