import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function FacilityKeepDate_PC({ 
  user, 
  keepDates = [], 
  bookingList = [], 
  ngDates = [], 
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

  // 日付の状態判定（スマホ版のロジックを完全再現）
  const getStatus = (dateStr) => {
    if (dateStr < todayStr) return 'past'; 
    if (ngDates.includes(dateStr)) return 'ng'; 
    if (bookingList.some(b => b.date === dateStr && b.facility === user.name)) return 'my-booked'; 
    if (keepDates.some(k => k.date === dateStr && k.facility === user.name)) return 'keeping'; 
    if (bookingList.some(b => b.date === dateStr)) return 'other-booked'; 
    if (keepDates.some(k => k.date === dateStr && k.facility !== user.name)) return 'other-keep';
    if (checkDateSelectable && !checkDateSelectable(dateStr)) return 'outside';
    return 'available';
  };

  // 🌟【クラウド同期版】キープの切り替え（エラーの原因となった time を削除）
  const handleDateClick = async (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = getStatus(dateStr);

    // 選択不可条件のガード
    if (status === 'past') { alert('過去の日付は選択できません。'); return; }
    if (status === 'ng') { alert('美容師の都合により予約できない日です。'); return; }
    if (status === 'my-booked') { alert('この日は既に予約が確定しています。'); return; }
    if (status === 'other-booked' || status === 'other-keep') { alert('他の施設が予約・キープ済みです。'); return; }
    if (status === 'outside') { alert('予約受付時間外、または定休日です。'); return; }

    try {
      if (status === 'keeping') {
        // 🌟 削除：スマホ版と同じ match 条件
        const { error } = await supabase
          .from('keep_dates')
          .delete()
          .match({ date: dateStr, facility: user.name });
        
        if (error) throw error;
      } else {
        // 🌟 追加：スマホ版と同じ payload (time を含めない)
        const payload = { date: dateStr, facility: user.name };
        const { error } = await supabase
          .from('keep_dates')
          .upsert(payload); // upsert を使用

        if (error) throw error;
      }
      if (refreshAllData) refreshAllData();
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

  // 現在の月の自分のキープ一覧
  const myCurrentKeeps = keepDates
    .filter(kd => kd.facility === user.name && kd.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>📅 希望日のキープ！</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>カレンダーの日付をポチポチ選んでキープしてください</p>
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

          const config = {
            'keeping': { bg: '#fffbeb', border: '#f5a623', color: '#d97706', label: '選択中' },
            'my-booked': { bg: '#dcfce7', border: '#10b981', color: '#15803d', label: '確定済' },
            'ng': { bg: '#fee2e2', border: '#ef4444', color: '#ef4444', label: '×' },
            'other-booked': { bg: '#f1f5f9', border: '#cbd5e1', color: '#94a3b8', label: '予約済' },
            'other-keep': { bg: '#f1f5f9', border: '#cbd5e1', color: '#94a3b8', label: 'キープ済' },
            'past': { bg: '#f8fafc', border: '#e2e8f0', color: '#cbd5e1', label: '-' },
            'outside': { bg: '#f8fafc', border: '#e2e8f0', color: '#cbd5e1', label: '×' },
            'available': { bg: 'white', border: '#e2e8f0', color: '#3b82f6', label: '○' }
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
                border: `1px solid ${style.border}`,
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{...dayNumStyle, color: (status === 'available' || status === 'keeping' || status === 'my-booked') ? '#1e293b' : '#cbd5e1'}}>{day}</span>
                <span style={{fontSize: '10px', fontWeight: 'bold', color: style.color}}>{style.label}</span>
              </div>
              <div style={statusTextStyle}>
                {status === 'available' && <span style={{fontSize: '18px'}}>○</span>}
                {status === 'keeping' && <span style={{fontSize: '18px'}}>★</span>}
                {status === 'my-booked' && <span style={{fontSize: '12px'}}>✅</span>}
              </div>
            </div>
          );
        })}
      </div>

      <footer style={footerAreaStyle}>
        <div style={legendArea}>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#fffbeb', border:'1px solid #f5a623'}}></span> 選択中</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#dcfce7', border:'1px solid #10b981'}}></span> 予約確定済み</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#f1f5f9', border:'1px solid #cbd5e1'}}></span> 選択不可</div>
        </div>

        {myCurrentKeeps.length > 0 && (
          <div style={nextActionBox}>
            <div style={keepBadgeList}>
              <span style={{fontSize:'13px', fontWeight:'bold', marginRight:'10px'}}>{month + 1}月のキープ：</span>
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

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold', color: '#2d6a4f' };
const calendarGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: '#f1f5f9', gap: '2px', border: '2px solid #f1f5f9', borderRadius: '15px', overflow: 'hidden' };
const weekHeaderStyle = { backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '13px' };
const dayStyle = { padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', transition: '0.2s', backgroundColor: 'white' };
const emptyDayStyle = { backgroundColor: '#f8fafc' };
const dayNumStyle = { fontSize: '15px', fontWeight: 'bold' };
const statusTextStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const footerAreaStyle = { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' };
const legendArea = { display: 'flex', gap: '20px', justifyContent: 'center' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' };
const dot = { width: '12px', height: '12px', borderRadius: '3px' };
const nextActionBox = { backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const keepBadgeList = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' };
const keepBadge = { backgroundColor: '#fffbeb', color: '#d97706', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #f5a623' };
const confirmBtnStyle = { backgroundColor: '#f5a623', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(245,166,35,0.3)' };