import React, { useState } from 'react';
import { Layout } from './Layout';

// 🌟 bookingList を受け取れるように引数を追加
export default function AdminHistory({ setPage, historyList = [], bookingList = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [popupSortBy, setPopupSortBy] = useState("room"); 

  const changeMonth = (offset) => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(next);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthKey = `${year}/${month.toString().padStart(2, '0')}`;

  // 指定した月のデータだけを抽出
  const monthlyData = historyList.filter(item => item.date.startsWith(monthKey));
  
  // 施設ごと・日付ごとにグループ化
  const groupedByFacility = monthlyData.reduce((acc, item) => {
    const facility = item.facility || "不明な施設";
    const date = item.date;
    if (!acc[facility]) acc[facility] = {};
    if (!acc[facility][date]) acc[facility][date] = [];
    acc[facility][date].push(item);
    return acc;
  }, {});

  // ポップアップ内での並べ替え
  const getSortedMembers = (members) => {
    return [...members].sort((a, b) => {
      if (popupSortBy === "room") {
        return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
      }
      const nameA = a.kana || a.name || "";
      const nameB = b.kana || b.name || "";
      return nameA.localeCompare(nameB, 'ja');
    });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '120px' }}>
          
          <header style={{ marginBottom: '24px', textAlign: 'center', paddingTop: '20px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>過去の訪問履歴</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>管理者の全施設実績ログ</p>
          </header>

          {/* 月選択ナビゲーション */}
          <div style={calendarHeaderStyle}>
            <button onClick={() => changeMonth(-1)} style={monthBtnStyle}>◀</button>
            <div style={currentMonthStyle}>{year}年 {month}月</div>
            <button onClick={() => changeMonth(1)} style={monthBtnStyle}>▶</button>
          </div>

          {Object.keys(groupedByFacility).length > 0 ? (
            Object.keys(groupedByFacility).sort().map(facility => {
              const dates = Object.keys(groupedByFacility[facility]).sort((a, b) => b.localeCompare(a));
              const totalMonthlyDone = dates.reduce((sum, d) => sum + groupedByFacility[facility][d].length, 0);

              return (
                <div key={facility} style={facilityBoxStyle}>
                  <div style={facilityHeaderRowStyle}>
                    <h3 style={facilityNameStyle}>🏠 {facility}</h3>
                    <span style={monthlyTotalBadgeStyle}>月合計: {totalMonthlyDone}名</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dates.map(date => {
                      const dayWork = groupedByFacility[facility][date];
                      return (
                        <div 
                          key={date} 
                          onClick={() => setSelectedDay({ date, facility, members: dayWork })}
                          style={dayRowStyle}
                        >
                          <div style={{ fontWeight: 'bold', color: '#334155' }}>
                            {date.split('/')[2]}日 ({['日','月','火','水','木','金','土'][new Date(date).getDay()]})
                          </div>
                          <div style={{ color: '#1e3a8a', fontSize: '14px', fontWeight: 'bold' }}>
                            完了: {dayWork.length}名 ＞
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={emptyHistoryCardStyle}>
              <div style={{fontSize: '40px', marginBottom: '10px'}}>📁</div>
              {month}月の履歴はありません
            </div>
          )}
        </div>
      </Layout>

      {/* 🌟 詳細名簿ポップアップ（修正版） */}
      {selectedDay && (() => {
        // クラウドの予約データからその日の「欠席者」を探す
        const targetDateISO = selectedDay.date.replace(/\//g, '-');
        const bookingForDay = bookingList.find(b => b.date === targetDateISO && b.facility === selectedDay.facility);
        const cancelMembers = bookingForDay?.members?.filter(m => m.status === 'cancel') || [];

        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedDay(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{selectedDay.facility}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>{selectedDay.date} 施術実績</div>
                </div>
                <button onClick={() => setSelectedDay(null)} style={closeXStyle}>×</button>
              </div>

              <div style={{ display: 'flex', gap: '8px', margin: '15px 0' }}>
                <button onClick={() => setPopupSortBy("room")} style={{...miniSortBtn, backgroundColor: popupSortBy==='room'?'#1e3a8a':'#f1f5f9', color: popupSortBy==='room'?'white':'#1e3a8a'}}>部屋順</button>
                <button onClick={() => setPopupSortBy("name")} style={{...miniSortBtn, backgroundColor: popupSortBy==='name'?'#1e3a8a':'#f1f5f9', color: popupSortBy==='name'?'white':'#1e3a8a'}}>名前順</button>
              </div>
              
              <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }}>
                {/* 完了した方 */}
                <div style={{ marginBottom: '10px', fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>✅ 完了 ({selectedDay.members.length}名)</div>
                {getSortedMembers(selectedDay.members).map((m, i) => (
                  <div key={i} style={memberRowStyle}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={roomBadgeStyle}>{m.room}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#334155' }}>{m.name} 様</span>
                      </div>
                    </div>
                    <div style={menuTextStyle}>{m.menu}</div>
                  </div>
                ))}

                {/* 🌟 欠席した方（新設） */}
                {cancelMembers.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#e11d48', fontWeight: 'bold' }}>🚩 当日キャンセル ({cancelMembers.length}名)</div>
                    {cancelMembers.map((m, i) => (
                      <div key={`cancel-${i}`} style={{ ...memberRowStyle, opacity: 0.6 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ ...roomBadgeStyle, backgroundColor: '#ffe4e6' }}>{m.room}</span>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#e11d48' }}>{m.name} 様</span>
                          </div>
                        </div>
                        <div style={{ ...menuTextStyle, backgroundColor: '#fff1f2', color: '#e11d48' }}>キャンセル</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button onClick={() => setSelectedDay(null)} style={bottomCloseBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}

      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// 🎨 デザインパーツ（既存のものを維持）
const calendarHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px 20px', borderRadius: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const monthBtnStyle = { background: '#f1f5f9', border: 'none', padding: '10px 18px', borderRadius: '12px', color: '#1e3a8a', fontWeight: 'bold', cursor: 'pointer' };
const currentMonthStyle = { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' };
const facilityBoxStyle = { backgroundColor: 'white', borderRadius: '28px', padding: '20px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const facilityHeaderRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #f8fafc', paddingBottom: '10px' };
const facilityNameStyle = { fontSize: '17px', color: '#2d6a4f', margin: 0, fontWeight: 'bold' };
const monthlyTotalBadgeStyle = { fontSize: '11px', backgroundColor: '#eefcf4', color: '#2d6a4f', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' };
const dayRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#f8fafc', borderRadius: '16px', cursor: 'pointer', transition: '0.2s' };
const emptyHistoryCardStyle = { textAlign: 'center', padding: '60px 20px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '20px', backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '100%', maxWidth: '480px', borderRadius: '32px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' };
const modalHeaderStyle = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' };
const miniSortBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f8fafc' };
const roomBadgeStyle = { fontSize: '11px', color: '#64748b', backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '6px', marginRight: '10px', fontWeight: 'bold' };
const menuTextStyle = { fontSize: '14px', color: '#10b981', fontWeight: 'bold', backgroundColor: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer', lineHeight: '1' };
const bottomCloseBtnStyle = { width: '100%', marginTop: '25px', padding: '18px', borderRadius: '18px', border: 'none', backgroundColor: '#1e3a8a', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };