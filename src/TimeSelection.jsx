import React from 'react';
import { Layout } from './Layout';

export default function TimeSelection({ 
  keepDates = [], // 🌟 App.jsx から自分の施設分の日付文字列配列が届く
  scheduleTimes, 
  setScheduleTimes, 
  setPage,
  config 
}) {
  
  const { startHour = 9, endHour = 14, interval = 30 } = config || {};

  // 🌟 自分のキープ日のうち、一番近い月（直近の処理対象）を特定
  const sortedKeepDates = [...keepDates].sort();
  const firstDate = sortedKeepDates[0];
  const activeMonth = firstDate ? firstDate.substring(0, 7) : "";
  
  // 今回処理する月の日付だけに絞り込む
  const activeDates = keepDates.filter(date => date.startsWith(activeMonth));

  // 🌟 時間の選択肢を生成
  const timeOptions = [];
  for (let h = startHour; h <= endHour; h++) {
    timeOptions.push(`${h}:00`);
    if (interval === 30 && h !== endHour) {
      timeOptions.push(`${h}:30`);
    }
  }

  const formatFullDate = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}月${d.getDate()}日(${dayNames[d.getDay()]})`;
  };

  const handleTimeSelect = (date, time) => {
    setScheduleTimes({
      ...scheduleTimes,
      [date]: time
    });
  };

  const isAllSelected = activeDates.length > 0 && activeDates.every(date => scheduleTimes[date]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ paddingBottom: '120px', paddingLeft: '20px', paddingRight: '20px' }}>
          <header style={{ marginBottom: '24px', textAlign: 'center', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f' }}>
              開始時間を決めましょう
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              {activeMonth.replace('-', '年 ')}月分の開始時間を選択してください
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeDates.map(date => (
              <div 
                key={date} 
                style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '28px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  border: scheduleTimes[date] ? '2px solid #2d6a4f' : '1px solid #eee'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '18px', color: '#2d6a4f', textAlign: 'center' }}>
                  📅 {formatFullDate(date)}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', // 🌟 PC/スマホ両対応
                  gap: '12px' 
                }}>
                  {timeOptions.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(date, time)}
                      style={{
                        padding: '14px 0',
                        borderRadius: '16px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        backgroundColor: scheduleTimes[date] === time ? '#2d6a4f' : '#f8f9fa',
                        color: scheduleTimes[date] === time ? 'white' : '#666',
                        boxShadow: scheduleTimes[date] === time ? '0 4px 10px rgba(45, 106, 79, 0.2)' : 'none',
                        transition: '0.2s',
                        cursor: 'pointer'
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {activeDates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94b0a7', backgroundColor: 'white', borderRadius: '24px' }}>
                対象となる日付がありません
              </div>
            )}
          </div>
          
          {keepDates.length > activeDates.length && (
            <div style={{ marginTop: '24px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '18px', border: '1px dashed #2d6a4f', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#52796f', margin: 0, fontWeight: 'bold' }}>
                ※ 翌月以降の分は、今回の予約を確定させた後に設定できます。
              </p>
            </div>
          )}
        </div>
      </Layout>

      <button className="floating-back-btn" onClick={() => setPage('confirm')}>←</button>

      <div style={footerAreaStyle}>
        <button 
          onClick={() => {
            if (!isAllSelected) {
              alert('全ての日付の開始時間を選択してください');
              return;
            }
            setPage('preview');
          }}
          style={{
            ...confirmBtnStyle,
            backgroundColor: isAllSelected ? '#2d6a4f' : '#ccc',
            boxShadow: isAllSelected ? '0 8px 20px rgba(45, 106, 79, 0.3)' : 'none',
            cursor: isAllSelected ? 'pointer' : 'not-allowed'
          }}
        >
          内容を確認する
        </button>
      </div>
    </div>
  );
}

const footerAreaStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '20px', borderTop: '1px solid #e0efea', zIndex: 100 };
const confirmBtnStyle = { width: '100%', color: 'white', border: 'none', padding: '20px', borderRadius: '22px', fontWeight: 'bold', fontSize: '18px', transition: '0.3s' };