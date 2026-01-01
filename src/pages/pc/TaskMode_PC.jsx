import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase'; 
import TaskConfirmMode from '../../TaskConfirmMode'; 

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
  updateUserNotes,
  user
}) {
  const yetListRef = useRef(null);
  const doneListRef = useRef(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false); 
  
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };
  const todaySlash = getTodayStr();
  
  const [leftSortBy, setLeftSortBy] = useState("room"); 
  const [rightSortBy, setRightSortBy] = useState("room"); 
  const [isRightDesc, setIsRightDesc] = useState(false); 

  const [showMenu, setShowMenu] = useState(null); 
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showReset, setShowReset] = useState(null); 
  const [showAddList, setShowAddList] = useState(false); 
  const [saveMessage, setSaveMessage] = useState("");

  const facilities = Array.from(new Set(
    bookingList
      .filter(b => (b.date || "").replace(/-/g, '/') === todaySlash)
      .map(b => b.facility)
  ));

  useEffect(() => {
    if (!activeFacility && facilities.length > 0) {
      setActiveFacility(facilities[0]);
    }
  }, [facilities, activeFacility, setActiveFacility]);

  const currentBooking = bookingList.find(b => 
    b.facility === activeFacility && (b.date || "").replace(/-/g, '/') === todaySlash
  );
  
  const allMembersInTask = currentBooking?.members || [];

  const doneCount = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility)
  ).length;
  const cancelCount = allMembersInTask.filter(m => m.status === 'cancel').length;
  const totalRaw = allMembersInTask.length;
  const remainingCount = totalRaw - doneCount - cancelCount;
  const isFinishedAll = totalRaw > 0 && remainingCount === 0;

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

  const scrollReset = () => {
    if (yetListRef.current) yetListRef.current.scrollTop = 0;
    if (doneListRef.current) doneListRef.current.scrollTop = 0;
  };

  const completeTask = async (m, finalMenu, colorNum = "") => {
    if (typeof setHistoryList !== 'function') return;
    const price = menuPrices[finalMenu] || 0;
    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");

    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room, 
      name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
    }]);

    const updatedMembers = allMembersInTask.map(member => 
      member.name === m.name ? { ...member, status: 'done' } : member
    );
    const updatedBooking = { ...currentBooking, members: updatedMembers };
    
    setBookingList(prev => prev.map(b => b.id === currentBooking.id ? updatedBooking : b));
    await supabase.from('bookings').upsert(updatedBooking, { onConflict: 'id' });

    if (colorNum && typeof updateUserNotes === 'function') {
      updateUserNotes(m.name, activeFacility, menuName);
    }
    setShowMenu(null); setShowColorPicker(null);
    setTimeout(scrollReset, 50);
  };

  const handleCancelMember = async (memberName) => {
    const updatedMembers = allMembersInTask.map(m => m.name === memberName ? { ...m, status: 'cancel' } : m);
    const updatedBooking = { ...currentBooking, members: updatedMembers };
    setBookingList(prev => prev.map(b => b.id === currentBooking.id ? updatedBooking : b));
    await supabase.from('bookings').upsert(updatedBooking, { onConflict: 'id' });
    setTimeout(scrollReset, 50);
  };

  const handleResetMember = async (targetMember) => {
    setHistoryList(prev => prev.filter(h => !(h.name === targetMember.name && h.date === todaySlash && h.facility === activeFacility)));
    const updatedMembers = allMembersInTask.map(m => m.name === targetMember.name ? { ...m, status: 'yet' } : m);
    const updatedBooking = { ...currentBooking, members: updatedMembers };
    setBookingList(prev => prev.map(b => b.id === currentBooking.id ? updatedBooking : b));
    await supabase.from('history').delete().match({ name: targetMember.name, date: todaySlash, facility: activeFacility });
    await supabase.from('bookings').upsert(updatedBooking, { onConflict: 'id' });
    setShowReset(null);
    setTimeout(scrollReset, 50);
  };

  const toggleRightSort = (key) => {
    if (rightSortBy === key) setIsRightDesc(!isRightDesc);
    else { setRightSortBy(key); setIsRightDesc(false); }
    setTimeout(scrollReset, 50);
  };

  return (
    <div style={containerStyle}>
      <div style={headerPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e3a8a' }}>✂️ 現場タスク入力</h2>
            <div style={tabGroup}>
              {facilities.map(f => (
                <button key={f} onClick={() => setActiveFacility(f)} 
                  style={{...facilityTab, backgroundColor: activeFacility===f?'#1e3a8a':'#f1f5f9', color: activeFacility===f?'white':'#64748b'}}>{f}</button>
              ))}
            </div>
          </div>
          <div style={progressContainer}>
            <span style={progressValue}>
                {totalRaw}名中 / <span style={{color:'#10b981', fontWeight:'bold'}}>{doneCount}名 完了</span> / 残 {remainingCount}名
                {cancelCount > 0 && <span style={{color:'#ef4444'}}> / 欠 {cancelCount}名</span>}
            </span>
            <div style={progressBarBg}><div style={{...progressBarFill, width: totalRaw > 0 ? `${((doneCount + cancelCount)/totalRaw)*100}%` : '0%'}}></div></div>
            <button onClick={handleFinalSave} style={saveBtn}>クラウド保存</button>
          </div>
        </div>
      </div>

      <div style={mainLayout}>
        <section style={columnStyle}>
          <div style={columnHeader}><h3>⏳ 1. 次に施術する人</h3></div>
          <div style={scrollArea} ref={yetListRef}>
            {allMembersInTask.filter(m => !historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility) && m.status !== 'cancel')
              .sort((a, b) => leftSortBy === "room" ? String(a.room).localeCompare(String(b.room), undefined, { numeric: true }) : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja'))
              .map((m, idx) => (
                <div key={idx} onClick={() => setShowMenu(m)} style={cardStyle}>
                  <div style={cardTopStyle}><span style={roomNumStyle}>{m.room}号室</span></div>
                  <div style={nameStyle}>{m.name} 様</div>
                  <button onClick={(e) => {e.stopPropagation(); handleCancelMember(m.name)}} style={inlineCancelBtn}>キャンセル</button>
                </div>
            ))}
          </div>
        </section>

        <section style={{...columnStyle, backgroundColor: '#f8fafc', borderLeft: '2px solid #e2e8f0'}}>
          <div style={columnHeader}><h3>✅ 2. 完了・キャンセル済み</h3></div>
          <div style={scrollArea} ref={doneListRef}>
            {allMembersInTask.filter(m => historyList.some(h => h.name === m.name && h.date === todaySlash && h.facility === activeFacility) || m.status === 'cancel')
              .sort((a, b) => {
                let result = String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
                return isRightDesc ? -result : result;
              })
              .map((m, idx) => (
                <div key={idx} onClick={() => setShowReset(m)} style={doneCardStyle}>
                  <div><b>{m.room}号室 {m.name} 様</b></div>
                  <span style={badgeStyle(true, m.status === 'cancel')}>{m.status === 'cancel' ? '欠席' : '完了'}</span>
                </div>
            ))}
          </div>
          {isFinishedAll && totalRaw > 0 && ( 
            <button onClick={() => setShowConfirmPopup(true)} style={finishBtn}>お仕事お疲れさまでした！ (確認へ)</button> 
          )}
        </section>
      </div>

      {/* 🌟 完了確認ポップアップ（外側クリックで閉じる機能付き） */}
      {showConfirmPopup && (
        <div style={fullOverlayStyle} onClick={() => setShowConfirmPopup(false)}>
          <div style={popupWrapperStyle} onClick={e => e.stopPropagation()}>
            <TaskConfirmMode 
              historyList={historyList} 
              bookingList={bookingList} 
              facilityName={activeFacility} 
              user={user} 
              setPage={(target) => target === 'task' ? setShowConfirmPopup(false) : setPage(target)}
              completeFacilityBooking={async () => {
                const todayISO = new Date().toLocaleDateString('sv-SE');
                await supabase.from('bookings').delete().match({ facility: activeFacility, date: todayISO });
                setShowConfirmPopup(false);
                setPage('admin-history');
              }} 
            />
          </div>
        </div>
      )}

      {saveMessage && <div style={toastStyle}>{saveMessage}</div>}

      {showMenu && (
        <div style={overlayStyle} onClick={() => setShowMenu(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop:0, color:'#1e3a8a'}}>{showMenu.name} 様</h3>
            <button onClick={() => completeTask(showMenu, "カット")} style={modalMainBtn}>✅ カット完了</button>
            <button onClick={() => setShowMenu(null)} style={modalCloseBtn}>閉じる</button>
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
    </div>
  );
}

// 🎨 スタイル設定
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
const doneCardStyle = { display:'flex', justifyContent:'space-between', alignItems:'center', padding: '12px 15px', borderRadius: '10px', border: '2px solid #10b981', marginBottom: '8px', cursor: 'pointer', backgroundColor:'white' };
const cardTopStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' };
const roomNumStyle = { fontSize: '14px', fontWeight: 'bold', color: '#64748b' };
const nameStyle = { fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px' };
const inlineCancelBtn = { marginTop: '10px', width: '100%', padding: '6px', backgroundColor: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' };
const badgeStyle = (done, cancel) => ({ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: cancel ? '#ef4444' : '#10b981', color: 'white' });
const finishBtn = { margin: '15px', padding: '12px', backgroundColor: '#ed32ea', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 };
const fullOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' };
const popupWrapperStyle = { backgroundColor: 'white', width: '90%', maxWidth: '600px', height: '90vh', borderRadius: '32px', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '20px', width: '400px', textAlign: 'center' };
const modalMainBtn = { width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const modalCloseBtn = { marginTop: '10px', padding: '10px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const modalResetBtn = { width: '100%', padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const toastStyle = { position: 'fixed', bottom: '40px', right: '40px', backgroundColor: '#1e3a8a', color: 'white', padding: '15px 30px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };