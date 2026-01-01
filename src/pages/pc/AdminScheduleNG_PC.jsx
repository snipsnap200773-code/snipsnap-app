import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function AdminScheduleNG_PC({ 
  ngDates = [], 
  setNgDates, 
  keepDates = [], 
  bookingList = [], 
  historyList = [],
  checkDateSelectable 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: lastDate }, (_, i) => i + 1);

  // 🌟 施設ごとのカラーパレット
  const colorPalette = [
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // 青
    { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, // オレンジ
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // 緑
    { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // 紫
    { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }, // 黄
    { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }, // ピンク
    { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }, // グレー
  ];

  const getFacilityColor = (name) => {
    if (!name) return { bg: '#f8f9fa', text: '#cbd5e1', border: '#e2e8f0' };
    let charSum = 0;
    for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
    return colorPalette[charSum % colorPalette.length];
  };

  // 🌟【クラウド同期】NG日の切り替え
  const toggleNG = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // ガードレール
    if (dateStr < todayStr) return;
    if (checkDateSelectable && !checkDateSelectable(dateStr)) {
      alert("規定の定休日、または選択不可な期間です。");
      return;
    }

    const isKeep = keepDates.some(kd => kd.date === dateStr);
    const isConfirmed = bookingList.some(b => b.date === dateStr);
    
    if (isConfirmed) {
      alert("この日は既に予約が【確定】しているため、休みに変更できません。");
      return;
    }
    if (isKeep) {
      alert("この日は施設が【キープ】しているため、休みに設定できません。");
      return;
    }

    if (ngDates.includes(dateStr)) {
      const { error } = await supabase.from('ng_dates').delete().eq('date', dateStr);
      if (!error) setNgDates(ngDates.filter(d => d !== dateStr));
    } else {
      const { error } = await supabase.from('ng_dates').upsert({ date: dateStr });
      if (!error) setNgDates([...ngDates, dateStr]);
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📅 予約受付(NG日)管理</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>日付をクリックして「美容室の休み(×)」を切り替えます</p>
        </div>
        <div style={navGroup}>
          <button onClick={() => changeMonth(-1)} style={iconBtnStyle}>◀</button>
          <span style={monthLabel}>{year}年 {month + 1}月</span>
          <button onClick={() => changeMonth(1)} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(w => (
          <div key={w} style={weekHeaderStyle}>{w}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} style={emptyDayStyle}></div>)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const isNG = ngDates.includes(dateStr);
          const keepInfo = keepDates.find(kd => kd.date === dateStr);
          const confirmedInfo = bookingList.find(b => b.date === dateStr);
          const pastVisit = historyList.find(h => h.date.replace(/\//g, '-') === dateStr);
          
          const fName = pastVisit?.facility || confirmedInfo?.facility || keepInfo?.facility;
          const fColors = getFacilityColor(fName);

          return (
            <div 
              key={day} 
              onClick={() => toggleNG(day)}
              style={{
                ...dayStyle,
                backgroundColor: isNG ? '#fee2e2' : (fName ? fColors.bg : (isPast ? '#f8fafc' : 'white')),
                cursor: (isPast || keepInfo || confirmedInfo) ? 'default' : 'pointer',
                opacity: isPast ? 0.6 : 1,
                border: isNG ? '2px solid #ef4444' : (confirmedInfo ? `1px solid ${fColors.border}` : '1px solid #e2e8f0'),
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <span style={{fontWeight:'bold', color: isNG ? '#ef4444' : '#1e293b'}}>{day}</span>
                {isNG && <span style={{color:'#ef4444', fontWeight:'bold', fontSize:'18px'}}>×</span>}
              </div>
              
              <div style={infoContainer}>
                {fName && (
                  <div style={{...badgeStyle, color: fColors.text, backgroundColor: 'rgba(255,255,255,0.5)'}}>
                    {confirmedInfo ? '✅' : (keepInfo ? '⏳' : '')} {fName}
                  </div>
                )}
                {!fName && !isNG && !isPast && <div style={{fontSize:'10px', color:'#cbd5e1'}}>受付中</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={legendStyle}>
        <div style={legendItem}><span style={{...dot, backgroundColor:'#ef4444'}}></span> 休み(NG)</div>
        <div style={legendItem}><span style={{...dot, backgroundColor:'#3b82f6'}}></span> 施設予約あり</div>
        <div style={legendItem}><span style={{...dot, backgroundColor:'#f8fafc', border:'1px solid #ddd'}}></span> 過去</div>
      </div>
    </div>
  );
}

// 🎨 スタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' };
const calendarGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: '#f1f5f9', gap: '2px', border: '2px solid #f1f5f9', borderRadius: '15px', overflow: 'hidden' };
const weekHeaderStyle = { backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '13px' };
const dayStyle = { padding: '10px', minHeight: '100px', display: 'flex', flexDirection: 'column', transition: '0.2s', backgroundColor: 'white' };
const emptyDayStyle = { backgroundColor: '#f8fafc' };
const infoContainer = { marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' };
const badgeStyle = { fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const legendStyle = { display: 'flex', gap: '20px', padding: '10px' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' };
const dot = { width: '10px', height: '10px', borderRadius: '50%' };