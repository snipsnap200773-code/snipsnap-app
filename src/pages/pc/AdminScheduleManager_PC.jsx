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
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/-/g, '/')).getDay()];
  };

  // 一括キャンセル（終了処理）ロジック
  const handleAllCancel = async (facility, monthKey) => {
    const monthLabel = monthKey.replace('-', '年');
    if (!window.confirm(`${facility} の ${monthLabel}月分を「全枠終了」として処理しますか？\n（施術完了済みの方は残ります。未完了の方は「欠席」になり、枠がロックされます）`)) return;

    try {
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
  
  // 🌟 施設リストを bookingList, keepDates, historyList 全てから抽出
  const facilitiesRaw = Array.from(new Set([
    ...bookingList.map(b => b.facility),
    ...keepDates.map(k => k.facility),
    ...historyList.map(h => h.facility)
  ])).filter(Boolean);

  // 🌟【重要：並び替えロジック】一番日が近い予約順に並べる
  const sortedFacilities = facilitiesRaw.sort((facA, facB) => {
    // それぞれの施設における「今月の最初の日付」を見つける
    const getFirstDate = (facName) => {
      const allDates = [
        ...bookingList.filter(b => b.facility === facName && b.date.startsWith(monthKey)).map(b => b.date),
        ...keepDates.filter(k => k.facility === facName && k.date.startsWith(monthKey)).map(k => k.date)
      ].sort();
      return allDates.length > 0 ? allDates[0] : "9999-99-99"; // 日付がない施設は最後に飛ばす
    };

    const firstA = getFirstDate(facA);
    const firstB = getFirstDate(facB);
    return firstA.localeCompare(firstB);
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📊 予約・進捗管理マスター (PC)</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>施設ごとの進捗確認と、月末の終了処理を行えます（直近予約順）</p>
        </div>
        <div style={navGroup}>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} style={iconBtnStyle}>◀</button>
          <span style={monthLabelStyle}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月</span>
          <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={scrollArea}>
        {sortedFacilities.map(facility => {
          const historyDates = historyList
            .filter(h => h.facility === facility && h.date.startsWith(monthKey.replace(/-/g, '/')))
            .map(h => h.date.replace(/\//g, '-'));

          const items = [
            ...bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey)), 
            ...keepDates.filter(kd => kd.facility === facility && kd.date.startsWith(monthKey)),
            ...historyDates.map(d => ({ date: d, facility, members: [] })) 
          ].sort((a, b) => a.date.localeCompare(b.date));
          
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

          return (
            <div key={facility} style={facilitySection}>
              <div style={facilityHeader}>
                <h3 style={{margin:0}}>🏠 {facility}</h3>
                <button onClick={() => handleAllCancel(facility, monthKey)} style={allCancelBtnStyle}>今月の終了処理（一括欠席）</button>
              </div>
              <div style={gridStyle}>
                {uniqueItems.map((item, idx) => {
                  const dateSlash = formatDateForCompare(item.date);
                  const finishedOnDayCount = historyList.filter(h => h.date === dateSlash && h.facility === facility).length;
                  const realBooking = bookingList.find(b => b.date === item.date && b.facility === facility);
                  const isConfirmed = !!realBooking;
                  
                  const cancelOnDayCount = realBooking?.members?.filter(m => m.status === 'cancel').length || 0;
                  const totalCount = realBooking?.members?.length || allUsers.filter(u => u.facility === facility).length;
                  
                  const isBatchFinished = isConfirmed && (finishedOnDayCount + cancelOnDayCount >= totalCount) && cancelOnDayCount > 0;
                  const isPast = item.date < todayStr;

                  return (
                    <div key={idx} 
                      onClick={() => isConfirmed && setSelectedDetail({ ...realBooking, facility })}
                      style={{...itemCard, borderLeft: `6px solid ${isConfirmed ? '#10b981' : '#3b82f6'}`, opacity: isPast ? 0.7 : 1, cursor: isConfirmed ? 'pointer' : 'default'}}>
                      <div style={{fontWeight:'bold'}}>{dateSlash}({getDayName(item.date)})</div>
                      <div style={{fontSize:'12px', marginTop:'5px'}}>
                        {isConfirmed ? (
                          <>
                            <div style={{color: isBatchFinished ? '#ef4444' : '#059669', fontWeight: 'bold'}}>
                              {isBatchFinished ? '🚩 終了処理済' : '✅ 確定済'} ({finishedOnDayCount + cancelOnDayCount}/{totalCount})
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

      {selectedDetail && (() => {
        const { facility, date } = selectedDetail;
        const dateSlash = formatDateForCompare(date);
        const finishedOnDay = historyList.filter(h => h.date === dateSlash && h.facility === facility);
        const currentMembers = selectedDetail.members || [];
        const extraMembers = finishedOnDay
          .filter(h => !currentMembers.some(m => m.name === h.name))
          .map(h => ({ name: h.name, room: h.room, kana: h.kana, isExtra: true, status: 'done', menus: [h.menu] }));

        const allCandidates = [...currentMembers, ...extraMembers];
        const doneList = allCandidates.filter(m => finishedOnDay.some(h => h.name === m.name));
        const cancelList = allCandidates.filter(m => m.status === 'cancel');

        const sortFn = (list, key) => [...list].sort((a, b) => 
          key === 'room' ? String(a.room).localeCompare(String(b.room), undefined, { numeric: true }) 
                         : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja')
        );

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
               <div style={modalHeaderStyle}>
                 <div><h3 style={{ margin: 0, fontSize: '20px', color: '#1e3a8a' }}>施術状況詳細</h3><p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>🏠 {facility} / {dateSlash}</p></div>
                 <button onClick={() => setSelectedDetail(null)} style={closeXStyle}>×</button>
               </div>
               <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
                 <div style={finishedDayBoxStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={finishedDayTitleStyle}>✅ 終了した方 ({doneList.length}名)</div>
                    </div>
                    {sortFn(doneList, doneSortKey).map((m, i) => (
                      <div key={i} style={memberRowStyle}><span>{m.room} <b>{m.name} 様</b></span><span style={finishedBadgeStyle}>完了</span></div>
                    ))}
                 </div>
                 {cancelList.length > 0 && (
                   <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
                     <div style={{ ...finishedDayTitleStyle, color: '#e11d48' }}>🚩 キャンセルの方 ({cancelList.length}名)</div>
                     {sortFn(cancelList, popupSortKey).map((m, i) => (
                       <div key={i} style={{ ...memberRowStyle, opacity: 0.7 }}><span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span><span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>欠席</span></div>
                     ))}
                   </div>
                 )}
               </div>
               <button onClick={() => setSelectedDetail(null)} style={closeBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 🎨 スタイル設定（変更なし）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabelStyle = { fontSize: '20px', fontWeight: 'bold' };
const scrollArea = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' };
const facilitySection = { backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const facilityHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' };
const allCancelBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' };
const itemCard = { padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '24px', padding: '30px' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer' };
const finishedDayBoxStyle = { marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2d6cc' };
const finishedDayTitleStyle = { fontSize: '13px', fontWeight: 'bold', color: '#64748b' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '15px' };
const finishedBadgeStyle = { fontSize: '11px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '8px' };
const closeBtnStyle = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };