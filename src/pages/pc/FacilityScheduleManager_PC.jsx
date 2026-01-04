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

  // --- 共通ロジック保持 ---
  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/-/g, '/')).getDay()];
  };

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  const monthKeySlash = currentMonthKey.replace(/-/g, '/');

  const myKeeps = keepDates.filter(kd => kd.facility === user.name).map(kd => ({ date: kd.date, confirmed: false, members: [] }));
  const myBookings = bookingList.filter(b => b.facility === user.name).map(b => ({ ...b, confirmed: true }));
  
  const historyDates = historyList
    .filter(h => h.facility === user.name && h.date.startsWith(monthKeySlash))
    .map(h => h.date.replace(/\//g, '-'));

  const allDateKeys = Array.from(new Set([
    ...myKeeps.map(k => k.date),
    ...myBookings.map(b => b.date),
    ...historyDates
  ])).filter(d => d && d.startsWith(currentMonthKey)).sort();

  const visibleItems = allDateKeys.map(date => {
    const booking = myBookings.find(b => b.date === date);
    const keep = myKeeps.find(k => k.date === date);
    return booking || keep || { date, confirmed: true, members: [] };
  });

  const formatShortDate = (d) => `${d.replace(/-/g, '/')}(${getDayName(d)})`;

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

  // 詳細表示用の計算パーツ
  const renderDetailPane = () => {
    if (!selectedDetail) return (
      <div style={emptyPaneStyle}>
        <span style={{ fontSize: '60px', marginBottom: '20px' }}>📊</span>
        <p style={{ fontSize: '20px', fontWeight: '800', color: '#a39081' }}>左のリストから日付を<br/>選ぶと詳細が表示されます</p>
      </div>
    );

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
      <div style={detailPaneStyle}>
        <div style={detailHeaderStyle}>
          <h3 style={{ margin: 0, fontSize: '24px', color: '#4a3728' }}>{formatShortDate(date)} 施術名簿</h3>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button onClick={() => setPopupSortKey('room')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'room' ? '#4a3728' : 'white', color: popupSortKey === 'room' ? 'white' : '#4a3728' }}>部屋順</button>
            <button onClick={() => setPopupSortKey('name')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'name' ? '#4a3728' : 'white', color: popupSortKey === 'name' ? 'white' : '#4a3728' }}>名前順</button>
          </div>
        </div>

        <div style={detailScrollArea}>
          {remainingMembers.length > 0 && (
            <div style={remainingBoxStyle}>
              <div style={sectionTitleStyle}>⏳ 未完了の方 ({remainingMembers.length}名)</div>
              {sortFn(remainingMembers).map((m, i) => (
                <div key={i} style={remainingMemberRowStyle}>
                  <span>{m.room} <b style={{fontSize:'20px'}}>{m.name} 様</b></span>
                  <div style={{display:'flex', gap:'6px'}}>{m.menus?.map(menu => <span key={menu} style={menuBadgeStyle}>{menu}</span>)}</div>
                </div>
              ))}
            </div>
          )}

          {doneMembers.length > 0 && (
            <div style={finishedBoxStyle}>
              <div style={sectionTitleStyle}>✅ 本日完了 ({doneMembers.length}名)</div>
              {sortFn(doneMembers).map((m, i) => (
                <div key={i} style={finishedMemberRowStyle}>
                  <span>{m.room} {m.name} 様 {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span>
                  <span style={finishedBadgeStyle}>{m.menu}</span>
                </div>
              ))}
            </div>
          )}

          {cancelMembers.length > 0 && (
            <div style={cancelBoxStyle}>
              <div style={sectionTitleStyle}>🚩 欠席・キャンセル ({cancelMembers.length}名)</div>
              {sortFn(cancelMembers).map((m, i) => (
                <div key={i} style={cancelMemberRowStyle}>
                  <span>{m.room} {m.name} 様</span>
                  <span style={cancelBadgeStyle}>欠席</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#4a3728', fontSize: '28px'}}>📊 予約スケジュール・進捗確認</h2>
          <p style={{fontSize:'16px', color:'#7a6b5d', marginTop: '4px', fontWeight: '500'}}>月ごとの施術進捗と詳細を確認できます</p>
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

      <div style={mainContentWrapper}>
        {/* 左カラム：予約枠リスト */}
        <div style={leftColumnStyle}>
          {visibleItems.length === 0 ? (
            <div style={emptyStyle}>📅 この月に予約・キープはありません。</div>
          ) : (
            visibleItems.map((item, idx) => {
              const stats = statsMap[item.date];
              const isToday = item.date === todayStr;
              const isPast = item.date < todayStr;
              const isAllFinished = stats.planned > 0 && stats.processed >= stats.planned;
              const isSelected = selectedDetail?.date === item.date;

              return (
                <div key={idx} 
                  onClick={() => item.confirmed && !isAllFinished && setSelectedDetail({ ...item, allPlannedInMonth })}
                  style={{
                    ...statusCardStyle,
                    backgroundColor: isSelected ? '#fdfcfb' : (isPast || isAllFinished ? '#f1f1f1' : (isToday ? '#fffbeb' : '#ffffff')),
                    border: isSelected ? '3px solid #4a3728' : (isToday ? '2px solid #f59e0b' : '1px solid #e0d6cc'),
                    cursor: (item.confirmed && !isAllFinished) ? 'pointer' : 'default',
                    opacity: (isPast || isAllFinished) ? 0.7 : 1
                  }}
                >
                  <div style={cardHeader}>
                    <span style={{fontSize:'22px', fontWeight:'800', color: '#4a3728'}}>{formatShortDate(item.date)}</span>
                    {isToday && <span style={todayBadge}>本日</span>}
                  </div>
                  
                  <div style={cardContent}>
                    {item.confirmed ? (
                      <div style={{color: isAllFinished ? '#7a6b5d' : '#2d6a4f', fontWeight: '800', fontSize: '18px'}}>
                        {isAllFinished ? "🏁 訪問済（完了）" : `⏳ 進捗：${stats.processed} / ${stats.planned} 名`}
                      </div>
                    ) : (
                      <div style={{color:'#8b6508', fontWeight: '800'}}>● キープ中（未確定）</div>
                    )}
                    
                    {item.confirmed && stats.planned > 0 && (
                      <div style={progressBarContainer}>
                        <div style={{
                          ...progressBar, 
                          width: `${Math.min((stats.processed / stats.planned) * 100, 100)}%`,
                          backgroundColor: isAllFinished ? '#a39081' : '#2d6a4f'
                        }}></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 右カラム：詳細パネル */}
        <div style={rightColumnStyle}>
          {renderDetailPane()}
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px 30px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f9f7f5', padding: '10px 20px', borderRadius: '15px', border: '1px solid #e2d6cc' };
const monthLabel = { fontSize: '22px', fontWeight: '800', color: '#4a3728' };
const navBtn = { padding: '8px 18px', border: '1px solid #e0d6cc', backgroundColor: 'white', cursor: 'pointer', borderRadius: '10px', fontWeight: 'bold' };
const noticeStyle = { padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #ef9a9a', color: '#c62828', borderRadius: '15px', fontSize: '16px', fontWeight: '800', textAlign: 'center' };

const mainContentWrapper = { display: 'flex', gap: '25px', flex: 1, minHeight: 0, paddingBottom: '20px' };
const leftColumnStyle = { flex: '0 0 400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' };
const rightColumnStyle = { flex: 1, backgroundColor: 'white', borderRadius: '25px', border: '1px solid #e0d6cc', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };

const statusCardStyle = { padding: '25px', borderRadius: '25px', display: 'flex', flexDirection: 'column', gap: '15px', transition: '0.3s' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const todayBadge = { backgroundColor: '#f59e0b', color: 'white', fontSize: '13px', padding: '4px 12px', borderRadius: '12px', fontWeight: '800' };
const cardContent = { flex: 1 };
const progressBarContainer = { height: '12px', backgroundColor: '#f2ede9', borderRadius: '6px', marginTop: '15px', overflow: 'hidden' };
const progressBar = { height: '100%', transition: '0.5s' };
const emptyStyle = { textAlign: 'center', padding: '100px', color: '#a39081', fontWeight: '800', fontSize: '18px' };

const detailPaneStyle = { display: 'flex', flexDirection: 'column', height: '100%' };
const emptyPaneStyle = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: '#fdfcfb' };
const detailHeaderStyle = { padding: '30px', backgroundColor: '#f9f7f5', borderBottom: '2px solid #e0d6cc' };
const detailScrollArea = { flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' };

const remainingBoxStyle = { padding: '25px', backgroundColor: '#f0f9f1', borderRadius: '20px', border: '2px solid #2d6a4f' };
const finishedBoxStyle = { padding: '25px', backgroundColor: '#faf9f8', borderRadius: '20px', border: '1px solid #e0d6cc' };
const cancelBoxStyle = { padding: '25px', backgroundColor: '#fff5f5', borderRadius: '20px', border: '1px solid #ef9a9a' };

const sectionTitleStyle = { fontSize: '18px', fontWeight: '800', color: '#4a3728', marginBottom: '15px' };
const remainingMemberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #e2fbe9', fontSize: '18px' };
const finishedMemberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f2ede9', fontSize: '17px' };
const cancelMemberRowStyle = { ...finishedMemberRowStyle, borderBottom: '1px solid #fee2e2' };

const menuBadgeStyle = { fontSize: '13px', backgroundColor: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: '10px', border: '2px solid #86efac', fontWeight: '800' };
const finishedBadgeStyle = { fontSize: '13px', color: '#2d6a4f', fontWeight: '800', backgroundColor: '#e8f5e9', padding: '6px 14px', borderRadius: '10px', border: '1px solid #c8e6c9' };
const cancelBadgeStyle = { ...finishedBadgeStyle, backgroundColor: '#fee2e2', color: '#c62828', border: '1px solid #fca5a5' };
const extraBadgeStyle = { fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '8px', fontWeight: '800', marginLeft: '10px' };
const miniSortBtnStyle = { border: '2px solid #4a3728', borderRadius: '10px', padding: '8px 20px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' };