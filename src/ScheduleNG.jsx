import React, { useState } from 'react';
import { Layout } from './Layout';
import { createClient } from '@supabase/supabase-js'; // 🌟 追加

// 🌟 Supabase接続
import { supabase } from './supabase';

export default function ScheduleNG({ 
  ngDates = [], 
  setNgDates, 
  keepDates = [], 
  bookingList = [], 
  historyList = [], 
  setPage, 
  checkDateSelectable 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: lastDate }, (_, i) => i + 1);

  const colorPalette = [
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // 1. 青
    { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, // 2. オレンジ
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // 3. 緑
    { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // 4. 紫
    { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }, // 5. 黄
    { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }, // 6. ピンク
    { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }, // 7. グレー
  ];

  const getFacilityColor = (name) => {
    if (!name) return { bg: '#f8f9fa', text: '#cbd5e1', border: '#e2e8f0' };
    let charSum = 0;
    for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
    const colorIndex = charSum % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // 🌟【クラウド同期版】NG日の切り替え
  const toggleNG = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < todayStr) return;
    if (!checkDateSelectable(dateStr)) {
      alert("現在はスケジュール更新期間外、または規定の定休日です。");
      return;
    }

    const isKeep = keepDates.some(kd => kd.date === dateStr);
    const isConfirmed = bookingList.some(b => b.date === dateStr);
    
    if (isConfirmed) {
      alert("この日は既に予約が【確定】しているため、お休みに変更できません。");
      return;
    }
    if (isKeep) {
      alert("この日は施設が【キープ】しているため、お休みに設定できません。");
      return;
    }

    if (ngDates.includes(dateStr)) {
      // 🌟【削除】クラウドから消す
      const { error } = await supabase
        .from('ng_dates')
        .delete()
        .eq('date', dateStr);

      if (!error) {
        setNgDates(ngDates.filter(d => d !== dateStr));
      }
    } else {
      // 🌟【追加】クラウドへ保存
      const { error } = await supabase
        .from('ng_dates')
        .upsert({ date: dateStr });

      if (!error) {
        setNgDates([...ngDates, dateStr]);
      }
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  // --- 以下、表示ロジックとデザインは完全維持 ---

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ width: '100%', textAlign: 'center', paddingBottom: '40px' }}>
          <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
              スケジュール(NG日)管理
            </h1>
          </header>

          <div style={calendarCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => changeMonth(-1)} style={navBtnStyle}>◀</button>
              <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}>
                {year}年 {month + 1}月
              </div>
              <button onClick={() => changeMonth(1)} style={navBtnStyle}>▶</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                <div key={d} style={{ fontSize: '11px', color: '#bbb', marginBottom: '5px', textAlign: 'center' }}>{d}</div>
              ))}
              {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
              {days.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isPastOrToday = dateStr < todayStr;
                const isSelectable = checkDateSelectable(dateStr);
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
                      padding: '4px 0',
                      minHeight: '70px',
                      borderRadius: '10px',
                      backgroundColor: isNG ? '#ef4444' : (fName ? fColors.bg : (isPastOrToday ? '#f8f9fa' : (isSelectable ? '#fff' : '#f1f1f1'))),
                      border: isNG ? '1px solid #ef4444' : (confirmedInfo || pastVisit ? `1px solid ${fColors.border}` : (keepInfo ? `2px dashed ${fColors.text}` : '1px solid #e2e8f0')),
                      cursor: (isPastOrToday || !isSelectable || keepInfo || confirmedInfo) ? 'default' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      opacity: keepInfo ? 0.9 : 1
                    }}
                  >
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '13px',
                      color: isNG ? '#fff' : (fName ? fColors.text : (isPastOrToday ? '#cbd5e1' : '#1e3a8a'))
                    }}>
                      {day}
                    </span>
                    <div style={{ 
                      fontSize: '9px', 
                      marginTop: '4px', 
                      fontWeight: 'bold',
                      color: isNG ? '#fff' : (fName ? fColors.text : (isPastOrToday ? '#cbd5e1' : '#1e3a8a')),
                      width: '95%',
                      textAlign: 'center',
                      wordBreak: 'break-all',
                      lineHeight: '1.1'
                    }}>
                      {isNG ? '×' : (
                        pastVisit ? `✅${pastVisit.facility}` : (
                          confirmedInfo ? confirmedInfo.facility : (
                            keepInfo ? `⏳${keepInfo.facility}` : (
                              !isSelectable ? '定休' : ''
                            )
                          )
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
             <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>※ 施設ごとにハッキリとした7色で色分けされます</div>
             <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>⏳＝キープ中(点線)</div>
             <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>■＝休み</div>
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

const calendarCardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '20px', width: '95%', margin: '0 auto', boxSizing: 'border-box' };
const navBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#1e3a8a', padding: '10px 14px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };