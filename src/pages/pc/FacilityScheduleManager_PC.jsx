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

  // --- スマホ版共通ロジック ---
  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const myKeeps = keepDates.filter(kd => kd.facility === user.name).map(kd => ({ date: kd.date, confirmed: false, members: [] }));
  const myBookings = bookingList.filter(b => b.facility === user.name).map(b => ({ ...b, confirmed: true }));
  const allDates = [...myKeeps, ...myBookings].filter(item => item.date).sort((a, b) => a.date.localeCompare(b.date));

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  const visibleItems = allDates.filter(item => item.date.startsWith(currentMonthKey));

  const formatShortDate = (d) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const dateObj = new Date(d.replace(/\//g, '-'));
    return `${d.replace(/-/g, '/')}(${days[dateObj.getDay()]})`;
  };

  // --- 進捗計算ロジック（スマホ版完全再現） ---
  const monthKeySlash = currentMonthKey.replace(/-/g, '/');
  const finishedInThisMonth = historyList.filter(h => h.date.startsWith(monthKeySlash) && h.facility === user.name);
  const monthBookings = bookingList.filter(b => b.date.startsWith(currentMonthKey) && b.facility === user.name);
  const allPlannedInMonth = Array.from(new Set(monthBookings.flatMap(b => b.members || []).map(m => m.name)))
    .map(name => monthBookings.flatMap(b => b.members || []).find(m => m.name === name));

  let runningProcessedCount = 0;
  const statsMap = {};
  visibleItems.forEach(item => {
    const dateSlashForH = item.date.replace(/-/g, '/');
    const finishedOnDay = finishedInThisMonth.filter(h => h.date === dateSlashForH);
    const cancelledOnDay = item.members?.filter(m => m.status === 'cancel') || [];
    const extraOnDay = finishedOnDay.filter(h => !allPlannedInMonth.some(m => m.name === h.name));
    const dayProcessedCount = finishedOnDay.length + cancelledOnDay.length;
    
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
            const isAllFinished = stats.processed >= stats.planned && stats.planned > 0;
            const shouldDisable = isPast || isAllFinished;

            return (
              <div key={idx} style={{
                ...statusCardStyle,
                backgroundColor: shouldDisable ? '#f8fafc' : (isToday ? '#fffbeb' : '#ffffff'),
                border: isToday && !isAllFinished ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                opacity: shouldDisable ? 0.8 : 1
              }}>
                <div style={cardHeader}>
                  <span style={{fontSize:'18px', fontWeight:'bold', color:'#1e3a8a'}}>{formatShortDate(item.date)}</span>
                  {isToday && <span style={todayBadge}>本日</span>}
                </div>
                
                <div style={cardContent}>
                  {item.confirmed ? (
                    <div style={{color: isAllFinished ? '#94a3b8' : '#059669', fontWeight: 'bold'}}>
                      {isAllFinished ? "✅ 完了済" : `⏳ 進捗：${stats.processed} / ${stats.planned} 名`}
                    </div>
                  ) : (
                    <div style={{color:'#3b82f6'}}>● キープ中（未確定）</div>
                  )}
                  
                  {item.confirmed && (
                    <div style={progressBarContainer}>
                      <div style={{
                        ...progressBar, 
                        width: `${(stats.processed / stats.planned) * 100}%`,
                        backgroundColor: isAllFinished ? '#10b981' : '#3b82f6'
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

      {/* --- 詳細モーダル（スマホ版のロジックとデザインをPC最適化） --- */}
      {selectedDetail && (
        <div style={modalOverlay} onClick={() => setSelectedDetail(null)}>
          <div style={modalContent} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3>施術状況詳細 ({formatShortDate(selectedDetail.date)})</h3>
              <button onClick={() => setSelectedDetail(null)} style={closeBtn}>×</button>
            </div>
            
            <div style={modalScrollArea}>
               {/* モーダル内の中身（進捗リスト等）はスマホ版のロジックで表示 */}
               <p style={{fontSize:'13px', color:'#64748b'}}>※完了およびキャンセル以外の、本日の施術予定者を表示しています。</p>
               {/* 簡略化のため、ここにはスマホ版のdoneMembers等のリストが表示される想定 */}
               <div style={{padding:'20px', textAlign:'center', color:'#94a3b8'}}>
                 詳細名簿を表示中... (スマホ版のリストロジックをここに適用)
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 PC版スタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const monthLabel = { fontSize: '18px', fontWeight: 'bold' };
const navBtn = { padding: '5px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' };
const noticeStyle = { padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', overflowY: 'auto' };
const statusCardStyle = { padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '15px', transition: '0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const todayBadge = { backgroundColor: '#f59e0b', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' };
const cardContent = { flex: 1 };
const progressBarContainer = { height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' };
const progressBar = { height: '100%', transition: '0.5s' };
const detailBtn = { padding: '10px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const emptyStyle = { gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#94a3b8' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 };
const modalContent = { backgroundColor: 'white', width: '500px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const modalHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const closeBtn = { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' };
const modalScrollArea = { maxHeight: '60vh', overflowY: 'auto' };