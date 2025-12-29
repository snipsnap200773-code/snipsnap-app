import React, { useState } from 'react';
import { Layout } from './Layout';
import { createClient } from '@supabase/supabase-js'; // 🌟 追加

// 🌟 Supabase接続
import { supabase } from './supabase';

export default function KeepDate({ 
  keepDates, 
  setKeepDates, 
  bookingList = [], 
  ngDates = [], 
  setPage, 
  checkDateSelectable,
  user 
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { year, month, firstDay, days };
  };

  const { year, month, firstDay, days } = getDaysInMonth(viewDate);
  const calendarDays = Array.from({ length: firstDay + days }, (_, i) => 
    i < firstDay ? null : i - firstDay + 1
  );

  const changeMonth = (offset) => {
    const newDate = new Date(year, month + offset, 1);
    setViewDate(newDate);
  };

  // 🌟【クラウド同期版】キープの切り替え
  const toggleDate = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (dateStr < todayStr) {
      alert('過去の日付は選択できません。');
      return;
    }

    const isAlreadyBooked = bookingList.some(b => b.date === dateStr);
    if (isAlreadyBooked) {
      alert('この日は既に予約が確定しているため、選択できません。');
      return;
    }

    if (!checkDateSelectable(dateStr)) {
      alert('現在は予約受付時間外、または定休日です。');
      return;
    }

    if (ngDates.includes(dateStr)) {
      alert('申し訳ありません。この日は美容師の都合により予約できません。');
      return;
    }

    const otherKeep = keepDates.find(kd => kd.date === dateStr && kd.facility !== user.name);
    if (otherKeep) {
      alert('この日は他の施設が既にキープしています。');
      return;
    }

    const myKeepIndex = keepDates.findIndex(kd => kd.date === dateStr && kd.facility === user.name);
    
    let newKeep;
    if (myKeepIndex > -1) {
      // 🌟【削除】クラウドから消す
      const { error } = await supabase
        .from('keep_dates')
        .delete()
        .match({ date: dateStr, facility: user.name });

      if (!error) {
        newKeep = [...keepDates];
        newKeep.splice(myKeepIndex, 1);
        setKeepDates(newKeep);
      }
    } else {
      // 🌟【追加】クラウドへ保存
      const payload = { date: dateStr, facility: user.name };
      const { error } = await supabase.from('keep_dates').upsert(payload);

      if (!error) {
        newKeep = [...keepDates, payload].sort((a, b) => a.date.localeCompare(b.date));
        setKeepDates(newKeep);
      }
    }
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
  };

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

  const myCurrentKeeps = keepDates
    .filter(kd => kd.facility === user.name && kd.date.startsWith(currentMonthKey))
    .map(kd => kd.date);

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ width: '100%', textAlign: 'center', paddingBottom: '40px' }}>
          
          <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f', margin: 0 }}>希望日のキープ</h1>
            <span style={{ fontSize: '11px', color: '#666', fontWeight: 'bold' }}>○:可能 ×:不可</span>
          </header>

          <div style={calendarCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => changeMonth(-1)} style={navBtnStyle}>◀</button>
              <div style={{ fontWeight: 'bold', color: '#2d6a4f', fontSize: '18px' }}>
                {year}年 {month + 1}月
              </div>
              <button onClick={() => changeMonth(1)} style={navBtnStyle}>▶</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                <div key={d} style={{ fontSize: '11px', color: '#bbb', marginBottom: '5px' }}>{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i}></div>;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const isPast = dateStr < todayStr;
                const isMyConfirmed = bookingList.some(b => b.date === dateStr && b.facility === user.name);
                const isOthersConfirmed = bookingList.some(b => b.date === dateStr && b.facility !== user.name);
                const isMySelected = keepDates.some(kd => kd.date === dateStr && kd.facility === user.name);
                const isOthersSelected = keepDates.some(kd => kd.date === dateStr && kd.facility !== user.name);
                
                const isBlocked = isPast || isOthersConfirmed || isOthersSelected || !checkDateSelectable(dateStr) || ngDates.includes(dateStr);

                return (
                  <div 
                    key={i} 
                    onClick={() => !isMyConfirmed && !isBlocked && toggleDate(day)} 
                    style={{
                      padding: '12px 0', 
                      borderRadius: '14px',
                      backgroundColor: isMyConfirmed ? '#10b981' : (isMySelected ? '#f5a623' : (isBlocked ? '#f1f1f1' : '#fff')),
                      border: isMyConfirmed ? '1px solid #059669' : (isMySelected ? '1px solid #d97706' : '1px solid #e2e8f0'),
                      color: (isMyConfirmed || isMySelected) ? 'white' : (isBlocked ? '#ccc' : '#2d6a4f'),
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      cursor: (isBlocked || isMyConfirmed) ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {day}
                    <div style={{ fontSize: '8px', marginTop: '1px' }}>
                      {isMyConfirmed ? '確定済' : (isMySelected ? '選択中' : (isBlocked ? '×' : '○'))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '25px' }}>
             <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>■ 確定済</div>
             <div style={{ fontSize: '11px', color: '#f5a623', fontWeight: 'bold' }}>■ 選択中</div>
             <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 'bold' }}>■ 不可</div>
          </div>

          {myCurrentKeeps.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <div style={badgeContainerStyle}>
                <span style={{fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px'}}>
                  {month + 1}月の選択中の日程
                </span>
                <div style={{display:'flex', flexWrap:'wrap', gap:'5px', justifyContent:'center'}}>
                  {myCurrentKeeps.map(d => (
                    <span key={d} style={dateBadgeStyle}>{formatShortDate(d)}</span>
                  ))}
                </div>
              </div>
              
              <button onClick={() => setPage('confirm')} style={confirmBtnStyle}>
                利用者様の選択へ
              </button>
            </div>
          )}
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>
    </div>
  );
}

// デザインスタイル（以前のものを維持）
const calendarCardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '20px', width: '100%', boxSizing: 'border-box' };
const navBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#2d6a4f', padding: '10px 15px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };
const badgeContainerStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '20px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', boxSizing: 'border-box' };
const dateBadgeStyle = { backgroundColor: '#fdf2f2', color: '#b5838d', padding: '4px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #f9dcc4' };
const confirmBtnStyle = { width: '100%', backgroundColor: '#f5a623', color: 'white', border: 'none', padding: '20px', borderRadius: '22px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };