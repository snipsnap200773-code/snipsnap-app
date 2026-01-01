import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase'; 

export default function TaskMode_PC({ 
  bookingList = [], 
  historyList = [], 
  setHistoryList, // 🌟 AdminMenu_PCから正しく受け取る
  setBookingList, 
  setPage, 
  users = [],
  menuPrices = {}, 
  activeFacility,  
  setActiveFacility,
  colorList = [],
  updateUserNotes 
}) {
  const finishButtonRef = useRef(null);
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();
  const todaySlash = todayStr.replace(/-/g, '/');
  
  const [sortBy, setSortBy] = useState("room");
  const [showMenu, setShowMenu] = useState(null); 
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showReset, setShowReset] = useState(null); 
  const [showAddList, setShowAddList] = useState(false); 
  const [addListSortKey, setAddListSortKey] = useState('room');
  const [saveMessage, setSaveMessage] = useState("");

  // 今日の施設リスト（タブ用）
  const facilities = Array.from(new Set(
    bookingList
      .filter(b => (b.date || "").replace(/\//g, '-') === todayStr)
      .map(b => b.facility)
  ));

  useEffect(() => {
    if (!activeFacility && facilities.length > 0) {
      setActiveFacility(facilities[0]);
    }
  }, [facilities, activeFacility, setActiveFacility]);

  // 今日のこの施設の予約データを特定
  const currentBooking = bookingList.find(b => 
    b.facility === activeFacility && (b.date || "").replace(/\//g, '-') === todayStr
  );
  
  const allMembersInTask = currentBooking?.members || [];

  // 進捗計算
  const doneCount = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility)
  ).length;
  const cancelCount = allMembersInTask.filter(m => m.status === 'cancel').length;
  const totalRaw = allMembersInTask.length;
  const isFinishedAll = totalRaw > 0 && (doneCount + cancelCount === totalRaw);

  // 🌟【重要】クラウド保存ロジック（モバイル版に準拠）
  const handleFinalSave = async () => {
    try {
      setSaveMessage("クラウドに保存中...");
      if (currentBooking) {
        const { error } = await supabase.from('bookings').upsert(currentBooking, { onConflict: 'id' });
        if (error) throw error;
      }
      setSaveMessage("クラウドに保存しました！");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error) {
      setSaveMessage("保存に失敗しました");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  // 🌟【最重要】完了処理（setHistoryList を確実に実行）
  const completeTask = (m, finalMenu, colorNum = "") => {
    if (typeof setHistoryList !== 'function') {
      console.error("setHistoryListが関数ではありません。リレーを確認してください。");
      return;
    }

    const price = menuPrices[finalMenu] || 0;
    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");

    // 1. 履歴を追加
    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room, 
      name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
    }]);

    // 2. 予約リストのステータスを更新
    const updatedMembers = allMembersInTask.map(member => 
      member.name === m.name ? { ...member, status: 'done' } : member
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));

    if (colorNum && typeof updateUserNotes === 'function') {
      updateUserNotes(m.name, activeFacility, menuName);
    }
    setShowMenu(null); setShowColorPicker(null);
  };

  // キャンセル処理
  const handleCancelMember = (memberName) => {
    const updatedMembers = allMembersInTask.map(m => 
      m.name === memberName ? { ...m, status: 'cancel' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
  };

  // 戻す処理
  const handleResetMember = async (targetMember) => {
    setHistoryList(prev => prev.filter(h => !(h.name === targetMember.name && h.date === todaySlash && h.facility === activeFacility)));
    const updatedMembers = allMembersInTask.map(m => 
      m.name === targetMember.name ? { ...m, status: 'yet' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    await supabase.from('history').delete().match({ name: targetMember.name, date: todaySlash, facility: activeFacility });
    setShowReset(null);
  };

  // 当日追加
  const handleAddExtra = (m) => {
    const newMember = { ...m, id: `extra-${Date.now()}`, menus: ["カット"], isExtra: true, status: 'yet', facility: activeFacility };
    setBookingList(prev => prev.map(b => {
      if (b.id === currentBooking.id) {
        if (b.members?.some(ex => ex.name === m.name)) return b;
        return { ...b, members: [...(b.members || []), newMember] };
      }
      return b;
    }));
    setShowAddList(false);
  };

  const sortedDisplayMembers = [...allMembersInTask].sort((a, b) => {
    const isDoneA = historyList.some(h => h.name === a.name && h.date === todaySlash);
    const isDoneB = historyList.some(h => h.name === b.name && h.date === todaySlash);
    const statusA = isDoneA ? 'done' : (a.status || 'yet');
    const statusB = isDoneB ? 'done' : (b.status || 'yet');
    
    const weight = { 'yet': 0, 'done': 1, 'cancel': 1 };
    if (weight[statusA] !== weight[statusB]) return weight[statusA] - weight[statusB];
    if (sortBy === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
  });

  const getMenuOptions = (m) => {
    const originalMenu = (m.menus || ["カット"]).join('＋');
    if (!originalMenu.includes("カラー")) return [originalMenu];
    return [originalMenu.replace("カラー", "カラー（リタッチ）"), originalMenu.replace("カラー", "カラー（全体）")];
  };

  return (
    <div style={containerStyle}>
      <div style={headerPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#1e3a8a' }}>✂️ 今日のタスク入力</h2>
          <div style={progressContainer}>
            <span style={progressLabel}>現在の進捗:</span>
            <span style={progressValue}>{doneCount} / {totalRaw} 名 完了</span>
            <div style={progressBarBg}><div style={{...progressBarFill, width: totalRaw > 0 ? `${(doneCount/totalRaw)*100}%` : '0%'}}></div></div>
          </div>
        </div>

        <div style={controlRowStyle}>
          <div style={tabGroup}>
            {facilities.map(f => (
              <button key={f} onClick={() => setActiveFacility(f)} 
                style={{...facilityTab, backgroundColor: activeFacility===f?'#1e3a8a':'#f1f5f9', color: activeFacility===f?'white':'#64748b'}}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSortBy('room')} style={{...sortBtn, border: sortBy==='room'?'2px solid #1e3a8a':'1px solid #cbd5e1', fontWeight: sortBy==='room'?'bold':'normal'}}>部屋順</button>
            <button onClick={() => setSortBy('name')} style={{...sortBtn, border: sortBy==='name'?'2px solid #1e3a8a':'1px solid #cbd5e1', fontWeight: sortBy==='name'?'bold':'normal'}}>名前順</button>
            <button onClick={() => setShowAddList(true)} style={addBtn}>＋ 当日追加</button>
            <button onClick={handleFinalSave} style={saveBtn}>保存</button>
          </div>
        </div>
      </div>

      <div style={listAreaStyle}>
        {allMembersInTask.length > 0 ? (
          <div style={gridContainer}>
            {sortedDisplayMembers.map((m, idx) => {
              const isDone = historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility);
              const isCancel = m.status === 'cancel';
              return (
                <div key={idx} onClick={() => (isDone || isCancel) ? setShowReset(m) : setShowMenu(m)}
                  style={{ ...cardStyle, 
                    backgroundColor: isCancel ? '#fff1f2' : (isDone ? '#f8fafc' : 'white'),
                    borderColor: isCancel ? '#ef4444' : (isDone ? '#e2e8f0' : (m.isExtra ? '#3b82f6' : '#cbd5e1')),
                    opacity: (isDone || isCancel) ? 0.7 : 1 
                  }}>
                  <div style={cardTopStyle}>
                    <span style={roomNumStyle}>{m.room}号室</span>
                    <span style={badgeStyle(isDone, isCancel)}>{isCancel ? '取消' : (isDone ? '完了' : '待機中')}</span>
                  </div>
                  <div style={nameStyle}>{m.name} 様</div>
                  <div style={menuSummaryStyle}>{(m.menus || ["カット"]).join(' + ')} {m.isExtra && "★当日"}</div>
                  {!isDone && !isCancel && (
                    <button onClick={(e) => {e.stopPropagation(); handleCancelMember(m.name)}} style={inlineCancelBtn}>キャンセル</button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={emptyStateStyle}>本日予定されている予約はありません</div>
        )}

        {isFinishedAll && totalRaw > 0 && ( 
          <button onClick={() => setPage('task-confirm-view')} style={finishBtn}>
            ✨ 本日の業務をすべて完了しました！ (確認画面へ)
          </button> 
        )}
      </div>

      {saveMessage && <div style={toastStyle}>{saveMessage}</div>}

      {/* モーダル：メニュー選択 */}
      {showMenu && (
        <div style={overlayStyle} onClick={() => setShowMenu(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0, color:'#1e3a8a'}}>{showMenu.name} 様</h3>
            <div style={modalBtnGroup}>
              {getMenuOptions(showMenu).map(opt => (
                <button key={opt} onClick={() => opt.includes("カラー") ? (setShowColorPicker({ member: showMenu, menu: opt }), setShowMenu(null)) : completeTask(showMenu, opt)}
                  style={modalMainBtn}>✅ {opt} 完了</button>
              ))}
              <button onClick={() => setShowMenu(null)} style={modalCloseBtn}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* モーダル：カラー選択 */}
      {showColorPicker && (
        <div style={overlayStyle} onClick={() => setShowColorPicker(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showColorPicker.member.name} 様</h3>
            <p style={{fontSize:'14px', color:'#64748b'}}>{showColorPicker.menu} の薬剤を選択</p>
            <div style={colorGrid}>
              {colorList.map(c => <button key={c} onClick={() => completeTask(showColorPicker.member, showColorPicker.menu, c)} style={colorBtn}>{c}</button>)}
            </div>
            <button onClick={() => setShowColorPicker(null)} style={modalCloseBtn}>戻る</button>
          </div>
        </div>
      )}

      {/* モーダル：リセット（戻す） */}
      {showReset && (
        <div style={overlayStyle} onClick={() => setShowReset(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>ステータス変更</h3>
            <p>{showReset.name} 様を未完了に戻しますか？</p>
            <button onClick={() => handleResetMember(showReset)} style={modalResetBtn}>未完了に戻す</button>
            <button onClick={() => setShowReset(null)} style={modalCloseBtn}>閉じる</button>
          </div>
        </div>
      )}

      {/* モーダル：当日追加 */}
      {showAddList && (
        <div style={overlayStyle} onClick={() => setShowAddList(false)}>
          <div style={{...modalStyle, width: '600px', maxHeight: '80vh', overflowY: 'auto'}}>
            <h3 style={{position:'sticky', top:0, background:'white', padding:'10px 0', zIndex:1, color:'#1e3a8a'}}>当日追加を選択</h3>
            <div style={addListGrid}>
              {users.filter(u => u.facility === activeFacility && !allMembersInTask.some(am => am.name === u.name))
                .sort((a,b) => String(a.room).localeCompare(String(b.room), undefined, {numeric:true}))
                .map((u, i) => (
                  <div key={i} onClick={() => handleAddExtra(u)} style={addRowStyle}>
                    <span>{u.room}号室 {u.name} 様</span>
                    <span style={addIcon}>＋</span>
                  </div>
              ))}
            </div>
            <button onClick={() => setShowAddList(false)} style={modalCloseBtn}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerPanelStyle = { backgroundColor: 'white', padding: '25px 30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const progressContainer = { textAlign: 'right' };
const progressLabel = { fontSize: '13px', color: '#64748b', marginRight: '10px' };
const progressValue = { fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a' };
const progressBarBg = { width: '200px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', marginTop: '8px', overflow: 'hidden' };
const progressBarFill = { height: '100%', backgroundColor: '#10b981', transition: '0.3s' };
const controlRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' };
const tabGroup = { display: 'flex', gap: '8px' };
const facilityTab = { padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const sortBtn = { padding: '8px 15px', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' };
const addBtn = { padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const saveBtn = { padding: '10px 20px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

const listAreaStyle = { flex: 1, overflowY: 'auto', padding: '10px 5px' };
const gridContainer = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const cardStyle = { padding: '20px', borderRadius: '15px', border: '1px solid', cursor: 'pointer', transition: '0.2s', position: 'relative' };
const cardTopStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const roomNumStyle = { fontSize: '18px', fontWeight: 'bold', color: '#64748b' };
const nameStyle = { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' };
const menuSummaryStyle = { fontSize: '14px', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' };
const inlineCancelBtn = { marginTop: '15px', width: '100%', padding: '8px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' };

const badgeStyle = (done, cancel) => ({
  fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px',
  backgroundColor: cancel ? '#ef4444' : (done ? '#10b981' : '#f1f5f9'),
  color: (done || cancel) ? 'white' : '#64748b'
});

const emptyStateStyle = { textAlign: 'center', padding: '100px', color: '#94a3b8', fontSize: '18px' };
const finishBtn = { width: '100%', marginTop: '40px', padding: '25px', backgroundColor: '#ed32ea', color: 'white', border: 'none', borderRadius: '20px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(237,50,234,0.3)' };

const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '24px', width: '400px', textAlign: 'center' };
const modalBtnGroup = { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' };
const modalMainBtn = { padding: '15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };
const modalCloseBtn = { marginTop: '10px', padding: '12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const modalResetBtn = { width: '100%', padding: '15px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const colorGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '20px 0' };
const colorBtn = { padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const addListGrid = { display: 'flex', flexDirection: 'column', gap: '5px' };
const addRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' };
const addIcon = { backgroundColor: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '50%', textAlign: 'center', lineHeight: '24px' };
const toastStyle = { position: 'fixed', bottom: '40px', right: '40px', backgroundColor: '#1e3a8a', color: 'white', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };