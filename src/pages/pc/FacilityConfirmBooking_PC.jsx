import React, { useState, useRef, useEffect } from 'react';

export default function FacilityConfirmBooking_PC({ 
  keepDates = [], 
  users, 
  selectedMembers = [], 
  setSelectedMembers, 
  setPage,
  historyList = [],
  user 
}) {
  // 自動月判定ロジック
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthSlash = currentMonthKey.replace(/-/g, '/');
    const thisMonthHistory = historyList.filter(h => h.facility === user?.name && h.date.startsWith(currentMonthSlash));
    const isAllDone = thisMonthHistory.length >= users.length && users.length > 0;
    if (isAllDone) return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    if (keepDates.length > 0) {
      // keepDatesがオブジェクト配列でも文字列配列でも対応してソート
      const sorted = [...keepDates].sort((a, b) => {
        const dateA = typeof a === 'string' ? a : a.date;
        const dateB = typeof b === 'string' ? b : b.date;
        return dateA.localeCompare(dateB);
      });
      const firstDate = typeof sorted[0] === 'string' ? sorted[0] : sorted[0].date;
      return new Date(firstDate);
    }
    return now;
  });

  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const simpleMenus = ['カット', 'カラー', 'パーマ'];

  // スクロール制御用のRef
  const rightListEndRef = useRef(null);
  const leftListRef = useRef(null);

  // 右側：メンバーが追加されたら一番下まで自動スクロール
  useEffect(() => {
    if (rightListEndRef.current) {
      rightListEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMembers.length]);

  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;

  // 🌟【最重要：根本修正】どんなデータ形式が来ても「文字列の配列」に変換する
  const visibleDates = keepDates
    .filter(d => {
      const dateStr = typeof d === 'string' ? d : d?.date;
      return dateStr && dateStr.startsWith(currentMonthKey);
    })
    .map(d => (typeof d === 'string' ? d : d.date)) 
    .sort();

  const sortedUsers = [...users].sort((a, b) => {
    let valA = sortKey === 'name' ? (a.kana || a.name) : ((a.floor || '') + a.room);
    let valB = sortKey === 'name' ? (b.kana || b.name) : ((b.floor || '') + b.room);
    if (sortOrder === 'desc') [valA, valB] = [valB, valA];
    return valA.toString().localeCompare(valB.toString(), 'ja', { numeric: true });
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const toggleUserSelection = (u, index = null) => {
    const isAdded = selectedMembers.find(m => m.id === u.id);
    if (isAdded) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== u.id));
    } else {
      setSelectedMembers([...selectedMembers, { ...u, menus: ['カット'] }]);
      
      if (index !== null && leftListRef.current) {
        const nextElement = leftListRef.current.children[index + 1];
        if (nextElement) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const toggleMenu = (userId, menuName) => {
    setSelectedMembers(selectedMembers.map(u => {
      if (u.id === userId) {
        const newMenus = u.menus.includes(menuName) ? u.menus.filter(m => m !== menuName) : [...u.menus, menuName];
        return { ...u, menus: newMenus.length === 0 ? ['カット'] : newMenus };
      }
      return u;
    }));
  };

  return (
    <div style={pcWrapperStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>✅ これで決まり！予約確定！</h2>
          <div style={activeMonthBoxStyle}>
            訪問予定日：{visibleDates.length > 0 ? visibleDates.map(d => d.replace(/-/g, '/')).join(' ・ ') : "キープ枠なし"}
          </div>
        </div>
        <div style={monthNavStyle}>
          <button onClick={() => changeViewMonth(-1)} style={monthBtnStyle}>◀</button>
          <div style={monthLabelStyle}>{currentViewDate.getFullYear()}年 {currentViewDate.getMonth() + 1}月</div>
          <button onClick={() => changeViewMonth(1)} style={monthBtnStyle}>▶</button>
        </div>
      </header>

      <div style={twoColumnLayout}>
        <section style={leftScrollSide}>
          <div style={stickySubHeader}>
            <div style={{fontWeight:'bold', color:'#666', fontSize:'14px'}}>1. 施術を受ける方を選んでください</div>
            <div style={sortBarStyle}>
              <button onClick={() => toggleSort('room')} style={{...pcSortBtn, backgroundColor: sortKey === 'room' ? '#2d6a4f' : 'white', color: sortKey === 'room' ? 'white' : '#666'}}>
                部屋順 {sortKey === 'room' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
              <button onClick={() => toggleSort('name')} style={{...pcSortBtn, backgroundColor: sortKey === 'name' ? '#2d6a4f' : 'white', color: sortKey === 'name' ? 'white' : '#666'}}>
                名前順 {sortKey === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
              </button>
            </div>
          </div>
          <div style={userVerticalList} ref={leftListRef}>
            {sortedUsers.map((userItem, idx) => {
              const isSelected = selectedMembers.some(m => m.id === userItem.id);
              return (
                <div key={userItem.id} onClick={() => toggleUserSelection(userItem, idx)}
                  style={{ ...userRowStyle, backgroundColor: isSelected ? '#f0fdf4' : 'white', borderColor: isSelected ? '#2d6a4f' : '#e2e8f0' }}>
                  <div>
                    <div style={{fontSize:'12px', color:'#94a3b8'}}>{userItem.floor} {userItem.room}号室</div>
                    <div style={{fontSize:'16px', fontWeight:'bold'}}>{userItem.name} 様</div>
                  </div>
                  <div style={{fontSize:'22px', color: isSelected ? '#2d6a4f' : '#cbd5e1'}}>{isSelected ? '✅' : '＋'}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={rightScrollSide}>
          <div style={stickySubHeader}>
            <div style={{fontWeight:'bold', color:'#2d6a4f', fontSize:'14px'}}>2. 選んだ人のメニューを確認</div>
            <div style={{fontSize:'12px', color:'#94a3b8'}}>{selectedMembers.length} 名選択中</div>
          </div>
          <div style={userVerticalList}>
            {selectedMembers.length === 0 ? (
              <div style={emptyMessage}>← 左のリストから選んでください</div>
            ) : (
              <>
                {selectedMembers.map(m => (
                  <div key={m.id} style={selectedCardStyle}>
                    <div style={selectedCardHeader}><span style={{fontWeight:'bold', fontSize:'16px'}}>{m.room} {m.name} 様</span></div>
                    <div style={menuFlexContainer}>
                      {simpleMenus.map(menu => {
                        const isActive = m.menus.includes(menu);
                        return (
                          <button key={menu} onClick={() => toggleMenu(m.id, menu)}
                            style={{ ...pcMenuBtn, backgroundColor: isActive ? '#2d6a4f' : '#f8fafc', color: isActive ? 'white' : '#64748b', border: `2px solid ${isActive ? '#2d6a4f' : '#cbd5e1'}`, flex: 1 }}>
                            {menu}
                          </button>
                        );
                      })}
                      <button onClick={() => toggleUserSelection(m)} style={removeBtnStyle}>取り消し</button>
                    </div>
                  </div>
                ))}
                <div ref={rightListEndRef} />
              </>
            )}
          </div>
        </section>
      </div>

      <footer style={pcFooterStyle}>
        <div style={{fontSize:'18px', color: '#2d6a4f'}}>合計 <strong>{selectedMembers.length}</strong> 名の予約を確定します</div>
        <button disabled={selectedMembers.length === 0 || visibleDates.length === 0} onClick={() => setPage('timeselect')}
          style={{ ...pcConfirmBtn, backgroundColor: (selectedMembers.length === 0 || visibleDates.length === 0) ? '#ccc' : '#2d6a4f' }}>
          開始時間を選択する ➔
        </button>
      </footer>
    </div>
  );
}

// スタイル設定
const pcWrapperStyle = { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', width: '100%', position: 'relative' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const monthBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#2d6a4f', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const monthLabelStyle = { fontSize: '16px', fontWeight: 'bold' };
const activeMonthBoxStyle = { fontSize: '14px', color:'#2d6a4f', marginTop:'5px', fontWeight:'bold' };
const twoColumnLayout = { display: 'flex', flex: 1, gap: '20px', minHeight: 0, marginBottom: '80px' };
const leftScrollSide = { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '15px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const rightScrollSide = { flex: 1.2, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRadius: '15px', border: '2px solid #2d6a4f', overflow: 'hidden', boxShadow: '0 4px 15px rgba(45,106,79,0.1)' };
const stickySubHeader = { padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' };
const sortBarStyle = { display: 'flex', gap: '8px', marginTop: '10px' };
const pcSortBtn = { padding: '6px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const userVerticalList = { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
const userRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderRadius: '12px', border: '1px solid', cursor: 'pointer', transition: '0.2s' };
const selectedCardStyle = { padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', backgroundColor: '#fcfcfc' };
const selectedCardHeader = { marginBottom: '10px' };
const menuFlexContainer = { display: 'flex', gap: '8px', alignItems: 'center' };
const pcMenuBtn = { padding: '10px 0', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.15s' };
const removeBtnStyle = { padding: '10px 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' };
const emptyMessage = { textAlign: 'center', marginTop: '100px', color: '#94a3b8', fontSize: '14px' };
const pcFooterStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: 'white', borderRadius: '15px 15px 0 0', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)', zIndex: 10 };
const pcConfirmBtn = { padding: '12px 40px', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };