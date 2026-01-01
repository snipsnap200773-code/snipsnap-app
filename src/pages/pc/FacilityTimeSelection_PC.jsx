import React, { useState } from 'react';

export default function FacilityTimeSelection_PC({ 
  selectedMembers = [], 
  keepDates = [], 
  bookingTimes = {}, 
  setBookingTimes, 
  setPage 
}) {
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00"
  ];

  const handleTimeSelect = (date, time) => {
    setBookingTimes({ ...bookingTimes, [date]: time });
  };

  const isAllSelected = keepDates.every(date => bookingTimes[date]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ color: '#2d6a4f', margin: 0 }}>🕒 開始時間の決定</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>各訪問日の開始時間を縦のリストから選択してください</p>
      </header>

      <div style={scrollArea}>
        {keepDates.map(date => (
          <div key={date} style={dateCardStyle}>
            <div style={dateHeaderStyle}>📅 {date.replace(/-/g, '/')}</div>
            
            {/* 🌟 時間を縦に並べるリスト */}
            <div style={verticalTimeList}>
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(date, time)}
                  style={{
                    ...timeRowBtn,
                    backgroundColor: bookingTimes[date] === time ? '#2d6a4f' : 'white',
                    color: bookingTimes[date] === time ? 'white' : '#1e293b',
                    borderColor: bookingTimes[date] === time ? '#2d6a4f' : '#e2e8f0',
                  }}
                >
                  <span style={timeTextStyle}>{time}</span>
                  {bookingTimes[date] === time && <span style={checkIcon}>✓ 選択中</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer style={footerStyle}>
        {!isAllSelected && (
          <div style={alertStyle}>⚠️ まだ未選択の日があります</div>
        )}
        <div style={footerBtnGroup}>
          <button onClick={() => setPage('confirm')} style={backBtn}>戻る</button>
          <button 
            disabled={!isAllSelected}
            onClick={() => setPage('final-confirm')}
            style={{
              ...nextBtn,
              backgroundColor: isAllSelected ? '#2d6a4f' : '#ccc'
            }}
          >
            予約内容を最終確認する ➔
          </button>
        </div>
      </footer>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { marginBottom: '10px' };
const scrollArea = { flex: 1, overflowY: 'auto', display: 'flex', gap: '30px', paddingBottom: '100px' };

const dateCardStyle = { flex: 1, minWidth: '300px', maxWidth: '400px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const dateHeaderStyle = { backgroundColor: '#f8fafc', padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#2d6a4f', borderBottom: '1px solid #e2e8f0' };

// 🌟 縦並び用のスタイル
const verticalTimeList = { display: 'flex', flexDirection: 'column', padding: '10px' };
const timeRowBtn = { 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '15px 25px', margin: '4px 0', borderRadius: '12px', border: '1px solid',
  fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' 
};
const timeTextStyle = { fontSize: '20px' };
const checkIcon = { fontSize: '14px' };

const footerStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 40px', backgroundColor: 'white', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const alertStyle = { color: '#ef4444', fontWeight: 'bold' };
const footerBtnGroup = { display: 'flex', gap: '15px', marginLeft: 'auto' };
const backBtn = { padding: '12px 30px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' };
const nextBtn = { padding: '12px 40px', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };