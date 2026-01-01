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

  // 🌟 ポップアップ表示用のState
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupSortKey, setPopupSortKey] = useState('room'); 
  const [doneSortKey, setDoneSortKey] = useState('room'); 

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
          <p style={{fontSize:'14px', color:'#64748b'}}>施設ごとの進捗確認と、月末の終了処理を行えます</p>
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
                  // 進捗計算
                  const finishedOnDayCount = historyList.filter(h => h.date === item.date.replace(/-/g, '/') && h.facility === facility).length;
                  const cancelOnDayCount = item.members?.filter(m => m.status === 'cancel').length || 0;
                  
                  const totalCount = item.members?.length || 0;
                  const isPast = item.date < todayStr;

                  return (
                    <div key={idx} 
                      onClick={() => isConfirmed && setSelectedDetail({ ...item, facility })}
                      style={{...itemCard, borderLeft: `6px solid ${isConfirmed ? '#10b981' : '#3b82f6'}`, opacity: isPast ? 0.7 : 1, cursor: isConfirmed ? 'pointer' : 'default'}}>
                      <div style={{fontWeight:'bold'}}>{item.date.replace(/-/g, '/')}({getDayName(item.date)})</div>
                      <div style={{fontSize:'12px', marginTop:'5px'}}>
                        {isConfirmed ? (
                          <>
                            <div style={{color: '#059669'}}>✅ 確定済 ({finishedOnDayCount + cancelOnDayCount}/{totalCount})</div>
                            <div style={{fontSize: '10px', color: '#64748b'}}>詳細を表示</div>
                          </>
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

      {/* 🌟 施術状況詳細ポップアップ */}
      {selectedDetail && (() => {
        const { facility, date } = selectedDetail;
        const dateSlash = date.replace(/-/g, '/');
        
        // 当日の履歴
        const finishedOnDay = historyList.filter(h => h.date === dateSlash && h.facility === facility);
        
        // この日のリスト（予約メンバー + 当日追加分）
        const currentMembers = selectedDetail.members || [];
        const extraNames = finishedOnDay.filter(h => !currentMembers.some(m => m.name === h.name)).map(h => ({
          name: h.name, room: h.room, isExtra: true, status: 'done', menu: h.menu
        }));

        const candidates = [...currentMembers, ...extraNames];
        
        const doneList = candidates.filter(m => m.status === 'done' || finishedOnDay.some(h => h.name === m.name));
        const cancelList = candidates.filter(m => m.status === 'cancel');
        const yetList = candidates.filter(m => m.status === 'yet' && !finishedOnDay.some(h => h.name === m.name));

        // 🌟 変数定義（エラー修正箇所）
        const doneCount = doneList.length;

        const sortFn = (list, key) => [...list].sort((a, b) => 
          key === 'room' ? a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true }) 
                         : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja')
        );

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
               <div style={modalHeaderStyle}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#1e3a8a' }}>施術状況詳細</h3>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>🏠 {facility} / {date.replace(/-/g, '/')}</p>
                  </div>
                  <button onClick={() => setSelectedDetail(null)} style={closeXStyle}>×</button>
               </div>
               
               <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                  {/* 完了リスト */}
                  <div style={finishedDayBoxStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={finishedDayTitleStyle}>✅ 終了した方 ({doneCount}名)</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setDoneSortKey('room')} style={{ ...miniSortBtnStyle, backgroundColor: doneSortKey === 'room' ? '#10b981' : 'white', color: doneSortKey === 'room' ? 'white' : '#10b981', borderColor: '#10b981' }}>部屋</button>
                        <button onClick={() => setDoneSortKey('name')} style={{ ...miniSortBtnStyle, backgroundColor: doneSortKey === 'name' ? '#10b981' : 'white', color: doneSortKey === 'name' ? 'white' : '#10b981', borderColor: '#10b981' }}>名前</button>
                      </div>
                    </div>
                    {sortFn(doneList, doneSortKey).map((m, i) => (
                      <div key={i} style={memberRowStyle}>
                        <span>{m.room} <b>{m.name} 様</b> {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span>
                        <span style={finishedBadgeStyle}>完了</span>
                      </div>
                    ))}
                  </div>

                  {/* 欠席リスト */}
                  {cancelList.length > 0 && (
                    <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3', marginBottom: '15px' }}>
                      <div style={{ ...finishedDayTitleStyle, color: '#e11d48' }}>🚩 欠席（キャンセル）の方 ({cancelList.length}名)</div>
                      {sortFn(cancelList, popupSortKey).map((m, i) => (
                        <div key={i} style={{ ...memberRowStyle, opacity: 0.7 }}>
                          <span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span>
                          <span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>欠席</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 未完了リスト */}
                  <div style={remainingBoxStyle}>
                    <div style={remainingHeaderStyle}>
                      <span>⏳ 未完了の方 ({yetList.length}名)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setPopupSortKey('room')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='room'?'#2d6a4f':'white', color: popupSortKey==='room'?'white':'#2d6a4f', borderColor: '#2d6a4f'}}>部屋</button>
                        <button onClick={() => setPopupSortKey('name')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='name'?'#2d6a4f':'white', color: popupSortKey==='name'?'white':'#2d6a4f', borderColor: '#2d6a4f'}}>名前</button>
                      </div>
                    </div>
                    {yetList.length === 0 ? (
                      <p style={allDoneTextStyle}>🎉 全員の施術が完了しました！</p>
                    ) : (
                      sortFn(yetList, popupSortKey).map((m, i) => (
                        <div key={i} style={memberRowStyle}>
                          <span>{m.room} <b>{m.name} 様</b></span>
                          <span style={menuBadgeStyle}>待機中</span>
                        </div>
                      ))
                    )}
                  </div>
               </div>
               <button onClick={() => setSelectedDetail(null)} style={closeBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 🎨 スタイル定義
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold' };
const scrollArea = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' };
const facilitySection = { backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const facilityHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const allCancelBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' };
const itemCard = { padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', transition: 'transform 0.1s', border: '1px solid #e2e8f0' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer', lineHeight: '1' };
const finishedDayBoxStyle = { marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' };
const finishedDayTitleStyle = { fontSize: '13px', fontWeight: 'bold', color: '#64748b' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '15px' };
const finishedBadgeStyle = { fontSize: '11px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '8px' };
const remainingBoxStyle = { padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '2px solid #2d6a4f' };
const remainingHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#2d6a4f', fontSize: '15px', fontWeight: 'bold' };
const allDoneTextStyle = { textAlign: 'center', color: '#2d6a4f', fontSize: '15px', padding: '10px', fontWeight: 'bold' };
const menuBadgeStyle = { fontSize: '11px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: '8px' };
const extraBadgeStyle = { fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' };
const miniSortBtnStyle = { border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtnStyle = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };