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

  // 🌟【ロジック厳密修正】
  // 1年先まであるキープ日の中から、「現在予約確定を進めている月」だけを抽出します
  const myKeepDates = keepDates
    .filter(kd => {
      const facilityName = typeof kd === 'string' ? user.name : kd.facility;
      const dateStr = typeof kd === 'string' ? kd : kd.date;

      // 1. 自分の施設であること
      const isMyFacility = facilityName === user.name;
      
      // 2. 【重要】「今月」のデータのみに絞り込む（1年分表示させない）
      // ※もし「翌月分」の処理をしたい場合は、App.jsxからターゲット月を渡すのが理想ですが、
      // ひとまず現在の年月に基づいてフィルタリングし、1年分出るのを防ぎます。
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      return isMyFacility && dateStr && dateStr.startsWith(currentMonthKey);
    })
    .map(kd => (typeof kd === 'string' ? kd : kd.date))
    .sort();

  const handleTimeSelect = (date, time) => {
    setScheduleTimes({ ...scheduleTimes, [date]: time });
  };

  const isAllSelected = myKeepDates.length > 0 && myKeepDates.every(date => scheduleTimes[date]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{ color: '#4a3728', margin: 0, fontSize: '28px' }}>🕒 開始時間の決定</h2>
          <p style={{ color: '#7a6b5d', fontSize: '18px', marginTop: '6px', fontWeight: '800' }}>
            {myKeepDates.length > 0 ? `${myKeepDates[0].substring(0, 7).replace('-', '年 ')}月分` : ''} の開始時間を選択してください
          </p>
        </div>
      </header>

      <div style={scrollArea}>
        {myKeepDates.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '100px', fontSize: '20px', color: '#a39081', fontWeight: 'bold' }}>
            指定された月のキープ枠が見つかりません。
          </div>
        ) : (
          <div style={gridStyle}>
            {myKeepDates.map(date => (
              <div key={date} style={dateCardStyle}>
                <div style={dateHeaderStyle}>📅 {date.replace(/-/g, '/')}</div>
                
                <div style={verticalTimeList}>
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(date, time)}
                      style={{
                        ...timeRowBtn,
                        backgroundColor: scheduleTimes[date] === time ? '#2d6a4f' : 'white',
                        color: scheduleTimes[date] === time ? 'white' : '#4a3728',
                        borderColor: scheduleTimes[date] === time ? '#2d6a4f' : '#e0d6cc',
                        boxShadow: scheduleTimes[date] === time ? '0 4px 12px rgba(45,106,79,0.2)' : 'none',
                      }}
                    >
                      <span style={timeTextStyle}>{time}</span>
                      {scheduleTimes[date] === time ? (
                        <span style={checkIcon}>選択中</span>
                      ) : (
                        <span style={{ fontSize: '18px', color: '#e0d6cc' }}>○</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer style={footerStyle}>
        <div>
          {!isAllSelected && myKeepDates.length > 0 && (
            <div style={alertStyle}>⚠️ まだ時間を決めていない日があります</div>
          )}
        </div>
        <div style={footerBtnGroup}>
          <button onClick={() => setPage('confirm')} style={backBtn}>前に戻る</button>
          <button 
            disabled={!isAllSelected}
            onClick={() => setPage('preview')}
            style={{
              ...nextBtn,
              backgroundColor: isAllSelected ? '#4a3728' : '#cbd5e0',
              cursor: isAllSelected ? 'pointer' : 'default',
            }}
          >
            予約内容を確認する ➔
          </button>
        </div>
      </footer>
    </div>
  );
}

// 🎨 スタイル設定（アンティーク調を維持）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { backgroundColor: 'white', padding: '24px 30px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)', marginBottom: '25px' };
const scrollArea = { flex: 1, overflowY: 'auto', padding: '0 10px 120px 10px' };
const gridStyle = { display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'flex-start' };
const dateCardStyle = { width: '360px', backgroundColor: 'white', borderRadius: '25px', border: '1px solid #e0d6cc', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const dateHeaderStyle = { backgroundColor: '#f9f7f5', padding: '20px', textAlign: 'center', fontWeight: '800', color: '#4a3728', borderBottom: '2px solid #e0d6cc', fontSize: '22px' };
const verticalTimeList = { display: 'flex', flexDirection: 'column', padding: '15px', gap: '12px' };
const timeRowBtn = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 25px', borderRadius: '15px', border: '2px solid', cursor: 'pointer', transition: '0.3s' };
const timeTextStyle = { fontSize: '22px', fontWeight: '800', letterSpacing: '0.05em' };
const checkIcon = { fontSize: '14px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '8px' };
const footerStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '25px 40px', backgroundColor: 'white', borderTop: '1px solid #e2d6cc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderRadius: '30px 30px 0 0', boxShadow: '0 -8px 25px rgba(74, 55, 40, 0.1)' };
const alertStyle = { color: '#c62828', fontWeight: '800', fontSize: '18px' };
const footerBtnGroup = { display: 'flex', gap: '20px', marginLeft: 'auto' };
const backBtn = { padding: '15px 35px', borderRadius: '18px', border: '2px solid #e0d6cc', backgroundColor: 'white', color: '#7a6b5d', cursor: 'pointer', fontWeight: '800', fontSize: '18px', transition: '0.2s' };
const nextBtn = { padding: '18px 50px', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '20px', boxShadow: '0 6px 15px rgba(74, 55, 40, 0.3)', transition: '0.3s' };