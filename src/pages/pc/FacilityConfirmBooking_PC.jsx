import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabase'; // 🌟 保存のために追加

export default function FacilityConfirmBooking_PC({ 
  keepDates = [], 
  users, 
  selectedMembers = [], 
  setSelectedMembers, 
  setPage,
  historyList = [],
  user 
}) {
  // 🌟【ロジック復元】自動月判定
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthSlash = currentMonthKey.replace(/-/g, '/');
    const thisMonthHistory = historyList.filter(h => h.facility === user?.name && h.date.startsWith(currentMonthSlash));
    
    const isAllDone = thisMonthHistory.length >= users.length && users.length > 0;
    if (isAllDone) return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return now;
  });

  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const simpleMenus = ['カット', 'カラー', 'パーマ'];

  const rightListEndRef = useRef(null);
  const leftListRef = useRef(null);

  useEffect(() => {
    if (rightListEndRef.current) {
      rightListEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMembers.length]);

  const changeViewMonth = (offset) => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1));
  };

  const currentMonthKey = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}`;

  // 🌟【重要：施設フィルター】自分の施設の、かつ表示月の日付だけを表示
  const visibleDates = keepDates
    .filter(d => {
      const dateStr = typeof d === 'string' ? d : d?.date;
      const facilityName = typeof d === 'string' ? user.name : d?.facility;
      return dateStr && dateStr.startsWith(currentMonthKey) && facilityName === user.name;
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

  // 🌟【重要：保存の瞬間ロジック】DBと同期して自動保存を実現
  const toggleUserSelection = async (u, index = null) => {
    const isAdded = selectedMembers.find(m => m.id === u.id);
    const newSelectedStatus = !isAdded;

    // 1. DBのフラグと初期メニュー（カット）を更新
    // 🌟 選択した瞬間、DBの menus 列に ['カット'] を保存します
    const { error } = await supabase
      .from('members')
      .update({ 
        is_selected: newSelectedStatus,
        menus: newSelectedStatus ? ['カット'] : [] 
      })
      .eq('id', u.id);

    if (error) {
      console.error("保存失敗:", error);
      alert("通信エラーにより選択を保存できませんでした。");
      return;
    }

    // 2. 画面上のStateを更新
    if (isAdded) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== u.id));
    } else {
      if (u.facility === user.name) {
        // 🌟 ここでも「カット」を初期値としてセット
        setSelectedMembers([...selectedMembers, { ...u, menus: ['カット'] }]);
        if (index !== null && leftListRef.current) {
          const nextElement = leftListRef.current.children[index + 1];
          if (nextElement) {
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }
  };

  // 🌟【重要：メニュー変更の保存】
  const toggleMenu = async (userId, menuName) => {
    const target = selectedMembers.find(m => m.id === userId);
    if (!target) return;

    // 現在のメニューリストを取得して切り替え
    const currentMenus = target.menus || [];
    const newMenus = currentMenus.includes(menuName) 
      ? currentMenus.filter(m => m !== menuName) 
      : [...currentMenus, menuName];
    
    // 🌟 全て外した場合は空配列ではなく、あえて「未選択」状態を許容するか、
    // あるいはカット等に戻すか選べますが、基本は操作通りの配列をDBへ送ります
    const finalMenus = newMenus;

    // 1. DBに選んだメニュー配列を即時保存
    const { error } = await supabase
      .from('members')
      .update({ menus: finalMenus })
      .eq('id', userId);

    if (error) {
      console.error("メニュー保存失敗:", error);
      return;
    }

    // 2. 画面上のStateを更新
    setSelectedMembers(selectedMembers.map(u => {
      if (u.id === userId) {
        return { ...u, menus: finalMenus };
      }
      return u;
    }));
  };

  return (
    <div style={pcWrapperStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#4a3728', fontSize: '28px'}}>✅ これで決まり！予約確定！</h2>
          <div style={activeMonthBoxStyle}>
            訪問予定日：{visibleDates.length > 0 ? visibleDates.map(d => d.replace(/-/g, '/')).join(' ・ ') : "表示月のキープ枠なし"}
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
            <div style={{fontWeight:'800', color:'#5d4037', fontSize:'16px'}}>1. 施術を受ける方を選んでください</div>
            <div style={sortBarStyle}>
              <button onClick={() => toggleSort('room')} style={{...pcSortBtn, backgroundColor: sortKey === 'room' ? '#4a3728' : 'white', color: sortKey === 'room' ? 'white' : '#4a3728', borderColor: '#4a3728'}}>部屋順</button>
              <button onClick={() => toggleSort('name')} style={{...pcSortBtn, backgroundColor: sortKey === 'name' ? '#4a3728' : 'white', color: sortKey === 'name' ? 'white' : '#4a3728', borderColor: '#4a3728'}}>名前順</button>
            </div>
          </div>
          <div style={userVerticalList} ref={leftListRef}>
            {sortedUsers.map((userItem, idx) => {
              const isSelected = selectedMembers.some(m => m.id === userItem.id);
              return (
                <div key={userItem.id} onClick={() => toggleUserSelection(userItem, idx)}
                  style={{ ...userRowStyle, backgroundColor: isSelected ? '#f0f9f1' : 'white', borderColor: isSelected ? '#2d6a4f' : '#e2d8f0' }}>
                  <div>
                    <div style={{fontSize:'14px', color:'#8b5e3c', fontWeight: '600'}}>{userItem.floor} {userItem.room}号室</div>
                    <div style={{fontSize:'20px', fontWeight:'800', color: '#4a3728'}}>{userItem.name} 様</div>
                  </div>
                  <div style={{fontSize:'28px', color: isSelected ? '#2d6a4f' : '#e2d6cc'}}>{isSelected ? '✅' : '＋'}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={rightScrollSide}>
          <div style={stickySubHeader}>
            <div style={{fontWeight:'800', color:'#2d6a4f', fontSize:'16px'}}>2. 選んだ人のメニューを確認</div>
            <div style={{fontSize:'14px', color:'#1b4332', fontWeight: 'bold', marginTop: '4px'}}>{selectedMembers.length} 名選択中</div>
          </div>
          <div style={userVerticalList}>
            {selectedMembers.length === 0 ? (
              <div style={emptyMessage}>← 左のリストから選んでください</div>
            ) : (
              <>
                {selectedMembers.map(m => (
                  <div key={m.id} style={selectedCardStyle}>
                    <div style={selectedCardHeader}><span style={{fontWeight:'800', fontSize:'20px', color: '#4a3728'}}>{m.room} {m.name} 様</span></div>
                    <div style={menuFlexContainer}>
                      {simpleMenus.map(menu => {
                        const isActive = m.menus && m.menus.includes(menu);
                        return (
                          <button key={menu} onClick={() => toggleMenu(m.id, menu)}
                            style={{ ...pcMenuBtn, backgroundColor: isActive ? '#2d6a4f' : 'white', color: isActive ? 'white' : '#2d6a4f', border: `2px solid ${isActive ? '#2d6a4f' : '#a39081'}`, flex: 1 }}>
                            {menu}
                          </button>
                        );
                      })}
                      <button onClick={() => toggleUserSelection(m)} style={removeBtnStyle}>取消</button>
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
        <div style={{fontSize:'22px', color: '#4a3728', fontWeight: '800'}}>合計 <strong>{selectedMembers.length}</strong> 名の予約を確定します</div>
        <button disabled={selectedMembers.length === 0 || visibleDates.length === 0} onClick={() => setPage('timeselect')}
          style={{ ...pcConfirmBtn, backgroundColor: (selectedMembers.length === 0 || visibleDates.length === 0) ? '#cbd5e0' : '#4a3728' }}>
          開始時間を選択する ➔
        </button>
      </footer>
    </div>
  );
}

// デザインスタイル（変更なし）
const pcWrapperStyle = { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', width: '100%', position: 'relative', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '24px 30px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)', marginBottom: '20px' };
const monthNavStyle = { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#f9f7f5', padding: '10px 20px', borderRadius: '15px', border: '1px solid #e2d6cc' };
const monthBtnStyle = { backgroundColor: 'white', color: '#4a3728', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '18px', border: '1px solid #e0d6cc' };
const monthLabelStyle = { fontSize: '22px', fontWeight: '800', color: '#4a3728', minWidth: '140px', textAlign: 'center' };
const activeMonthBoxStyle = { fontSize: '18px', color:'#7a6b5d', marginTop:'8px', fontWeight:'800' };
const twoColumnLayout = { display: 'flex', flex: 1, gap: '25px', minHeight: 0, marginBottom: '100px' };
const leftScrollSide = { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '25px', border: '1px solid #e2d6cc', overflow: 'hidden' };
const rightScrollSide = { flex: 1.2, display: 'flex', flexDirection: 'column', backgroundColor: '#fdfcfb', borderRadius: '25px', border: '3px solid #2d6a4f', overflow: 'hidden', boxShadow: '0 8px 25px rgba(45,106,79,0.12)' };
const stickySubHeader = { padding: '20px 25px', borderBottom: '1px solid #e2d6cc', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' };
const sortBarStyle = { display: 'flex', gap: '12px', marginTop: '12px' };
const pcSortBtn = { padding: '10px 20px', borderRadius: '12px', border: '2px solid', cursor: 'pointer', fontSize: '14px', fontWeight: '800' };
const userVerticalList = { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' };
const userRowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 25px', borderRadius: '18px', border: '2px solid', cursor: 'pointer' };
const selectedCardStyle = { padding: '20px', borderRadius: '20px', border: '1px solid #e2d6cc', backgroundColor: 'white' };
const selectedCardHeader = { marginBottom: '15px' };
const menuFlexContainer = { display: 'flex', gap: '10px', alignItems: 'center' };
const pcMenuBtn = { padding: '14px 0', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' };
const removeBtnStyle = { padding: '14px 18px', backgroundColor: '#fff5f5', color: '#c62828', border: '2px solid #ef9a9a', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' };
const emptyMessage = { textAlign: 'center', marginTop: '120px', color: '#a39081', fontSize: '18px', fontWeight: '800' };
const pcFooterStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', backgroundColor: 'white', borderRadius: '30px 30px 0 0', boxShadow: '0 -10px 30px rgba(74, 55, 40, 0.1)', zIndex: 10, border: '1px solid #e2d6cc' };
const pcConfirmBtn = { padding: '20px 50px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '22px', cursor: 'pointer' };