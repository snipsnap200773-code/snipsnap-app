import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './Layout';

export default function ScheduleManager({ 
  keepDates = [], 
  bookingList = [], 
  historyList = [], 
  setPage, 
  user
}) {
  
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [popupSortKey, setPopupSortKey] = useState('room');
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/\//g, '-')).getDay()];
  };

  const getVisibleMonthKeys = (baseDate) => {
    const d1 = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const d2 = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return [format(d1), format(d2)];
  };

  const visibleMonths = getVisibleMonthKeys(currentViewDate);

  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const myKeeps = keepDates.filter(kd => kd.facility === user.name).map(kd => ({ date: kd.date, confirmed: false, members: [] }));
  const myBookings = bookingList.filter(b => b.facility === user.name).map(b => ({ ...b, confirmed: true }));
  const allDates = [...myKeeps, ...myBookings].filter(item => item.date);
  allDates.sort((a, b) => a.date.localeCompare(b.date));

  const monthlyGroups = allDates.reduce((acc, item) => {
    const monthKey = item.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(item);
    return acc;
  }, {});

  const formatShortDate = (d) => `${d.replace(/-/g, '/')}(${getDayName(d)})`;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4', paddingBottom: '80px' }}>
      <Layout>
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <header style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>予約の確認</h1>
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '14px', backgroundColor: '#dcfce7', color: '#2d6a4f', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
                🏠 {user?.name} 様
              </span>
            </div>
          </header>

          <div style={monthNavContainerStyle}>
            <button onClick={() => changeViewMonth(-1)} style={monthNavBtnStyle}>◀</button>
            <div style={monthTitleStyle}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月 〜</div>
            <button onClick={() => changeViewMonth(1)} style={monthNavBtnStyle}>▶</button>
          </div>

          <div style={cancelNoticeStyle}>
            ※当日、急遽メンバーを追加したい場合は、施術スタッフ（三土手）まで直接お申し付けください。
          </div>

          {visibleMonths.every(m => !monthlyGroups[m]) ? (
            <div style={emptyCardStyle}>📅 この期間に予約はありません。</div>
          ) : (
            visibleMonths.map(monthKey => {
              if (!monthlyGroups[monthKey]) return null;
              
              const monthKeySlash = monthKey.replace(/-/g, '/');
              const items = monthlyGroups[monthKey];
              const finishedInThisMonth = historyList.filter(h => h.date.startsWith(monthKeySlash) && h.facility === user.name);
              
              const monthBookings = bookingList.filter(b => b.date.startsWith(monthKey) && b.facility === user.name);
              const allPlannedInMonth = Array.from(new Set(monthBookings.flatMap(b => b.members || []).map(m => m.name)))
                .map(name => monthBookings.flatMap(b => b.members || []).find(m => m.name === name));
              
              const statsMap = {};
              let runningProcessedCount = 0; // 🌟 完了＋欠席の合計累計
              const timelineItems = [...items].sort((a, b) => a.date.localeCompare(b.date));

              timelineItems.forEach(item => {
                const dateSlashForH = item.date.replace(/-/g, '/');
                const finishedOnDay = finishedInThisMonth.filter(h => h.date === dateSlashForH);
                
                // 🌟 管理者側と同じく欠席(status: 'cancel')を分子に加算する
                const cancelledOnDay = item.members?.filter(m => m.status === 'cancel') || [];
                const extraOnDay = finishedOnDay.filter(h => !allPlannedInMonth.some(m => m.name === h.name));
                
                const dayProcessedCount = finishedOnDay.length + cancelledOnDay.length;

                statsMap[item.date] = {
                  planned: allPlannedInMonth.length + extraOnDay.length,
                  processed: runningProcessedCount + dayProcessedCount, // その日までの進捗
                  finished: finishedOnDay.length + cancelledOnDay.length // その日の処理数
                };
                runningProcessedCount += dayProcessedCount;
              });

              return (
                <div key={monthKey} style={cardStyle}>
                  <h2 style={cardTitleStyle}>📅 {monthKey.replace('-', '年 ')}月 予約状況</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, idx) => {
                      const isToday = item.date === todayStr;
                      const isPast = item.date < todayStr;
                      const stats = statsMap[item.date];

                      // 🌟 自動ロック判定
                      const isAllMonthFinished = stats.processed >= stats.planned && stats.planned > 0;
                      const shouldDisable = isPast || isAllMonthFinished;

                      return (
                        <div key={idx} style={{ 
                          ...statusBoxStyle, 
                          backgroundColor: shouldDisable ? '#f1f5f9' : (isToday ? '#fffbeb' : (item.confirmed ? '#ecfdf5' : '#eff6ff')),
                          border: isToday && !isAllMonthFinished ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                          opacity: shouldDisable ? 0.6 : 1
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: shouldDisable ? '#64748b' : '#1e3a8a' }}>
                                {formatShortDate(item.date)}
                                {isAllMonthFinished && <span style={{fontSize:'12px', marginLeft:'8px', color:'#059669'}}>(完了済)</span>}
                              </div>
                              <div style={{ marginTop: '4px', fontSize: '13px' }}>
                                {item.confirmed ? (
                                  <span style={{color: isAllMonthFinished ? '#94a3b8' : '#059669', fontWeight: 'bold'}}>
                                    {isAllMonthFinished ? "✅ 今月の施術はすべて完了または欠席済です" : `✅ 予定${stats.planned}名中 / ${stats.processed}名 終了`}
                                  </span>
                                ) : <span style={{color: shouldDisable ? '#94a3b8' : '#3b82f6'}}>● キープ中</span>}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {item.confirmed && !isAllMonthFinished && (
                                <button onClick={() => setSelectedDetail({ ...item, allPlannedInMonth })} style={detailBtnStyle}>
                                  詳細確認
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Layout>

      {selectedDetail && (() => {
        const { date, members: plannedMembers, allPlannedInMonth } = selectedDetail;
        const monthKey = date.substring(0, 7);
        const dateSlash = date.replace(/-/g, '/');

        const monthHistory = historyList.filter(h => 
          h.date.startsWith(monthKey.replace(/-/g, '/')) && h.facility === user.name
        );
        
        const finishedBeforeTodayNames = monthHistory.filter(h => h.date < dateSlash).map(h => h.name);
        const finishedOnDay = monthHistory.filter(h => h.date === dateSlash);
        const finishedOnDayNames = finishedOnDay.map(h => h.name);

        const allExtraInMonth = monthHistory
          .filter(h => !allPlannedInMonth.some(m => m.name === h.name))
          .map(h => ({ name: h.name, room: h.room, kana: h.kana, isExtra: true, menus: [h.menu], status: 'done' }));

        const candidates = [...plannedMembers, ...allExtraInMonth].filter((m, i, self) => 
          self.findIndex(t => t.name === m.name) === i && !finishedBeforeTodayNames.includes(m.name)
        );

        const doneMembers = candidates.filter(m => finishedOnDayNames.includes(m.name)).map(m => {
          const h = finishedOnDay.find(fh => fh.name === m.name);
          return { ...m, menu: h.menu, status: 'done' };
        });
        const cancelMembers = candidates.filter(m => m.status === 'cancel' && !doneMembers.some(d => d.name === m.name));
        const remainingMembers = candidates.filter(m => !finishedOnDayNames.includes(m.name) && m.status !== 'cancel');

        remainingMembers.sort((a, b) => {
          if (popupSortKey === 'room') return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
          return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
        });

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', color: '#1e3a8a' }}>施術状況確認</h3>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>{user.name} 様 / {date.replace(/-/g, '/')}</p>
                </div>
                <button onClick={() => setSelectedDetail(null)} style={closeXStyle}>×</button>
              </div>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {doneMembers.length > 0 && (
                  <div style={finishedDayBoxStyle}>
                    <div style={finishedDayTitleStyle}>✅ 本日終了した方 ({doneMembers.length}名)</div>
                    {doneMembers.map((m, i) => (
                      <div key={i} style={finishedMemberRowStyle}>
                        <span>{m.room} {m.name} 様 {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span>
                        <span style={finishedBadgeStyle}>{m.menu || '完了'}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {cancelMembers.length > 0 && (
                  <div style={{ ...finishedDayBoxStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
                    <div style={finishedDayTitleStyle}>🚩 キャンセルの方 ({cancelMembers.length}名)</div>
                    {cancelMembers.map((m, i) => (
                      <div key={i} style={{ ...finishedMemberRowStyle, opacity: 0.7 }}>
                        <span style={{ color: '#e11d48' }}>{m.room} {m.name} 様</span>
                        <span style={{ ...finishedBadgeStyle, backgroundColor: '#fb7185', color: 'white' }}>キャンセル</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={remainingBoxStyle}>
                  <div style={remainingHeaderStyle}>
                    <span>未完了の方 ({remainingMembers.length}名)</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => setPopupSortKey('room')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'room' ? '#2d6a4f' : 'white', color: popupSortKey === 'room' ? 'white' : '#2d6a4f' }}>部屋</button>
                      <button onClick={() => setPopupSortKey('name')} style={{ ...miniSortBtnStyle, backgroundColor: popupSortKey === 'name' ? '#2d6a4f' : 'white', color: popupSortKey === 'name' ? 'white' : '#2d6a4f' }}>名前</button>
                    </div>
                  </div>
                  {remainingMembers.length === 0 ? (
                    <p style={allDoneTextStyle}>🎉 全員の施術が完了しました！</p>
                  ) : (
                    remainingMembers.map((m, i) => (
                      <div key={i} style={remainingMemberRowStyle}>
                        <span>{m.room} <b>{m.name} 様</b> {m.isExtra && <span style={extraBadgeStyle}>当日追加</span>}</span>
                        <div style={{display:'flex', gap:'4px'}}>{m.menus?.map(menu => <span key={menu} style={menuBadgeStyle}>{menu}</span>)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedDetail(null)} style={bottomCloseBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}
      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>
    </div>
  );
}

// 🎨 デザイン定数（完全維持）
const cancelNoticeStyle = { backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginBottom: '20px', border: '1px solid #fee2e2', lineHeight: '1.5', textAlign:'center' };
const monthNavContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px', backgroundColor: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const monthNavBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#1e3a8a', padding: '8px 15px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' };
const monthTitleStyle = { fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' };
const miniSortBtnStyle = { border: '1px solid #2d6a4f', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };
const emptyCardStyle = { backgroundColor: 'white', padding: '60px 20px', borderRadius: '28px', textAlign: 'center', color: '#94a3b8' };
const cardStyle = { backgroundColor: 'white', borderRadius: '28px', padding: '20px', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', marginBottom: '25px', textAlign: 'left' };
const cardTitleStyle = { fontSize: '18px', color: '#1e3a8a', borderLeft: '5px solid #1e3a8a', paddingLeft: '12px', marginBottom: '15px', fontWeight: 'bold' };
const statusBoxStyle = { padding: '16px', borderRadius: '18px', transition: 'all 0.2s' };
const detailBtnStyle = { backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '480px', borderRadius: '32px', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' };
const finishedDayBoxStyle = { marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0' };
const finishedDayTitleStyle = { fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' };
const finishedMemberRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' };
const finishedBadgeStyle = { fontSize: '11px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' };
const remainingBoxStyle = { padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '18px', border: '2px solid #2d6a4f' };
const remainingHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', color: '#2d6a4f', fontSize: '14px', fontWeight: 'bold' };
const allDoneTextStyle = { textAlign: 'center', color: '#2d6a4f', fontSize: '14px', padding: '10px', fontWeight: 'bold' };
const remainingMemberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2fbe9', fontSize: '14px' };
const menuBadgeStyle = { fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '6px', border: '1px solid #86efac' };
const extraBadgeStyle = { fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' };
const bottomCloseBtnStyle = { width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };