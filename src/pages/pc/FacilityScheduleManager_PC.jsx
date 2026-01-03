import React, { useState } from 'react';

export default function FacilityScheduleManager_PC({ 
  keepDates = [], 
  bookingList = [], 
  historyList = [], 
  user 
}) {
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupSortKey, setPopupSortKey] = useState('room');
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  // --- 共通ロジック ---
  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/-/g, '/')).getDay()];
  };

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  const monthKeySlash = currentMonthKey.replace(/-/g, '/');

  // 🌟 1. データの統合（キープ・確定・履歴すべてを「日付」で合体させる）
  const myKeeps = keepDates.filter(kd => kd.facility === user.name).map(kd => ({ date: kd.date, confirmed: false, members: [] }));
  const myBookings = bookingList.filter(b => b.facility === user.name).map(b => ({ ...b, confirmed: true }));
  
  // 🌟 履歴がある日も「訪問済」として表示するために日付を抽出
  const historyDates = historyList
    .filter(h => h.facility === user.name && h.date.startsWith(monthKeySlash))
    .map(h => h.date.replace(/\//g, '-'));

  // 全ての日付を統合して重複を排除
  const allDateKeys = Array.from(new Set([
    ...myKeeps.map(k => k.date),
    ...myBookings.map(b => b.date),
    ...historyDates
  ])).filter(d => d && d.startsWith(currentMonthKey)).sort();

  const visibleItems = allDateKeys.map(date => {
    const booking = myBookings.find(b => b.date === date);
    const keep = myKeeps.find(k => k.date === date);
    return booking || keep || { date, confirmed: true, members: [] }; // 履歴のみの日もconfirmed扱いにする
  });

  const formatShortDate = (d) => `${d.replace(/-/g, '/')}(${getDayName(d)})`;

  // --- 進捗計算ロジック ---
  const finishedInThisMonth = historyList.filter(h => h.date.startsWith(monthKeySlash) && h.facility === user.name);
  const monthBookings = bookingList.filter(b => b.date.startsWith(currentMonthKey) && b.facility === user.name);
  const allPlannedInMonth = Array.from(new Set(monthBookings.flatMap(b => b.members || []).map(m => m.name)))
    .map(name => monthBookings.flatMap(b => b.members || []).find(m => m.name === name));

  let runningProcessedCount = 0;
  const statsMap = {};
  visibleItems.forEach(item => {
    const dateSlashForH = item.date.replace(/-/g, '/');
    const finishedOnDay = finishedInThisMonth.filter(h => h.date === dateSlashForH);
    const cancelledOnDay = item.members?.filter(m => m.status === 'cancel').length || 0;
    const extraOnDay = finishedOnDay.filter(h => !allPlannedInMonth.some(m => m.name === h.name));
    const dayProcessedCount = finishedOnDay.length + cancelledOnDay;
    
    statsMap[item.date] = {
      planned: allPlannedInMonth.length + extraOnDay.length,
      processed: runningProcessedCount + dayProcessedCount,
      finished: dayProcessedCount
    };
    runningProcessedCount += dayProcessedCount;
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📊 予約スケジュール・進捗確認</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>月ごとの施術進捗と各日程の詳細を確認できます</p>
        </div>
        <div style={monthNavStyle}>
          <button onClick={() => changeViewMonth(-1)} style={navBtn}>◀</button>
          <span style={monthLabel}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月</span>
          <button onClick={() => changeViewMonth(1)} style={navBtn}>▶</button>
        </div>
      </header>

      <div style={noticeStyle}>
        ⚠️ 当日、急遽メンバーを追加したい場合は、施術スタッフ（三土手）まで直接お申し付けください。
      </div>

      <div style={gridStyle}>
        {visibleItems.length === 0 ? (
          <div style={emptyStyle}>📅 この月に予約・キープはありません。</div>
        ) : (
          visibleItems.map((item, idx) => {
            const stats = statsMap[item.date];
            const isToday = item.date === todayStr;
            const isPast = item.date < todayStr;
            // 🌟 終了判定（分母が0より大きく、かつ分母と分子が一致）
            const isAllFinished = stats.planned > 0 && stats.processed >= stats.planned;
            const shouldDisable = isPast || isAllFinished;

            return (
              <div key={idx} style={{
                ...statusCardStyle,
                backgroundColor: shouldDisable ? '#f8fafc' : (isToday ? '#fffbeb' : '#ffffff'),
                border: isToday && !isAllFinished ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                opacity: shouldDisable ? 0.8 : 1
              }}>
                <div style={cardHeader}>
                  <span style={{fontSize:'18px', fontWeight:'bold', color: shouldDisable ? '#64748b' : '#1e3a8a'}}>{formatShortDate(item.date)}</span>
                  {isToday && <span style={todayBadge}>本日</span>}
                </div>
                
                <div style={cardContent}>
                  {item.confirmed ? (
                    <div style={{color: isAllFinished ? '#94a3b8' : '#059669', fontWeight: 'bold'}}>
                      {isAllFinished ? "🏁 訪問済（完了）" : `⏳ 進捗：${stats.processed} / ${stats.planned} 名`}
                    </div>
                  ) : (
                    <div style={{color:'#3b82f6'}}>● キープ中（未確定）</div>
                  )}
                  
                  {item.confirmed && stats.planned > 0 && (
                    <div style={progressBarContainer}>
                      <div style={{
                        ...progressBar, 
                        width: `${Math.min((stats.processed / stats.planned) * 100, 100)}%`,
                        backgroundColor: isAllFinished ? '#94a3b8' : '#3b82f6'
                      }}></div>
                    </div>
                  )}
                </div>

                {item.confirmed && !isAllFinished && (
                  <button 
                    onClick={() => setSelectedDetail({ ...item, allPlannedInMonth })} 
                    style={detailBtn}
                  >
                    詳細・名簿を確認 ➔
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 詳細モーダルは以前の最強ロジックを維持 */}
      {selectedDetail && (() => {
        const { date, members: plannedMembers, allPlannedInMonth } = selectedDetail;
        const monthKey = date.substring(0, 7);
        const dateSlash = date.replace(/-/g, '/');
        const monthHistory = historyList.filter(h => h.date.startsWith(monthKey.replace(/-/g, '/')) && h.facility === user.name);
        const finishedBeforeTodayNames = monthHistory.filter(h => h.date < dateSlash).map(h => h.name);
        const finishedOnDay = monthHistory.filter(h => h.date === dateSlash);
        const allExtraInMonth = monthHistory.filter(h => !allPlannedInMonth.some(m => m.name === h.name)).map(h => ({ name: h.name, room: h.room, kana: h.kana, isExtra: true, menus: [h.menu], status: 'done' }));
        const candidates = [...plannedMembers, ...allExtraInMonth].filter((m, i, self) => self.findIndex(t => t.name === m.name) === i && !finishedBeforeTodayNames.includes(m.name));
        const doneMembers = candidates.filter(m => finishedOnDay.some(fh => fh.name === m.name)).map(m => ({ ...m, menu: finishedOnDay.find(fh => fh.name === m.name).menu }));
        const cancelMembers = candidates.filter(m => m.status === 'cancel' && !doneMembers.some(d => d.name === m.name));
        const remainingMembers = candidates.filter(m => !finishedOnDay.some(fh => fh.name === m.name) && m.status !== 'cancel');
        const sortFn = (list) => [...list].sort((a, b) => popupSortKey === 'room' ? String(a.room).localeCompare(String(b.room), undefined, { numeric: true }) : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja'));

        return (
          <div style={modalOverlay} onClick={() => setSelectedDetail(null)}>
            <div style={modalContent} onClick={e => e.stopPropagation()}>
              <div style={modalHeader}>
                <div><h3 style={{ margin: 0, fontSize: '20px', color: '#1e3a8a' }}>施術状況詳細</h3><p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>🏠 {user.name} / {date.replace(/-/g, '/')}</p></div>
                <button onClick={() => setSelectedDetail(null)} style={closeBtn}>×</button>
              </div>
              <div style={modalScrollArea}>
                {doneMembers.length > 0 && (
                  <div style={finishedDayBoxStyle}>
                    <div style={finishedDayTitleStyle}>✅ 本日終了した方 ({doneMembers.length}名)</div>
                    {sortFn(doneMembers).map((m, i) => <div key={i} style={finishedMemberRowStyle}><span>{m.room} {m.name} 様 {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span><span style={finishedBadgeStyle}>{m.menu}</span></div>)}
                  </div>
                )}
                {cancelMembers.length > 0 && (
                  <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
                    <div style={{...finishedDayTitleStyle, color: '#e11d48'}}>🚩 キャンセルの方 ({cancelMembers.length}名)</div>
                    {sortFn(cancelMembers).map((m, i) => <div key={i} style={{ ...finishedMemberRowStyle, opacity: 0.7 }}><span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span><span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>欠席</span></div>)}
                  </div>
                )}
                <div style={remainingBoxStyle}>
                  <div style={remainingHeaderStyle}>
                    <span>⏳ 未完了の方 ({remainingMembers.length}名)</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setPopupSortKey('room')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'room' ? '#2d6a4f' : 'white', color: popupSortKey === 'room' ? 'white' : '#2d6a4f' }}>部屋</button>
                      <button onClick={() => setPopupSortKey('name')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'name' ? '#2d6a4f' : 'white', color: popupSortKey === 'name' ? 'white' : '#2d6a4f' }}>名前</button>
                    </div>
                  </div>
                  {remainingMembers.length === 0 ? <p style={allDoneTextStyle}>🎉 全員の施術が完了しました！</p> : sortFn(remainingMembers).map((m, i) => (
                    <div key={i} style={remainingMemberRowStyle}><span>{m.room} <b>{m.name} 様</b></span><div style={{display:'flex', gap:'4px'}}>{m.menus?.map(menu => <span key={menu} style={menuBadgeStyle}>{menu}</span>)}</div></div>
                  ))}
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} style={bottomCloseBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 🎨 スタイル定義（変更なし）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const monthLabel = { fontSize: '18px', fontWeight: 'bold' };
const navBtn = { padding: '5px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' };
const noticeStyle = { padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', overflowY: 'auto' };
const statusCardStyle = { padding: '20px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const todayBadge = { backgroundColor: '#f59e0b', color: 'white', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: 'bold' };
const cardContent = { flex: 1 };
const progressBarContainer = { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginTop: '12px', overflow: 'hidden' };
const progressBar = { height: '100%', transition: '0.5s' };
const detailBtn = { padding: '12px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' };
const emptyStyle = { gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#94a3b8' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' };
const modalContent = { backgroundColor: 'white', width: '90%', maxWidth: '600px', borderRadius: '32px', padding: '30px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeBtn = { background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#94a3b8', lineHeight: '1' };
const modalScrollArea = { maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' };
const finishedDayBoxStyle = { marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' };
const finishedDayTitleStyle = { fontSize: '14px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px' };
const finishedMemberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '15px', alignItems:'center' };
const finishedBadgeStyle = { fontSize: '11px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '3px 10px', borderRadius: '8px' };
const remainingBoxStyle = { padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '20px', border: '2px solid #2d6a4f' };
const remainingHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', color: '#2d6a4f', fontSize: '15px', fontWeight: 'bold' };
const allDoneTextStyle = { textAlign: 'center', color: '#2d6a4f', fontSize: '16px', padding: '20px', fontWeight: 'bold' };
const remainingMemberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e2fbe9', fontSize: '15px' };
const menuBadgeStyle = { fontSize: '11px', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', border: '1px solid #86efac' };
const extraBadgeStyle = { fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '6px' };
const miniSortBtnStyle = { border: '1px solid #2d6a4f', borderRadius: '8px', padding: '4px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const bottomCloseBtnStyle = { width: '100%', marginTop: '20px', padding: '18px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };