import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function FacilityKeepDate_PC({ 
  user, 
  keepDates = [], 
  bookingList = [], 
  ngDates = [], 
  historyList = [], 
  allUsers = [],    
  refreshAllData,
  setPage,
  checkDateSelectable 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);

  const getDynamicLabel = (dateStr) => {
    const dateSlash = dateStr.replace(/-/g, '/');
    const booking = bookingList.find(b => b.date === dateStr && b.facility === user.name);
    const finishedCount = historyList.filter(h => h.date === dateSlash && h.facility === user.name).length;
    
    if (finishedCount > 0 || booking) {
      const cancelCount = booking?.members?.filter(m => m.status === 'cancel').length || 0;
      const totalCount = booking?.members?.length || 0;
      if (cancelCount > 0 && (finishedCount + cancelCount >= totalCount)) return '終了処理済';
      if (totalCount > 0 && (finishedCount + cancelCount >= totalCount)) return '訪問済';
      return booking ? '確定済' : '訪問済';
    }
    return null;
  };

  const getStatus = (dateStr) => {
    const label = getDynamicLabel(dateStr);
    if (label === '訪問済' || label === '終了処理済') return 'finished';
    if (bookingList.some(b => b.date === dateStr && b.facility === user.name)) return 'my-booked'; 
    if (dateStr < todayStr) return 'past'; 
    if (ngDates.includes(dateStr)) return 'ng'; 
    if (keepDates.some(k => k.date === dateStr && k.facility === user.name)) return 'keeping'; 
    if (bookingList.some(b => b.date === dateStr)) return 'other-booked'; 
    if (keepDates.some(k => k.date === dateStr && k.facility !== user.name)) return 'other-keep';
    if (checkDateSelectable && !checkDateSelectable(dateStr)) return 'outside';
    return 'available';
  };

  const handleDateClick = async (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = getStatus(dateStr);
    if (status === 'finished') { alert('この日の施術は既に完了しているため、変更できません。'); return; }
    if (status === 'past') { alert('過去の日付は変更できません。'); return; }
    if (status === 'ng') { alert('美容師の都合により予約できない日です。'); return; }
    if (status === 'my-booked') { alert('この日は既に予約が確定しています。'); return; }
    if (status === 'other-booked' || status === 'other-keep') { alert('他の施設が予約・キープ済みです。'); return; }
    if (status === 'outside') { alert('予約受付時間外、または定休日です。'); return; }

    try {
      if (status === 'keeping') {
        await supabase.from('keep_dates').delete().match({ date: dateStr, facility: user.name });
      } else {
        await supabase.from('keep_dates').upsert({ date: dateStr, facility: user.name });
      }
      if (refreshAllData) await refreshAllData();
    } catch (err) {
      console.error("Keep Toggle Error:", err);
      alert("通信に失敗しました。");
    }
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
  };

  const myCurrentKeeps = keepDates
    .filter(kd => kd.facility === user.name && kd.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#4a3728', fontSize: '28px'}}>📅 希望日のキープ！</h2>
          <p style={{fontSize:'16px', color:'#7a6b5d', marginTop: '6px', fontWeight: '500'}}>カレンダーの日付をポチポチ選んでキープしてください</p>
        </div>
        <div style={navGroup}>
          <button onClick={prevMonth} style={iconBtnStyle}>◀</button>
          <span style={monthLabel}>{year}年 {month + 1}月</span>
          <button onClick={nextMonth} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(w => (
          <div key={w} style={weekHeaderStyle}>{w}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={i} style={emptyDayStyle}></div>;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = getStatus(dateStr);
          const label = getDynamicLabel(dateStr);

          const config = {
            'keeping': { bg: '#fff9e6', border: '#d4a017', color: '#8b6508', label: '選択中' },
            'my-booked': { bg: '#f0f9f1', border: '#2d6a4f', color: '#1b4332', label: '確定済' },
            'finished': { bg: '#f1f1f1', border: '#d1d1d1', color: '#7a6b5d', label: label || '訪問済' }, 
            'ng': { bg: '#fff5f5', border: '#e53e3e', color: '#c53030', label: '×' },
            'other-booked': { bg: '#fafafa', border: '#e2e8f0', color: '#94a3b8', label: '予約済' },
            'other-keep': { bg: '#fafafa', border: '#e2e8f0', color: '#94a3b8', label: '他施設' },
            'past': { bg: '#fcfcfc', border: '#f1f1f1', color: '#d1d1d1', label: '-' },
            'outside': { bg: '#fcfcfc', border: '#f1f1f1', color: '#d1d1d1', label: '×' },
            'available': { bg: 'white', border: '#e2d6cc', color: '#8b5e3c', label: '○' }
          };
          const style = config[status];

          return (
            <div 
              key={i} 
              onClick={() => handleDateClick(day)}
              style={{
                ...dayStyle,
                cursor: (status === 'available' || status === 'keeping') ? 'pointer' : 'default',
                backgroundColor: style.bg,
                borderBottom: `3px solid ${style.border}`,
                borderRight: `1px solid ${style.border}`,
                opacity: status === 'finished' ? 0.85 : 1,
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                <span style={{...dayNumStyle, color: (status === 'available' || status === 'keeping' || status === 'my-booked') ? '#4a3728' : '#cbd5e0'}}>{day}</span>
                <span style={{fontSize: '12px', fontWeight: '900', color: style.color}}>{style.label}</span>
              </div>
              <div style={statusTextStyle}>
                {status === 'keeping' && <span style={{fontSize: '28px', color: '#d4a017'}}>★</span>}
                {status === 'my-booked' && <span style={{fontSize: '22px'}}>🌿</span>}
                {status === 'finished' && (
                  <span style={{fontSize: '18px', color: '#7a6b5d', fontWeight: '800'}}>
                    {label === '終了処理済' ? '📜' : '☕'}
                  </span>
                )}
                {status === 'available' && <span style={{fontSize: '26px', color: '#e2d6cc'}}>○</span>}
              </div>
            </div>
          );
        })}
      </div>

      <footer style={footerAreaStyle}>
        <div style={legendArea}>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#fff9e6', border:'1px solid #d4a017'}}></span> 選択中</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#f0f9f1', border:'1px solid #2d6a4f'}}></span> 確定済</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#f1f1f1', border:'1px solid #d1d1d1'}}></span> 訪問済/終了済</div>
        </div>

        {myCurrentKeeps.length > 0 && (
          <div style={nextActionBox}>
            <div style={keepBadgeList}>
              <span style={{fontSize:'18px', fontWeight:'900', marginRight:'12px', color: '#4a3728'}}>{month + 1}月のキープ：</span>
              {myCurrentKeeps.map(k => (
                <span key={k.date} style={keepBadge}>{formatShortDate(k.date)}</span>
              ))}
            </div>
            <button onClick={() => setPage('confirm')} style={confirmBtnStyle}>
              利用者様の選択へ進む ➔
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

// 🎨 スタイル設定（ブラウザ拡大対応版）
const containerStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  height: 'auto', // 固定高さを解除
  minHeight: '100%', // ページ全体を満たす
  gap: '15px', 
  fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif',
  paddingBottom: '40px' // 下部に余裕を持たせる
};

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px 30px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '20px' };
const iconBtnStyle = { padding: '10px 22px', border: '2px solid #e0d6cc', borderRadius: '14px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#4a3728', fontSize: '18px', transition: '0.2s' };
const monthLabel = { fontSize: '26px', fontWeight: '800', color: '#4a3728', minWidth: '160px', textAlign: 'center' };

// 🌟 カレンダーグリッド：高さを固定せず、中身の大きさに合わせる設定に変更
const calendarGrid = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(7, 1fr)', 
  backgroundColor: '#e2d6cc', 
  gap: '1px', 
  border: '2px solid #e2d6cc', 
  borderRadius: '20px', 
  overflow: 'hidden' 
};

const weekHeaderStyle = { 
  backgroundColor: '#f9f7f5', 
  padding: '16px 0', 
  textAlign: 'center', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontWeight: '800', 
  color: '#5d4037', 
  fontSize: '16px', 
  borderBottom: '2px solid #e2d6cc' 
};

const dayStyle = { 
  padding: '12px', 
  minHeight: '120px', // 少し高さを広げて余裕を持たせる
  display: 'flex', 
  flexDirection: 'column', 
  transition: '0.3s', 
  backgroundColor: 'white' 
};

const emptyDayStyle = { backgroundColor: '#faf9f8' };
const dayNumStyle = { fontSize: '20px', fontWeight: '800' };
const statusTextStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const footerAreaStyle = { 
  marginTop: '20px', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

const legendArea = { display: 'flex', gap: '30px', justifyContent: 'center', backgroundColor: 'white', padding: '14px', borderRadius: '35px' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#5d4037', fontWeight: 'bold' };
const dot = { width: '16px', height: '16px', borderRadius: '5px' };

const nextActionBox = { backgroundColor: 'white', padding: '28px 40px', borderRadius: '25px', boxShadow: '0 8px 25px rgba(74, 55, 40, 0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e0d6cc' };
const keepBadgeList = { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' };
const keepBadge = { backgroundColor: '#fff9e6', color: '#8b6508', padding: '8px 18px', borderRadius: '12px', fontSize: '16px', fontWeight: '800', border: '2px solid #d4a017' };
const confirmBtnStyle = { backgroundColor: '#4a3728', color: 'white', border: 'none', padding: '18px 45px', borderRadius: '20px', fontSize: '20px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 15px rgba(74, 55, 40, 0.3)', transition: '0.3s' };