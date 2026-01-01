import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase'; 

export default function TaskMode_PC({ 
  bookingList = [], 
  historyList = [], 
  setHistoryList, 
  setBookingList, 
  setPage, 
  users = [],
  menuPrices = {}, 
  activeFacility,  
  setActiveFacility,
  colorList = [],
  updateUserNotes 
}) {
  // スクロール制御用のRef
  const yetListRef = useRef(null);
  const doneListRef = useRef(null);
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();
  const todaySlash = todayStr.replace(/-/g, '/');
  
  // ソート状態
  const [leftSortBy, setLeftSortBy] = useState("room"); 
  const [rightSortBy, setRightSortBy] = useState("time"); 
  const [isRightDesc, setIsRightDesc] = useState(true); 

  const [showMenu, setShowMenu] = useState(null); 
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showReset, setShowReset] = useState(null); 
  const [showAddList, setShowAddList] = useState(false); 
  const [saveMessage, setSaveMessage] = useState("");

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

  const currentBooking = bookingList.find(b => 
    b.facility === activeFacility && (b.date || "").replace(/\//g, '-') === todayStr
  );
  
  const allMembersInTask = currentBooking?.members || [];

  const doneCount = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility)
  ).length;
  const cancelCount = allMembersInTask.filter(m => m.status === 'cancel').length;
  const totalRaw = allMembersInTask.length;
  const isFinishedAll = totalRaw > 0 && (doneCount + cancelCount === totalRaw);

  const handleFinalSave = async () => {
    try {
      setSaveMessage("クラウドに保存中...");
      if (currentBooking) {
        const { error } = await supabase.from('bookings').upsert(currentBooking, { onConflict: 'id' });
        if (error) throw error;
      }
      setSaveMessage("保存完了！");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error) {
      setSaveMessage("保存失敗");
    }
  };

  // 操作後に一番上へ戻す
  const scrollReset = () => {
    if (yetListRef.current) yetListRef.current.scrollTop = 0;
    if (doneListRef.current) doneListRef.current.scrollTop = 0;
  };

  const completeTask = (m, finalMenu, colorNum = "") => {
    if (typeof setHistoryList !== 'function') return;
    const price = menuPrices[finalMenu] || 0;
    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");

    // 🌟 修正：アプリ内 State だけに finishTime を持たせ、DB送信データからは除外されるよう App.jsx と連携
    const newRecord = {
      date: todaySlash, 
      facility: activeFacility, 
      room: m.room, 
      name: m.name, 
      kana: m.kana, 
      menu: menuName, 
      price: price, 
      status: 'done'
    };

    setHistoryList(prev => [...prev, { ...newRecord, finishTime: new Date().getTime() }]);

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
    setTimeout(scrollReset, 50);
  };

  const handleCancelMember = (memberName) => {
    const updatedMembers = allMembersInTask.map(m => 
      m.name === memberName ? { ...m, status: 'cancel' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    setTimeout(scrollReset, 50);
  };

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
    setTimeout(scrollReset, 50);
  };

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
    setTimeout(scrollReset, 50);
  };

  // 左側ソート
  const yetMembers = allMembersInTask.filter(m => 
    !historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility) && m.status !== 'cancel'
  ).sort((a, b) => {
    if (leftSortBy === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
  });

  // 右側ソート（施術順がデフォルト）
  const doneMembers = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility) || m.status === 'cancel'
  ).sort((a, b) => {
    let result = 0;
    if (rightSortBy === "time") {
      const timeA = historyList.find(h => h.name === a.name && h.date === todaySlash && h.facility === activeFacility)?.finishTime || 0;
      const timeB = historyList.find(h => h.name === b.name && h.date === todaySlash && h.facility === activeFacility)?.finishTime || 0;
      result = timeA - timeB;
    } else if (rightSortBy === "room") {
      result = String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    } else {
      result = (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
    }
    return isRightDesc ? -result : result;
  });

  const toggleRightSort = (key) => {
    if (rightSortBy === key) {
      setIsRightDesc(!isRightDesc);
    } else {
      setRightSortBy(key);
      setIsRightDesc(true); // 切替時は常に最新が上（降順）
    }
    setTimeout(scrollReset, 50);
  };

  const getMenuOptions = (m) => {
    const originalMenu = (m.menus || ["カット"]).join('＋');
    if (!originalMenu.includes("カラー")) return [originalMenu];
    return [originalMenu.replace("カラー", "カラー（リタッチ）"), originalMenu.replace("カラー", "カラー（全体）")];
  };

  return (
    <div style={containerStyle}>
      <div style={headerPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e3a8a' }}>✂️ 現場タスク入力（左右スクロール固定）</h2>
            <div style={tabGroup}>
              {facilities.map(f => (
                <button key={f} onClick={() => setActiveFacility(f)} 
                  style={{...facilityTab, backgroundColor: activeFacility===f?'#1e3a8a':'#f1f5f9', color: activeFacility===f?'white':'#64748b'}}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={progressContainer}>
            <span style={progressValue}>{doneCount} / {totalRaw} 名 完了</span>
            <div style={progressBarBg}><div style={{...progressBarFill, width: totalRaw > 0 ? `${(doneCount/totalRaw)*100}%` : '0%'}}></div></div>
            <button onClick={handleFinalSave} style={saveBtn}>クラウド保存</button>
          </div>
        </div>
      </div>

      <div style={mainLayout}>
        <section style={columnStyle}>
          <div style={columnHeader}>
            <h3 style={{margin:0, fontSize:'16px'}}>⏳ 1. 次に施術する人</h3>
            <div style={{display:'flex', gap:'5px'}}>
               <button onClick={() => { setLeftSortBy('room'); scrollReset(); }} style={{...sortBtnTiny, background: leftSortBy==='room'?'#1e3a8a':'white', color: leftSortBy==='room'?'white':'#1e3a8a'}}>部屋順</button>
               <button onClick={() => { setLeftSortBy('name'); scrollReset(); }} style={{...sortBtnTiny, background: leftSortBy==='name'?'#1e3a8a':'white', color: leftSortBy==='name'?'white':'#1e3a8a'}}>名前順</button>
               <button onClick={() => setShowAddList(true)} style={addBtnTiny}>＋当日追加</button>
            </div>
          </div>
          <div style={scrollArea} ref={yetListRef}>
            {yetMembers.map((m, idx) => (
              <div key={idx} onClick={() => setShowMenu(m)} style={cardStyle}>
                <div style={cardTopStyle}>
                  <span style={roomNumStyle}>{m.room}号室</span>
                  <span style={badgeYet}>待機中</span>
                </div>
                <div style={nameStyle}>{m.name} 様</div>
                <div style={menuSummaryStyle}>{(m.menus || ["カット"]).join(' + ')}</div>
                <button onClick={(e) => {e.stopPropagation(); handleCancelMember(m.name)}} style={inlineCancelBtn}>キャンセル</button>
              </div>
            ))}
            {yetMembers.length === 0 && <div style={emptyStateStyle}>未完了の人はいません</div>}
          </div>
        </section>

        <section style={{...columnStyle, backgroundColor: '#f8fafc', borderLeft: '2px solid #e2e8f0'}}>
          <div style={columnHeader}>
            <h3 style={{margin:0, color:'#10b981', fontSize:'16px'}}>✅ 2. 完了済み</h3>
            <div style={{display:'flex', gap:'5px'}}>
               <button onClick={() => toggleRightSort('room')} style={{...sortBtnTiny, background: rightSortBy==='room'?'#10b981':'white', color: rightSortBy==='room'?'white':'#10b981'}}>部屋順{rightSortBy==='room' && (isRightDesc?'▼':'▲')}</button>
               <button onClick={() => toggleRightSort('name')} style={{...sortBtnTiny, background: rightSortBy==='name'?'#10b981':'white', color: rightSortBy==='name'?'white':'#10b981'}}>名前順{rightSortBy==='name' && (isRightDesc?'▼':'▲')}</button>
            </div>
          </div>
          <div style={scrollArea} ref={doneListRef}>
            {doneMembers.map((m, idx) => {
               const isCancel = m.status === 'cancel';
               return (
                <div key={idx} onClick={() => setShowReset(m)} style={{...doneCardStyle, borderColor: isCancel ? '#ef4444' : '#10b981'}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:'12px', color:'#94a3b8'}}>{m.room}号室</span>
                    <div style={{fontWeight:'bold', color: isCancel ? '#ef4444' : '#1e293b'}}>{m.name} 様</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <span style={badgeStyle(true, isCancel)}>{isCancel ? '取消' : '完了'}</span>
                    <div style={{fontSize:'10px', color:'#64748b', marginTop:'4px'}}>タップで戻す</div>
                  </div>
                </div>
               );
            })}
            {doneMembers.length === 0 && <div style={emptyStateStyle}>完了した人はまだいません</div>}
          </div>

          {isFinishedAll && totalRaw > 0 && ( 
            <button onClick={() => setPage('task-confirm-view')} style={finishBtn}>
              お仕事お疲れさまでした！(確認へ)
            </button> 
          )}
        </section>
      </div>

      {saveMessage && <div style={toastStyle}>{saveMessage}</div>}

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

      {showAddList && (
        <div style={overlayStyle} onClick={() => setShowAddList(false)}>
          <div style={{...modalStyle, width: '500px', maxHeight: '80vh', overflowY: 'auto'}}>
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

// スタイル設定（変更なし）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '10px', overflow:'hidden' };
const headerPanelStyle = { backgroundColor: 'white', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', flexShrink: 0 };
const mainLayout = { display: 'flex', flex: 1, backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: 0 };
const columnStyle = { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 };
const columnHeader = { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', flexShrink: 0 };
const scrollArea = { flex: 1, overflowY: 'auto', padding: '15px', scrollBehavior: 'smooth' };
const progressContainer = { textAlign: 'right', display:'flex', alignItems:'center', gap:'15px' };
const progressValue = { fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', whiteSpace:'nowrap' };
const progressBarBg = { width: '120px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' };
const progressBarFill = { height: '100%', backgroundColor: '#10b981', transition: '0.3s' };
const tabGroup = { display: 'flex', gap: '5px', marginTop:'8px' };
const facilityTab = { padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize:'12px', fontWeight: 'bold' };
const saveBtn = { padding: '8px 20px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize:'13px' };
const cardStyle = { padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '10px', cursor: 'pointer', transition: '0.2s', backgroundColor:'white' };
const doneCardStyle = { display:'flex', alignItems:'center', padding: '12px 15px', borderRadius: '10px', border: '2px solid', marginBottom: '8px', cursor: 'pointer', backgroundColor:'white' };
const cardTopStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' };
const roomNumStyle = { fontSize: '14px', fontWeight: 'bold', color: '#64748b' };
const nameStyle = { fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' };
const menuSummaryStyle = { fontSize: '12px', color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '5px', display: 'inline-block' };
const inlineCancelBtn = { marginTop: '10px', width: '100%', padding: '6px', backgroundColor: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' };
const badgeYet = { fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b' };
const badgeStyle = (done, cancel) => ({
  fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
  backgroundColor: cancel ? '#ef4444' : '#10b981',
  color: 'white'
});
const sortBtnTiny = { padding: '4px 8px', fontSize:'11px', borderRadius:'4px', border:'1px solid #cbd5e1', cursor:'pointer', backgroundColor: 'white' };
const addBtnTiny = { padding: '4px 8px', fontSize:'11px', borderRadius:'4px', border:'none', backgroundColor:'#3b82f6', color:'white', cursor:'pointer' };
const emptyStateStyle = { textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' };
const finishBtn = { margin: '15px', padding: '12px', backgroundColor: '#ed32ea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '20px', width: '400px', textAlign: 'center' };
const modalBtnGroup = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' };
const modalMainBtn = { padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const modalCloseBtn = { marginTop: '10px', padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const modalResetBtn = { width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const colorGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '15px 0' };
const colorBtn = { padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const addListGrid = { display: 'flex', flexDirection: 'column', gap: '5px' };
const addRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' };
const addIcon = { backgroundColor: '#3b82f6', color: 'white', width: '20px', height: '20px', borderRadius: '10px', textAlign: 'center', lineHeight: '20px' };
const toastStyle = { position: 'fixed', bottom: '40px', right: '40px', backgroundColor: '#1e3a8a', color: 'white', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };