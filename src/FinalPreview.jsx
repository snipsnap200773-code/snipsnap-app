import React, { useState } from 'react';
import { Layout } from './Layout';

export default function FinalPreview({ 
  keepDates = [], 
  selectedMembers = [], 
  scheduleTimes = {}, 
  setPage,
  finalizeBooking
}) {
  // 🌟 並べ替え状態の管理
  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  // 自分の施設がキープした日付のうち、一番近い月の日付だけに絞り込む
  const sortedKeepDates = [...keepDates].sort();
  const firstDate = sortedKeepDates[0];
  const activeMonth = firstDate ? firstDate.substring(0, 7) : "";
  const activeDates = keepDates.filter(date => date.startsWith(activeMonth));

  // 🌟 並べ替えロジック
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
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ paddingBottom: '140px', paddingLeft: '20px', paddingRight: '20px' }}>
          <header style={{ marginBottom: '24px', textAlign: 'center', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f' }}>内容を確認してください</h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              {activeMonth.replace('-', '年 ')}月分の予約内容を確定します
            </p>
          </header>

          {/* 📅 訪問スケジュール */}
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>訪問スケジュール</h2>
            {activeDates.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>日付が選択されていません</p>
            ) : (
              activeDates.map(date => (
                <div key={date} style={{ fontSize: '18px', fontWeight: 'bold', color: '#2d6a4f', marginBottom: '8px' }}>
                  {formatDateTime(date)}
                </div>
              ))
            )}
            {keepDates.length > activeDates.length && (
              <p style={{ fontSize: '11px', color: '#94b0a7', marginTop: '10px', fontStyle: 'italic', fontWeight: 'bold' }}>
                ※ 翌月以降のキープ分は、今回の確定後に別途お手続きいただけます。
              </p>
            )}
          </div>

          {/* 👥 施術希望者リスト */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #f0f7f4', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '16px', color: '#2d6a4f', margin: 0, fontWeight: 'bold' }}>施術を受ける方</h2>
              <span style={{ fontWeight: 'bold', color: '#2d6a4f', backgroundColor: '#dcfce7', padding: '2px 12px', borderRadius: '10px' }}>{selectedMembers.length}名</span>
            </div>

            {/* 🌟 並べ替えボタン */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <button onClick={() => toggleSort('room')} style={{...sortBtnStyle, backgroundColor: sortKey === 'room' ? '#2d6a4f' : 'white', color: sortKey === 'room' ? 'white' : '#666'}}>
                部屋順 {sortKey === 'room' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
              <button onClick={() => toggleSort('name')} style={{...sortBtnStyle, backgroundColor: sortKey === 'name' ? '#2d6a4f' : 'white', color: sortKey === 'name' ? 'white' : '#666'}}>
                名前順 {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedMembers.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px', textAlign: 'center' }}>対象者が選択されていません</p>
              ) : (
                sortedMembers.map(user => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#334155' }}>
                      <span style={{ fontSize: '13px', color: '#94a3b8', marginRight: '8px' }}>{user.room}</span>
                      {user.name} 様
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '150px' }}>
                      {(user.menus || []).map(m => (
                        <span key={m} style={badgeStyle}>{m}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
              上記の内容で美容師へ依頼を送信します。<br />
              よろしければ下のボタンを押してください。
            </p>
          </div>
        </div>
      </Layout>

      <button className="floating-back-btn" onClick={() => setPage('timeselect')}>←</button>

      <div style={footerAreaStyle}>
        <button 
          onClick={finalizeBooking} 
          style={confirmBtnStyle}
        >
          この内容で予約を送信する
        </button>
      </div>
    </div>
  );
}

// 🎨 追加のスタイル
const sortBtnStyle = { 
  flex: 1, 
  padding: '10px', 
  borderRadius: '12px', 
  border: '1px solid #ccc', 
  fontSize: '12px', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  transition: '0.2s' 
};

// 🎨 スタイル設定（既存のもの）
const cardStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '28px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e0efea' };
const sectionTitleStyle = { fontSize: '13px', color: '#52796f', marginBottom: '15px', borderBottom: '2px solid #f0f7f4', paddingBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' };
const badgeStyle = { fontSize: '11px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '4px 10px', borderRadius: '8px', border: '1px solid #d1e5de', fontWeight: 'bold' };
const footerAreaStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '20px', borderTop: '1px solid #e0efea', zIndex: 100 };
const confirmBtnStyle = { width: '100%', backgroundColor: '#2d6a4f', color: 'white', border: 'none', padding: '20px', borderRadius: '22px', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 8px 20px rgba(45, 106, 79, 0.3)', cursor: 'pointer' };