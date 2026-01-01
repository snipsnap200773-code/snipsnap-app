import React from 'react';

export default function FacilityTimeSelection_PC({ 
  keepDates = [], 
  scheduleTimes = {}, 
  setScheduleTimes, 
  setPage,
  user
}) {
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00"
  ];

  // 🌟【修正：根本解決】
  // keepDatesが [ {date: "2026-01-01"}, ... ] というオブジェクト形式でも
  // 確実に日付文字列だけを取り出し、自分の施設の分だけに絞り込みます。
  const myKeepDates = keepDates
    .filter(kd => {
      const facilityName = typeof kd === 'string' ? user.name : kd.facility;
      return facilityName === user.name;
    })
    .map(kd => (typeof kd === 'string' ? kd : kd.date)) // 確実に文字列にする
    .sort();

  const handleTimeSelect = (date, time) => {
    setScheduleTimes({ ...scheduleTimes, [date]: time });
  };

  const isAllSelected = myKeepDates.length > 0 && myKeepDates.every(date => scheduleTimes[date]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ color: '#2d6a4f', margin: 0 }}>🕒 開始時間の決定</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>各訪問日の開始時間をリストから選択してください</p>
      </header>

      <div style={scrollArea}>
        <div style={gridStyle}>
          {myKeepDates.map(date => (
            <div key={date} style={dateCardStyle}>
              {/* 🌟 ここで date.replace を安全に実行 */}
              <div style={dateHeaderStyle}>📅 {date.replace(/-/g, '/')}</div>
              
              <div style={verticalTimeList}>
                {timeSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(date, time)}
                    style={{
                      ...timeRowBtn,
                      backgroundColor: scheduleTimes[date] === time ? '#2d6a4f' : 'white',
                      color: scheduleTimes[date] === time ? 'white' : '#1e293b',
                      borderColor: scheduleTimes[date] === time ? '#2d6a4f' : '#e2e8f0',
                    }}
                  >
                    <span style={timeTextStyle}>{time}</span>
                    {scheduleTimes[date] === time && <span style={checkIcon}>選択中</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={footerStyle}>
        {!isAllSelected && myKeepDates.length > 0 && (
          <div style={alertStyle}>⚠️ まだ時間を決めていない日があります</div>
        )}
        <div style={footerBtnGroup}>
          <button onClick={() => setPage('confirm')} style={backBtn}>戻る</button>
          <button 
            disabled={!isAllSelected}
            onClick={() => setPage('preview')}
            style={{
              ...nextBtn,
              backgroundColor: isAllSelected ? '#2d6a4f' : '#ccc'
            }}
          >
            予約内容を確認する ➔
          </button>
        </div>
      </footer>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' };
const headerStyle = { marginBottom: '20px' };
const scrollArea = { flex: 1, overflowY: 'auto', paddingBottom: '100px' };
const gridStyle = { display: 'flex', flexWrap: 'wrap', gap: '20px' };
const dateCardStyle = { width: '320px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const dateHeaderStyle = { backgroundColor: '#f8fafc', padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#2d6a4f', borderBottom: '1px solid #e2e8f0', fontSize: '18px' };
const verticalTimeList = { display: 'flex', flexDirection: 'column', padding: '10px', gap: '8px' };
const timeRowBtn = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: '10px', border: '1px solid', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const timeTextStyle = { fontSize: '18px' };
const checkIcon = { fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' };
const footerStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 40px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 };
const alertStyle = { color: '#ef4444', fontWeight: 'bold', fontSize: '14px' };
const footerBtnGroup = { display: 'flex', gap: '15px', marginLeft: 'auto' };
const backBtn = { padding: '12px 30px', borderRadius: '12px', border: '2px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' };
const nextBtn = { padding: '12px 40px', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.2s' };