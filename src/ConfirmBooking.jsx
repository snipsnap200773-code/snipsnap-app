import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';

export default function ConfirmBooking({ 
  keepDates = [], 
  users, 
  selectedMembers = [], 
  setSelectedMembers, 
  setPage,
  menuPrices = {},
  historyList = [], // 🌟 判定のために追加
  user // 🌟 施設ユーザー情報
}) {
  // 🌟 表示する基準月を管理（自動判定ロジック付き）
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthSlash = currentMonthKey.replace(/-/g, '/');

    // 1. 今月の全履歴を取得（完了分）
    const thisMonthHistory = historyList.filter(h => 
      h.facility === user?.name && h.date.startsWith(currentMonthSlash)
    );

    // 2. 今月の予定総数を計算（キープされている人数など、usersの総数でも可）
    // ここではシンプルに「利用者の数」を分母として判定
    const isAllDone = thisMonthHistory.length >= users.length && users.length > 0;

    // 🌟 全員終わっていたら「来月」、まだなら「今月」を初期表示にする
    if (isAllDone) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth;
    }

    if (keepDates.length > 0) {
      const sorted = [...keepDates].sort();
      return new Date(sorted[0]);
    }
    return now;
  });

  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  const availableMenus = Object.keys(menuPrices);

  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
  };

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;
  const visibleDates = keepDates.filter(d => d.startsWith(currentMonthKey)).sort();

  const sortedUsers = [...users].sort((a, b) => {
    let valA, valB;
    if (sortKey === 'name') {
      valA = a.kana || a.name;
      valB = b.kana || b.name;
    } else {
      valA = (a.floor || '') + a.room;
      valB = (b.floor || '') + b.room;
    }
    if (sortOrder === 'desc') [valA, valB] = [valB, valA];
    return valA.toString().localeCompare(valB.toString(), 'ja', { numeric: true });
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleUserSelection = (user) => {
    const isAdded = selectedMembers.find(u => u.id === user.id);
    if (isAdded) {
      setSelectedMembers(selectedMembers.filter(u => u.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, { ...user, menus: [availableMenus[0] || 'カット'] }]);
    }
  };

  const toggleMenu = (userId, menuName) => {
    setSelectedMembers(selectedMembers.map(u => {
      if (u.id === userId) {
        const newMenus = u.menus.includes(menuName)
          ? u.menus.filter(m => m !== menuName)
          : [...u.menus, menuName];
        return { ...u, menus: newMenus.length === 0 ? [availableMenus[0] || 'カット'] : newMenus };
      }
      return u;
    }));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ paddingBottom: '140px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '20px' }}>
          <header style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f' }}>これで決まり！予約確定！</h1>
            <p style={{ fontSize: '13px', color: '#52796f', marginTop: '5px' }}>施術を受ける方を選択してください</p>
          </header>

          <div style={monthNavContainerStyle}>
            <button onClick={() => changeViewMonth(-1)} style={monthNavBtnStyle}>◀</button>
            <div style={monthTitleStyle}>
              {currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月
            </div>
            <button onClick={() => changeViewMonth(1)} style={monthNavBtnStyle}>▶</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            {visibleDates.length === 0 ? (
              <div style={emptyKeepBoxStyle}>この月の予約枠（キープ）はありません</div>
            ) : (
              <div style={activeMonthBoxStyle}>
                <div style={{ fontWeight: 'bold', color: '#2d6a4f', fontSize: '14px', marginBottom: '5px' }}>
                  キープ中の訪問予定日:
                </div>
                <div style={{ fontSize: '14px', color: '#2d6a4f', lineHeight: '1.5' }}>
                  {visibleDates.map(d => formatShortDate(d)).join(' ・ ')}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => toggleSort('room')} style={{...sortBtnStyle, backgroundColor: sortKey === 'room' ? '#2d6a4f' : 'white', color: sortKey === 'room' ? 'white' : '#666'}}>
              部屋順 {sortKey === 'room' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
            <button onClick={() => toggleSort('name')} style={{...sortBtnStyle, backgroundColor: sortKey === 'name' ? '#2d6a4f' : 'white', color: sortKey === 'name' ? 'white' : '#666'}}>
              名前順 {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedUsers.map(user => {
              const bookingInfo = selectedMembers.find(u => u.id === user.id);
              const isSelected = !!bookingInfo;

              return (
                <div key={user.id} style={{
                  position: 'relative',
                  backgroundColor: isSelected ? '#fff9e6' : 'white', 
                  border: `2px solid ${isSelected ? '#f5a623' : '#eee'}`,
                  padding: isSelected ? '12px 16px' : '14px 16px',
                  borderRadius: '24px', 
                  transition: '0.2s',
                  boxShadow: isSelected ? '0 4px 15px rgba(245,166,35,0.1)' : 'none'
                }}>
                  {isSelected && (
                    <button onClick={() => toggleUserSelection(user)} style={removeIconStyle}>✕</button>
                  )}
                  <div onClick={() => toggleUserSelection(user)} style={{ cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: '#94b0a7', fontWeight: 'bold' }}>
                        {user.floor} {user.room}号室
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSelected ? '#333' : '#2d6a4f' }}>
                        {user.name} 様
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {availableMenus.map(menu => (
                        <button
                          key={menu}
                          onClick={() => toggleMenu(user.id, menu)}
                          style={{
                            flex: '1 1 calc(33% - 6px)',
                            padding: '8px 4px', 
                            borderRadius: '10px', 
                            border: 'none',
                            backgroundColor: bookingInfo.menus.includes(menu) ? '#f5a623' : '#f0f0f0',
                            color: bookingInfo.menus.includes(menu) ? 'white' : '#666',
                            fontSize: '11px', 
                            fontWeight: 'bold'
                          }}
                        >
                          {menu}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Layout>

      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>

      <div style={footerAreaStyle}>
        <button 
          onClick={() => {
            if (selectedMembers.length === 0) {
              alert('施術する人を1人以上選んでください');
              return;
            }
            if (visibleDates.length === 0) {
              alert('この月に予約枠がありません。◀ ▶ ボタンで月を切り替えてください');
              return;
            }
            setPage('timeselect'); 
          }}
          style={confirmBtnStyle}
        >
          開始時間を選択する ({selectedMembers.length}名)
        </button>
      </div>
    </div>
  );
}

// 🎨 デザインスタイル
const monthNavContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px', backgroundColor: 'white', padding: '12px', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' };
const monthNavBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#2d6a4f', padding: '8px 15px', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' };
const monthTitleStyle = { fontSize: '18px', fontWeight: 'bold', color: '#2d6a4f' };
const activeMonthBoxStyle = { backgroundColor: '#eefcf4', padding: '12px 15px', borderRadius: '20px', border: '1px solid #cce9d9' };
const sortBtnStyle = { flex: 1, padding: '12px', borderRadius: '15px', border: '1px solid #ccc', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const emptyKeepBoxStyle = { padding: '15px', backgroundColor: '#fff', borderRadius: '15px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', border: '1px dashed #ccc' };
const footerAreaStyle = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: '20px', borderTop: '1px solid #e0efea', zIndex: 100 };
const confirmBtnStyle = { width: '100%', backgroundColor: '#2d6a4f', color: 'white', border: 'none', padding: '20px', borderRadius: '22px', fontWeight: 'bold', boxShadow: '0 8px 20px rgba(45, 106, 79, 0.3)', fontSize: '17px', cursor: 'pointer' };
const removeIconStyle = { position: 'absolute', top: '12px', right: '12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ff4d4d', color: 'white', border: 'none', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };