import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function AdminScheduleManager_PC({ 
  keepDates = [], 
  setKeepDates, 
  bookingList = [], 
  setBookingList, 
  historyList = [], 
  allUsers = [],
  refreshAllData 
}) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE');

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupSortKey, setPopupSortKey] = useState('room'); 
  const [doneSortKey, setDoneSortKey] = useState('room'); 

  const formatDateForCompare = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.replace(/-/g, '/');
  };

  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/-/g, '/')).getDay()];
  };

  // 一括キャンセル（終了処理）ロジック
  const handleAllCancel = async (facility, monthKey) => {
    const monthLabel = monthKey.replace('-', '年');
    if (!window.confirm(`${facility} の ${monthLabel}月分を「全枠終了」として処理しますか？\n（施術完了済みの方は残ります。未完了の方は「欠席」になり、枠がロックされます）`)) return;

    try {
      const monthKeySlash = monthKey.replace(/-/g, '/');
      const facilityUsers = allUsers.filter(u => u.facility === facility);
      const monthDates = Array.from(new Set([
        ...bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey)).map(b => b.date),
        ...keepDates.filter(kd => kd.facility === facility && kd.date.startsWith(monthKey)).map(kd => kd.date)
      ]));

      for (const date of monthDates) {
        const safeId = `${facility}-${date}`.replace(/\//g, '-');
        const dateSlash = formatDateForCompare(date);
        const finishedOnDay = historyList.filter(h => h.date === dateSlash && h.facility === facility);

        const updatedMembers = facilityUsers.map(u => {
          const hasFinished = finishedOnDay.some(h => h.name === u.name);
          return {
            id: u.id, name: u.name, room: u.room, kana: u.kana,
            status: hasFinished ? 'done' : 'cancel',
            menus: hasFinished ? [finishedOnDay.find(h => h.name === u.name).menu] : ['カット']
          };
        });

        await supabase.from('bookings').upsert({
          id: safeId, facility, date, members: updatedMembers, status: 'confirmed'
        });
      }
      if (refreshAllData) await refreshAllData();
      alert("今月の終了処理（一括キャンセル）が完了しました。");
    } catch (err) {
      alert("処理中にエラーが発生しました。");
    }
  };

  const monthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  
  // 施設リストを抽出
  const facilities = Array.from(new Set([
    ...bookingList.map(b => b.facility),
    ...keepDates.map(k => k.facility),
    ...historyList.map(h => h.facility)
  ])).filter(Boolean);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📊 予約・進捗管理マスター (PC)</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>施設ごとの進捗確認と、月末の終了処理を行えます</p>
        </div>
        <div style={navGroup}>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} style={iconBtnStyle}>◀</button>
          <span style={monthLabelStyle}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月</span>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={scrollArea}>
        {facilities.sort().map(facility => {
          // 履歴データからも日付を拾う
          const monthKeySlash = monthKey.replace(/-/g, '/');
          const historyDates = historyList
            .filter(h => h.facility === facility && h.date.startsWith(monthKeySlash))
            .map(h => h.date.replace(/\//g, '-'));

          const items = [
            ...bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey)), 
            ...keepDates.filter(kd => kd.facility === facility && kd.date.startsWith(monthKey)),
            ...historyDates.map(d => ({ date: d, facility, members: [] }))
          ].sort((a, b) => a.date.localeCompare(b.date));
          
          // 重複削除
          const uniqueItems = items.reduce((acc, current) => {
            const existing = acc.find(item => item.date === current.date);
            if (!existing) {
              acc.push(current);
            } else if (current.members && current.members.length > 0) {
              const idx = acc.findIndex(item => item.date === current.date);
              acc[idx] = current;
            }
            return acc;
          }, []);

          if (uniqueItems.length === 0) return null;

          // 🌟【最重要：月間集計ロジックの修正】
          const monthBookings = bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey));
          const plannedMemberNamesSet = new Set(monthBookings.flatMap(b => b.members?.map(m => m.name) || []));
          const monthHistory = historyList.filter(h => h.facility === facility && h.date.startsWith(monthKeySlash));
          
          const cancelledMemberNamesSet = new Set();
          monthBookings.forEach(b => {
            b.members?.forEach(m => { if (m.status === 'cancel') cancelledMemberNamesSet.add(m.name); });
          });

          const allUniqueNamesInMonth = new Set([...plannedMemberNamesSet, ...monthHistory.map(h => h.name)]);
          const totalPlannedInMonth = allUniqueNamesInMonth.size;
          const totalDoneInMonthCount = Array.from(allUniqueNamesInMonth).filter(name => 
            monthHistory.some(h => h.name === name) || cancelledMemberNamesSet.has(name)
          ).length;

          return (
            <div key={facility} style={facilitySection}>
              <div style={facilityHeader}>
                <h3 style={{margin:0}}>🏠 {facility}</h3>
                <button onClick={() => handleAllCancel(facility, monthKey)} style={allCancelBtnStyle}>今月の終了処理（一括欠席）</button>
              </div>
              <div style={gridStyle}>
                {uniqueItems.map((item, idx) => {
                  const dateSlash = formatDateForCompare(item.date);
                  const realBooking = bookingList.find(b => b.date === item.date && b.facility === facility);
                  const isConfirmed = !!realBooking;
                  const isPast = item.date < todayStr;
                  const isAllMonthFinished = totalDoneInMonthCount >= totalPlannedInMonth && totalPlannedInMonth > 0;

                  return (
                    <div key={idx} 
                      onClick={() => isConfirmed && setSelectedDetail({ ...realBooking, facility, allMonthlyPlannedMembers: Array.from(plannedMemberNamesSet) })}
                      style={{
                        ...itemCard, 
                        borderLeft: `6px solid ${isAllMonthFinished ? '#10b981' : (isConfirmed ? '#10b981' : '#3b82f6')}`, 
                        backgroundColor: isAllMonthFinished ? '#f0fdf4' : '#f8fafc',
                        opacity: isPast && !isAllMonthFinished ? 0.7 : 1, 
                        cursor: isConfirmed ? 'pointer' : 'default'
                      }}>
                      <div style={{fontWeight:'bold'}}>{dateSlash}({getDayName(item.date)})</div>
                      <div style={{fontSize:'12px', marginTop:'5px'}}>
                        {isConfirmed ? (
                          <>
                            <div style={{color: isAllMonthFinished ? '#059669' : '#059669', fontWeight: 'bold'}}>
                              {isAllMonthFinished ? '✅ 今月分完了' : `月間進捗: ${totalDoneInMonthCount}/${totalPlannedInMonth}`}
                            </div>
                            <div style={{fontSize: '10px', color: '#64748b'}}>詳細を表示</div>
                          </>
                        ) : (
                          <span style={{color: '#3b82f6'}}>⏳ キープ中 (自動生成)</span>
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

      {/* 詳細ポップアップ */}
      {selectedDetail && (() => {
        const { facility, date, allMonthlyPlannedMembers } = selectedDetail;
        const monthKeySlash = date.substring(0, 7).replace(/-/g, '/');
        const dateSlash = formatDateForCompare(date);
        const monthHistory = historyList.filter(h => h.date.startsWith(monthKeySlash) && h.facility === facility);
        
        const finishedBeforeToday = monthHistory.filter(h => h.date < dateSlash);
        const finishedBeforeTodayNames = finishedBeforeToday.map(h => h.name);
        const allExtraInMonth = monthHistory.filter(h => !allMonthlyPlannedMembers.some(m => m === h.name));
        
        const candidates = [...(allMonthlyPlannedMembers.map(name => ({ name }))), ...allExtraInMonth.map(h => ({ name: h.name, isExtra: true }))]
          .filter((m, i, self) => self.findIndex(t => t.name === m.name) === i);

        const finishedOnDay = monthHistory.filter(h => h.date === dateSlash);
        const doneToday = candidates.filter(m => finishedOnDay.some(h => h.name === m.name))
          .map(m => ({ ...m, ...allUsers.find(u => u.name === m.name), menu: finishedOnDay.find(fh => fh.name === m.name).menu }));

        const doneOtherDays = candidates.filter(m => finishedBeforeTodayNames.includes(m.name))
          .map(m => ({ ...m, ...allUsers.find(u => u.name === m.name), doneDate: finishedBeforeToday.find(fh => fh.name === m.name).date }));

        const cancelList = candidates.filter(m => {
          const booking = bookingList.find(b => b.facility === facility && b.date.startsWith(date.substring(0, 7)));
          const mem = booking?.members?.find(bm => bm.name === m.name);
          return mem?.status === 'cancel' && !doneToday.some(d => d.name === m.name) && !doneOtherDays.some(d => d.name === m.name);
        }).map(m => ({...m, ...allUsers.find(u => u.name === m.name)}));

        const yetList = candidates.filter(m => 
          !doneToday.some(h => h.name === m.name) && 
          !doneOtherDays.some(h => h.name === m.name) && 
          !cancelList.some(c => c.name === m.name)
        ).map(m => ({...m, ...allUsers.find(u => u.name === m.name)}));

        const sortFn = (list, key) => [...list].sort((a, b) => 
          key === 'room' ? (a.room||'').toString().localeCompare((b.room||'').toString(), undefined, { numeric: true }) 
                         : (a.kana || a.name || '').localeCompare((b.kana || b.name || ''), 'ja')
        );

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
               <div style={modalHeaderStyle}>
                 <div><h3 style={{ margin: 0, fontSize: '20px', color: '#1e3a8a' }}>施術状況詳細</h3><p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>🏠 {facility} / {dateSlash}</p></div>
                 <button onClick={() => setSelectedDetail(null)} style={closeXStyle}>×</button>
               </div>
               <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                 
                 {/* ✅ 本日終了 */}
                 {doneToday.length > 0 && (
                   <div style={finishedDayBoxStyle}>
                      <div style={finishedDayTitleStyle}>✅ 本日終了 ({doneToday.length}名)</div>
                      {sortFn(doneToday, doneSortKey).map((m, i) => (
                        <div key={i} style={memberRowStyle}><span>{m.room} <b>{m.name} 様</b> {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span><span style={finishedBadgeStyle}>{m.menu} 完了</span></div>
                      ))}
                   </div>
                 )}

                 {/* 📅 他日程で終了済み */}
                 {doneOtherDays.length > 0 && (
                   <div style={{...finishedDayBoxStyle, backgroundColor: '#f1f5f9'}}>
                      <div style={{...finishedDayTitleStyle, color: '#475569'}}>📅 他の日程で終了済み ({doneOtherDays.length}名)</div>
                      {sortFn(doneOtherDays, doneSortKey).map((m, i) => (
                        <div key={i} style={memberRowStyle}><span>{m.room} <b>{m.name} 様</b></span><span style={{...finishedBadgeStyle, backgroundColor:'#e2e8f0', color:'#64748b'}}>{m.doneDate.split('/')[2]}日 完了</span></div>
                      ))}
                   </div>
                 )}

                 {/* 🚩 欠席 */}
                 {cancelList.length > 0 && (
                   <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
                     <div style={{ ...finishedDayTitleStyle, color: '#e11d48' }}>🚩 欠席（キャンセル） ({cancelList.length}名)</div>
                     {sortFn(cancelList, popupSortKey).map((m, i) => (
                       <div key={i} style={{ ...memberRowStyle, opacity: 0.7 }}><span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span><span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>欠席</span></div>
                     ))}
                   </div>
                 )}

                 {/* ⏳ 未完了 */}
                 <div style={remainingBoxStyle}>
                    <div style={remainingHeaderStyle}>
                      <span>⏳ 未完了の方 ({yetList.length}名)</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setPopupSortKey('room')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='room'?'#2d6a4f':'white', color: popupSortKey==='room'?'white':'#2d6a4f'}}>部屋順</button>
                        <button onClick={() => setPopupSortKey('name')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='name'?'#2d6a4f':'white', color: popupSortKey==='name'?'white':'#2d6a4f'}}>名前順</button>
                      </div>
                    </div>
                    {yetList.length === 0 ? <p style={allDoneTextStyle}>🎉 全員の施術が完了しました！</p> : sortFn(yetList, popupSortKey).map((m, i) => <div key={i} style={memberRowStyle}><span>{m.room} <b>{m.name} 様</b></span><div style={{display:'flex', gap:'4px'}}>{m.menus?.map(menu => <span key={menu} style={menuBadgeStyle}>{menu}</span>)}</div></div>)}
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

// 🎨 スタイル設定（完全維持）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabelStyle = { fontSize: '20px', fontWeight: 'bold' };
const scrollArea = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '50px' };
const facilitySection = { backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const facilityHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const allCancelBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' };
const itemCard = { padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'all 0.2s' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '30px' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer' };
const finishedDayBoxStyle = { marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' };
const finishedDayTitleStyle = { fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '15px' };
const finishedBadgeStyle = { fontSize: '11px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '8px' };
const remainingBoxStyle = { padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '16px', border: '2px solid #2d6a4f' };
const remainingHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#2d6a4f', fontSize: '15px', fontWeight: 'bold' };
const allDoneTextStyle = { textAlign: 'center', color: '#2d6a4f', fontSize: '15px', padding: '10px', fontWeight: 'bold' };
const menuBadgeStyle = { fontSize: '11px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: '8px' };
const extraBadgeStyle = { fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' };
const miniSortBtnStyle = { border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtnStyle = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };