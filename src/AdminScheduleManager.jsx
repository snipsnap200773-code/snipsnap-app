import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase'; 

export default function AdminScheduleManager({ 
  keepDates = [], 
  setKeepDates, 
  bookingList = [], 
  setBookingList, 
  historyList = [], 
  setPage,
  allUsers = [],
  selectedMembers = [] 
}) {
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupSortKey, setPopupSortKey] = useState('room'); 
  const [doneSortKey, setDoneSortKey] = useState('room');  

  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE');

  const getDayName = (dateStr) => {
    if (!dateStr) return "";
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/\//g, '-')).getDay()];
  };

  const canDeleteDate = (facility, date) => {
    const isFinished = historyList.some(h => h.date === date.replace(/-/g, '/') && h.facility === facility);
    return !isFinished;
  };

  const handleAllCancel = async (facility, monthKey) => {
    const monthLabel = monthKey.replace('-', '年');
    if (!window.confirm(`${facility} の ${monthLabel}月分を「全枠終了」として処理しますか？\n（未完了の方が全員「欠席」になり、枠がロックされます）`)) return;

    try {
      const monthKeySlash = monthKey.replace(/-/g, '/');
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
          const isFinished = historyList.some(h => h.name === m.name && h.date.startsWith(monthKeySlash));
          return isFinished ? m : { ...m, status: 'cancel' };
        });
        const { data, error } = await supabase.from('bookings').upsert({
          id: safeId, facility, date, members: updatedMembers
        }, { onConflict: 'id' }).select();
        if (!error && data) newUpdatedBookings.push(data[0]);
      }
      setBookingList(prev => {
        const otherBookings = prev.filter(b => !(b.facility === facility && b.date.startsWith(monthKey)));
        return [...otherBookings, ...newUpdatedBookings];
      });
      alert("一括処理が完了しました。");
    } catch (err) { alert("通信エラーが発生しました。"); }
  };

  const deleteOneBooking = async (facility, date, isConfirmed) => {
    if (!canDeleteDate(facility, date)) {
      alert("既に一部の施術が完了しているため、この日の予約は削除できません。");
      return;
    }
    if (window.confirm(`${facility} の ${date.replace(/-/g, '/')} の予定を消去しますか？`)) {
      try {
        const safeId = `${facility}-${date}`.replace(/\//g, '-');
        await supabase.from('bookings').delete().eq('id', safeId);
        await supabase.from('keep_dates').delete().match({ facility, date });
        setBookingList(prev => prev.filter(b => !(b.facility === facility && b.date === date)));
        setKeepDates(prev => prev.filter(kd => !(kd.facility === facility && kd.date === date)));
      } catch (err) { alert("消去に失敗しました。"); }
    }
  };

  const visibleMonths = (() => {
    const d1 = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1);
    const d2 = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);
    const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return [format(d1), format(d2)];
  })();

  const allDataFlat = (() => {
    const combined = [];
    const processedDates = new Set();
    (bookingList || []).forEach(b => {
      combined.push({ ...b, confirmed: true });
      processedDates.add(`${b.facility}-${b.date}`);
    });
    (keepDates || []).forEach(kd => {
      if (!processedDates.has(`${kd.facility}-${kd.date}`)) combined.push({ ...kd, confirmed: false, members: [] });
    });
    return combined;
  })();

  const groupedData = allDataFlat.reduce((acc, b) => {
    const mKey = b.date?.substring(0, 7);
    if (!b.date || !visibleMonths.includes(mKey)) return acc;
    const facility = b.facility || "不明な施設";
    if (!acc[facility]) acc[facility] = {};
    if (!acc[facility][mKey]) acc[facility][mKey] = [];
    acc[facility][mKey].push(b);
    return acc;
  }, {});

  const sortedFacilityNames = Object.keys(groupedData).sort((a, b) => {
    const getEarliestTarget = (facName) => {
      let dates = [];
      Object.keys(groupedData[facName]).forEach(m => dates.push(...groupedData[facName][m].map(item => item.date)));
      const futureDates = dates.filter(d => d >= todayStr).sort();
      return futureDates.length > 0 ? futureDates[0] : dates.sort().reverse()[0];
    };
    return getEarliestTarget(a).localeCompare(getEarliestTarget(b));
  });

  const getFacilityColor = (name) => {
    const colorPalette = [
      { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, 
      { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, 
      { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }, { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }, 
    ];
    if (!name) return { bg: '#f8f9fa', text: '#cbd5e1', border: '#e2e8f0' };
    let charSum = 0;
    for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
    return colorPalette[charSum % colorPalette.length];
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4', paddingBottom: '100px' }}>
      <Layout>
        <div style={{ width: '100%', padding: '20px 0' }}>
          <header style={{ marginBottom: '25px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>【管理者】予約状況一覧</h1>
          </header>

          <div style={monthNavContainerStyle}>
            <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1))} style={monthNavBtnStyle}>◀</button>
            <div style={monthTitleStyle}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月 〜</div>
            <button onClick={() => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1))} style={monthNavBtnStyle}>▶</button>
          </div>

          {sortedFacilityNames.map(facility => {
            const fColors = getFacilityColor(facility);
            return (
              <div key={facility} style={{ marginBottom: '40px' }}>
                <h2 style={{ ...facilityHeaderStyle, backgroundColor: fColors.bg, color: fColors.text, border: `1px solid ${fColors.border}` }}>🏠 {facility}</h2>
                {Object.keys(groupedData[facility]).sort().map(monthKey => {
                  const rawItems = groupedData[facility][monthKey];
                  const monthBookings = bookingList.filter(b => b.facility === facility && b.date.startsWith(monthKey));
                  const plannedMemberNames = new Set(monthBookings.flatMap(b => b.members?.map(m => m.name) || []));
                  const facilityUsersCount = allUsers.filter(u => u.facility === facility).length;
                  const basePlannedCount = plannedMemberNames.size > 0 ? plannedMemberNames.size : facilityUsersCount;

                  const statsMap = {};
                  let runningProcessedCount = 0;
                  [...rawItems].sort((a, b) => a.date.localeCompare(b.date)).forEach(item => {
                    const finishedOnDay = historyList.filter(h => h.date === item.date.replace(/-/g, '/') && h.facility === facility);
                    const cancelledOnDay = item.members?.filter(m => m.status === 'cancel') || [];
                    const extraOnDayCount = finishedOnDay.filter(h => !plannedMemberNames.has(h.name) && !allUsers.some(u => u.name === h.name && u.facility === facility)).length;
                    const dayProcessedCount = finishedOnDay.length + cancelledOnDay.length;
                    statsMap[item.date] = { 
                      planned: basePlannedCount + extraOnDayCount, 
                      processed: runningProcessedCount + dayProcessedCount,
                      finished: finishedOnDay.length + cancelledOnDay.length
                    };
                    runningProcessedCount += dayProcessedCount;
                  });

                  return (
                    <div key={monthKey} style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>📅 {monthKey.replace('-', '年 ')}月 分</h3>
                        <button onClick={() => handleAllCancel(facility, monthKey)} style={allCancelBtnStyle}>一括キャンセル（終了処理）</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {rawItems.sort((a, b) => a.date.localeCompare(b.date)).map((item, idx) => {
                          const isPast = item.date < todayStr;
                          const stats = statsMap[item.date];
                          const isAllMonthFinished = stats.processed >= stats.planned && stats.planned > 0;
                          const shouldDisable = isPast || isAllMonthFinished;

                          return (
                            <div key={idx} style={{ 
                                ...dayBoxStyle, 
                                borderLeft: `6px solid ${shouldDisable ? '#cbd5e1' : (item.confirmed ? fColors.border : '#3b82f6')}`, 
                                opacity: shouldDisable ? 0.5 : 1, 
                                backgroundColor: shouldDisable ? '#f1f5f9' : 'white',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: shouldDisable ? '#64748b' : '#1e293b' }}>
                                    {item.date.replace(/-/g, '/')}({getDayName(item.date)})
                                  </div>
                                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    {item.confirmed ? (
                                      <span style={{ color: shouldDisable ? '#94a3b8' : (stats.finished > 0 ? '#059669' : '#64748b') }}>
                                        ✅ {isAllMonthFinished ? "今月分は終了しました" : `進捗: ${stats.processed} / ${stats.planned}`}
                                      </span>
                                    ) : <span style={{ color: shouldDisable ? '#94a3b8' : '#3b82f6' }}>● キープ中（未確定）</span>}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {item.confirmed && !isAllMonthFinished && (
                                    <button onClick={() => setSelectedDetail({ ...item, facility, allMonthlyPlannedMembers: Array.from(new Set(rawItems.flatMap(ri => ri.members || []))) })} style={{...detailBtnStyle, backgroundColor: '#3b82f6'}}>詳細</button>
                                  )}
                                  {canDeleteDate(facility, item.date) && (
                                    <button onClick={() => deleteOneBooking(facility, item.date, item.confirmed)} style={{ ...actionBtnStyle, backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444' }}>削除</button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>

      {selectedDetail && (() => {
        const { facility, date, allMonthlyPlannedMembers } = selectedDetail;
        const monthKey = date.substring(0, 7);
        const dateSlash = date.replace(/-/g, '/');
        const monthHistory = historyList.filter(h => h.date.startsWith(monthKey.replace(/-/g, '/')) && h.facility === facility);
        
        // 🌟 本日より前に終わった人たちを抽出
        const finishedBeforeToday = monthHistory.filter(h => h.date < dateSlash);
        const finishedBeforeTodayNames = finishedBeforeToday.map(h => h.name);
        
        // 当日追加の人を特定
        const allExtraInMonth = monthHistory.filter(h => !allMonthlyPlannedMembers.some(m => m.name === h.name));
        
        // 候補者リスト：月間予定者 + 当日追加者
        const candidates = [...allMonthlyPlannedMembers, ...allExtraInMonth.map(h => ({ ...h, isExtra: true, menus: [h.menu] }))]
          .filter((m, i, self) => self.findIndex(t => t.name === m.name) === i);

        // 1. 本日終了した人
        const finishedOnDay = monthHistory.filter(h => h.date === dateSlash);
        const doneToday = candidates.filter(m => finishedOnDay.some(h => h.name === m.name))
          .map(m => ({ ...m, menu: finishedOnDay.find(fh => fh.name === m.name).menu }));

        // 2. 本日より前に終わった人（三土手さんのリクエスト：1/3に終了した人など）
        const doneOtherDays = candidates.filter(m => finishedBeforeTodayNames.includes(m.name))
          .map(m => ({ ...m, doneDate: finishedBeforeToday.find(fh => fh.name === m.name).date }));

        // 3. キャンセル（欠席）した人
        const cancelList = candidates.filter(m => m.status === 'cancel' && !doneToday.some(d => d.name === m.name) && !doneOtherDays.some(d => d.name === m.name));

        // 4. まだ終わっていない人（当日・過去日・キャンセルのどれにもいない人）
        const yetList = candidates.filter(m => 
          !doneToday.some(h => h.name === m.name) && 
          !doneOtherDays.some(h => h.name === m.name) && 
          m.status !== 'cancel'
        );

        const sortFn = (list, key) => [...list].sort((a, b) => key === 'room' ? a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true }) : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja'));

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                  <div><h3 style={{ margin: 0, fontSize: '18px', color: '#1e3a8a' }}>施術状況詳細</h3><p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>🏠 {facility} / {date.replace(/-/g, '/')}</p></div>
                  <button onClick={() => setSelectedDetail(null)} style={closeXStyle}>×</button>
                </div>
                <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '5px' }}>
                  
                  {/* ✅ 本日終了 */}
                  {doneToday.length > 0 && (
                    <div style={finishedDayBoxStyle}>
                      <div style={sectionTitleStyle}>✅ 本日終了 ({doneToday.length}名)</div>
                      {sortFn(doneToday, doneSortKey).map((m, i) => (
                        <div key={i} style={memberRowStyle}>
                          <span>{m.room} <b>{m.name} 様</b> {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span>
                          <span style={finishedBadgeStyle}>{m.menu} 完了</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 📅 別日程で終了済み（三土手さんのリクエスト枠） */}
                  {doneOtherDays.length > 0 && (
                    <div style={{...finishedDayBoxStyle, backgroundColor: '#f1f5f9'}}>
                      <div style={{...sectionTitleStyle, color: '#475569'}}>📅 別日程で終了済み ({doneOtherDays.length}名)</div>
                      {sortFn(doneOtherDays, doneSortKey).map((m, i) => (
                        <div key={i} style={memberRowStyle}>
                          <span>{m.room} <b>{m.name} 様</b></span>
                          <span style={{...finishedBadgeStyle, backgroundColor: '#e2e8f0', color: '#64748b'}}>{m.doneDate} 済</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🚩 キャンセル（欠席）枠 */}
                  {cancelList.length > 0 && (
                    <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
                      <div style={{ ...sectionTitleStyle, color: '#e11d48' }}>🚩 欠席（キャンセル） ({cancelList.length}名)</div>
                      {sortFn(cancelList, popupSortKey).map((m, i) => (
                        <div key={i} style={{ ...memberRowStyle, opacity: 0.7 }}>
                          <span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span>
                          <span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>欠席</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ⏳ 未完了 */}
                  <div style={remainingBoxStyle}>
                    <div style={remainingHeaderStyle}>
                      <span>⏳ 未完了の方 ({yetList.length}名)</span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => setPopupSortKey('room')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='room'?'#2d6a4f':'white', color: popupSortKey==='room'?'white':'#2d6a4f'}}>部屋</button>
                        <button onClick={() => setPopupSortKey('name')} style={{...miniSortBtnStyle, backgroundColor: popupSortKey==='name'?'#2d6a4f':'white', color: popupSortKey==='name'?'white':'#2d6a4f'}}>名前</button>
                      </div>
                    </div>
                    {yetList.length === 0 ? <p style={allDoneTextStyle}>🎉 全員の施術が完了しました！</p> : sortFn(yetList, popupSortKey).map((m, i) => <div key={i} style={memberRowStyle}><span>{m.room} <b>{m.name} 様</b> {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span><div style={{display:'flex', gap:'4px'}}>{m.menus?.map(menu => <span key={menu} style={menuBadgeStyle}>{menu}</span>)}</div></div>)}
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

// 🎨 デザイン定数（追加・変更分のみ抜粋）
const sectionTitleStyle = { fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' };
const dayBoxStyle = { padding: '12px 15px', borderRadius: '15px', border: '1px solid #e2e8f0', transition: 'all 0.2s' };
const detailBtnStyle = { color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const allCancelBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };
const monthNavContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px', backgroundColor: 'white', padding: '12px', borderRadius: '16px' };
const monthNavBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#1e3a8a', padding: '8px 15px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' };
const monthTitleStyle = { fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' };
const facilityHeaderStyle = { fontSize: '18px', padding: '12px 20px', borderRadius: '15px', marginBottom: '10px', fontWeight: 'bold' };
const cardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '500px', borderRadius: '32px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer' };
const finishedDayBoxStyle = { marginBottom: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center', fontSize: '14px' };
const finishedBadgeStyle = { fontSize: '10px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' };
const remainingBoxStyle = { padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '18px', border: '2px solid #2d6a4f' };
const remainingHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#2d6a4f', fontSize: '14px', fontWeight: 'bold' };
const allDoneTextStyle = { textAlign: 'center', color: '#2d6a4f', fontSize: '14px', padding: '10px', fontWeight: 'bold' };
const menuBadgeStyle = { fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '6px', border: '1px solid #86efac' };
const extraBadgeStyle = { fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' };
const miniSortBtnStyle = { border: '1px solid #2d6a4f', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtnStyle = { width: '100%', marginTop: '20px', padding: '18px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
const actionBtnStyle = { border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };