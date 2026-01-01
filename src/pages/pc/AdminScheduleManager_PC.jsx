import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function AdminScheduleManager_PC({ 
  keepDates = [], 
  setKeepDates, 
  bookingList = [], 
  setBookingList, 
  historyList = [], 
  allUsers = [] 
}) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE');

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/-/g, '/')).getDay()];
  };

  // 一括キャンセル（終了処理）ロジック
  const handleAllCancel = async (facility, monthKey) => {
    const monthLabel = monthKey.replace('-', '年');
    if (!window.confirm(`${facility} の ${monthLabel}月分を「全枠終了」として処理しますか？\n（未完了の方が全員「欠席」になり、枠がロックされます）`)) return;

    try {
      const facilityUsers = allUsers.filter(u => u.facility === facility);
      const monthDates = Array.from(new Set([
        ...bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey)).map(b => b.date),
        ...keepDates.filter(kd => kd.facility === facility && kd.date.startsWith(monthKey)).map(kd => kd.date)
      ]));

      const newUpdatedBookings = [];
      for (const date of monthDates) {
        const safeId = `${facility}-${date}`.replace(/\//g, '-');
        const existingBooking = bookingList.find(b => b.facility === facility && b.date === date);
        const targetMembers = existingBooking ? existingBooking.members : facilityUsers.map(u => ({
          id: u.id, name: u.name, room: u.room, kana: u.kana, status: 'yet', menus: ['カット']
        }));

        const updatedMembers = targetMembers.map(m => {
          const isFinished = historyList.some(h => h.name === m.name && h.date === date.replace(/-/g, '/'));
          return isFinished ? m : { ...m, status: 'cancel' };
        });

        const { data, error } = await supabase.from('bookings').upsert({
          id: safeId, facility, date, members: updatedMembers
        }).select();

        if (!error && data) newUpdatedBookings.push(data[0]);
      }

      setBookingList(prev => {
        const otherBookings = prev.filter(b => !(b.facility === facility && b.date.startsWith(monthKey)));
        return [...otherBookings, ...newUpdatedBookings];
      });
      alert("一括処理が完了しました。");
    } catch (err) {
      alert("エラーが発生しました。");
    }
  };

  // 表示する月の範囲
  const monthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  
  // 施設ごとにデータをまとめる
  const facilities = Array.from(new Set([...bookingList, ...keepDates].map(item => item.facility)));

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📊 予約・進捗管理マスター (PC)</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>施設ごとの進捗確認と、月末の終了処理（一括キャンセル）を行えます</p>
        </div>
        <div style={navGroup}>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} style={iconBtnStyle}>◀</button>
          <span style={monthLabel}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月</span>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={scrollArea}>
        {facilities.sort().map(facility => {
          const items = [...bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey)), 
                         ...keepDates.filter(kd => kd.facility === facility && kd.date.startsWith(monthKey))]
                         .sort((a, b) => a.date.localeCompare(b.date));
          
          if (items.length === 0) return null;

          return (
            <div key={facility} style={facilitySection}>
              <div style={facilityHeader}>
                <h3 style={{margin:0}}>🏠 {facility}</h3>
                <button onClick={() => handleAllCancel(facility, monthKey)} style={allCancelBtnStyle}>今月の終了処理（一括欠席）</button>
              </div>
              <div style={gridStyle}>
                {items.map((item, idx) => {
                  const isConfirmed = !!item.members;
                  const finishedCount = item.members?.filter(m => m.status === 'done').length || 0;
                  const totalCount = item.members?.length || 0;
                  const isPast = item.date < todayStr;

                  return (
                    <div key={idx} style={{...itemCard, borderLeft: `6px solid ${isConfirmed ? '#10b981' : '#3b82f6'}`, opacity: isPast ? 0.7 : 1}}>
                      <div style={{fontWeight:'bold'}}>{item.date.replace(/-/g, '/')}({getDayName(item.date)})</div>
                      <div style={{fontSize:'13px', marginTop:'5px'}}>
                        {isConfirmed ? (
                          <span style={{color: '#059669'}}>✅ 予約確定済 ({finishedCount}/{totalCount})</span>
                        ) : (
                          <span style={{color: '#3b82f6'}}>⏳ キープ中</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// スタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold' };
const scrollArea = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' };
const facilitySection = { backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const facilityHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const allCancelBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' };
const itemCard = { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px' };