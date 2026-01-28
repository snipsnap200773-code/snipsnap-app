import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase';
// 🌟 司令塔(App.jsx)の仕様に合わせたインポート
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
  user,
  refreshAllData // 🌟 App.jsxからデータ更新用関数を受け取る
}) {
  const yetListRef = useRef(null);
  const doneListRef = useRef(null);
  const finishBtnRef = useRef(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [saveMessage, setSaveMessage] = useState(""); 
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  // 日付形式の不一致を解消
  const formatDateForCompare = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.replace(/-/g, '/'); 
  };

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };
  const todaySlash = getTodayStr();
  const monthKeySlash = todaySlash.substring(0, 7); // 例: "2026/01"
  
  const [leftSort, setLeftSort] = useState("room");
  const [rightSort, setRightSort] = useState("room");
  const [showConfirmDone, setShowConfirmDone] = useState(null); // 🌟 追加：完了確認ポップアップ
  const [showColorTypePicker, setShowColorTypePicker] = useState(null);
  const [showColorNumberPicker, setShowColorNumberPicker] = useState(null);
  const [pendingMenuName, setPendingMenuName] = useState("");
  const [showReset, setShowReset] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearchSort, setAddSearchSort] = useState("room");

  // 🌟 セット予約の日程特定ロジック
  const currentBookingSet = bookingList.find(b => 
    b.facility === activeFacility && 
    Array.isArray(b.dates) && 
    b.dates.some(d => formatDateForCompare(d) === todaySlash)
  );

  const sessionDates = currentBookingSet 
    ? currentBookingSet.dates.map(d => formatDateForCompare(d)) 
    : [todaySlash];

  // 現在の施設の「今日」の予約枠を特定
  const currentBooking = bookingList.find(b =>
    b.facility === activeFacility && formatDateForCompare(b.date) === todaySlash
  );
  
  const allMembersInTask = currentBooking?.members || [];
  const facilities = Array.from(new Set(bookingList.filter(b => formatDateForCompare(b.date) === todaySlash).map(b => b.facility)));

  useEffect(() => {
    if (!activeFacility && facilities.length > 0) {
      setActiveFacility(facilities[0]);
    }
  }, [facilities, activeFacility, setActiveFacility]);

  // 進捗ステータス判定（月間基準）
  const doneMembersRaw = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash))
  );
  const cancelMembers = allMembersInTask.filter(m => m.status === 'cancel');
  const yetMembers = allMembersInTask.filter(m => 
    !historyList.some(h => h.name === m.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash)) && 
    m.status !== 'cancel'
  );

  const totalRaw = allMembersInTask.length;
  const doneCount = doneMembersRaw.length;
  const cancelCount = cancelMembers.length;
  const remainingCount = yetMembers.length;

  const isAllFinished = totalRaw > 0 && (doneCount + cancelCount === totalRaw);

  useEffect(() => {
    if (isAllFinished && finishBtnRef.current) {
      finishBtnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isAllFinished]);

  const sortFn = (type) => (a, b) => {
    if (type === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
  };

  // 🌟【新規追加：メンバークリック時の初動】
  const handleMemberClick = (m) => {
    setShowConfirmDone(m); // まず「施術完了ですか？」を出す
  };

  // 🌟【新規追加：確認ポップアップでOKを押した時】
  const onConfirmDoneOk = (m) => {
    const hopeMenus = m.menus || ["カット"];
    setShowConfirmDone(null);
    if (hopeMenus.includes("カラー")) {
      setShowColorTypePicker(m); // カラーがある場合は既存の選択フローへ
    } else {
      completeTask(m, hopeMenus.join('＆') || 'カット'); // それ以外は完了へ
    }
  };

  const completeTask = async (m, finalMenu, colorNum = "") => {
    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");
    let price = 0;
    const basePrices = { 'カット': 1600, 'カラー': 5600, 'パーマ': 4600, 'カラー（リタッチ）': 4600, 'カラー（全体）': 5600 };
    if (basePrices[finalMenu]) { price = basePrices[finalMenu]; }
    else if (finalMenu.includes('カラー')) {
      price = finalMenu.includes('カット') ? (finalMenu.includes('リタッチ') ? 6100 : 7100) : (finalMenu.includes('リタッチ') ? 4600 : 5600);
    } else if (finalMenu.includes('カット')) { price = basePrices['カット']; }

    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room, name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
    }]);

    const updatedMembers = allMembersInTask.map(member => member.name === m.name ? { ...member, status: 'done' } : member);
    await updateBookingInCloud(updatedMembers);
    if (colorNum) updateUserNotes(m.name, activeFacility, colorNum);
    closeAllModals();
  };

  const executeCancelMember = async (m) => {
    const updatedMembers = allMembersInTask.map(member => member.name === m.name ? { ...member, status: 'cancel' } : member);
    await updateBookingInCloud(updatedMembers);
    setShowCancelConfirm(null);
  };

  const handleRestore = async (m) => {
    setHistoryList(prev => prev.filter(h => !(h.name === m.name && h.date.startsWith(monthKeySlash) && h.facility === activeFacility)));
    await supabase.from('history').delete().match({ name: m.name, facility: activeFacility }).like('date', `${monthKeySlash}%`);
    const updatedMembers = allMembersInTask.map(member => member.name === m.name ? { ...member, status: 'yet' } : member);
    await updateBookingInCloud(updatedMembers);
    setShowReset(null);
  };

  const updateBookingInCloud = async (updatedMembers) => {
    const updatedBooking = { ...currentBooking, members: updatedMembers };
    setBookingList(prev => prev.map(b => b.id === currentBooking.id ? updatedBooking : b));
    await supabase.from('bookings').upsert(updatedBooking);
  };

  const handleFinalSave = async () => {
    try {
      setSaveMessage("クラウドに保存中...");
      if (currentBooking) { await supabase.from('bookings').upsert(currentBooking, { onConflict: 'id' }); }
      setSaveMessage("保存しました！");
      setTimeout(() => { setSaveMessage(""); setPage('admin-top'); }, 1000);
    } catch (error) { setSaveMessage("保存に失敗しました"); setTimeout(() => setSaveMessage(""), 3000); }
  };

  const closeAllModals = () => {
    setShowConfirmDone(null); setShowColorTypePicker(null); setShowColorNumberPicker(null); setShowReset(null);
  };

  // 🌟【完了リストの日付別グループ化ロジック】
  const currentMonthHistory = historyList.filter(h => h.facility === activeFacility && h.date.startsWith(monthKeySlash));
  const groupedDone = currentMonthHistory.reduce((acc, h) => {
    // allMembersInTaskに含まれている人、または当日追加の人だけを対象にする
    if (allMembersInTask.some(m => m.name === h.name) || h.isExtra) {
      if (!acc[h.date]) acc[h.date] = [];
      acc[h.date].push(h);
    }
    return acc;
  }, {});
  const sortedDoneDates = Object.keys(groupedDone).sort((a, b) => b.localeCompare(a));

  return (
    <div style={containerStyle}>
      <div style={headerPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e3a8a' }}>✂️ 現場タスク入力 (PC)</h2>
            <div style={progressValue}>
              {totalRaw}名中 / <span style={{color:'#10b981'}}>{doneCount}名 完了</span> / 残り {remainingCount}名 / <span style={{color:'#ef4444'}}>欠席 {cancelCount}名</span>
            </div>
          </div>
          <div style={{display:'flex', gap:'10px'}}>
             <button onClick={() => setShowAddMember(true)} style={addMemberBtn}>＋ 当日追加</button>
             <button onClick={handleFinalSave} style={saveBtn}>今日はここまで</button>
          </div>
        </div>
      </div>

      <div style={mainLayout}>
        {/* 左カラム：施術待ち */}
        <section style={columnStyle}>
          <div style={columnHeader}>
            <h3>⏳ 施術待ち ({yetMembers.length}名)</h3>
            <div style={sortTabGroup}>
              <button onClick={()=>setLeftSort("room")} style={sortTab(leftSort==="room")}>部屋順</button>
              <button onClick={()=>setLeftSort("name")} style={sortTab(leftSort==="name")}>名前順</button>
            </div>
          </div>
          <div style={scrollArea} ref={yetListRef}>
            {yetMembers.sort(sortFn(leftSort)).map((m, idx) => (
              <div key={idx} onClick={() => handleMemberClick(m)} style={cardStyle}>
                <div style={{flex:1}}>
                  <div style={roomNumStyle}>{m.room}号室</div>
                  <div style={nameStyle}>{m.name} 様</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {m.menus?.map((menu, i) => <span key={i} style={hopeMenuBadgeStyle}>{menu}</span>)}
                  </div>
                </div>
                <button onClick={(e) => {e.stopPropagation(); setShowCancelConfirm(m)}} style={inlineCancelBtn}>キャンセル</button>
              </div>
            ))}
            {yetMembers.length === 0 && <div style={{textAlign:'center', color:'#94a3b8', marginTop:'100px'}}>施術待ちの方はいません</div>}
          </div>
        </section>

        {/* 右カラム：完了・キャンセル（日付別グループ） */}
        <section style={{...columnStyle, backgroundColor: '#f8fafc', borderLeft: '2px solid #e2e8f0'}}>
          <div style={columnHeader}>
            <h3>✅ 完了・キャンセル</h3>
            <div style={sortTabGroup}>
              <button onClick={()=>setRightSort("room")} style={sortTab(rightSort==="room")}>部屋順</button>
              <button onClick={()=>setRightSort("name")} style={sortTab(rightSort==="name")}>名前順</button>
            </div>
          </div>
          <div style={scrollArea} ref={doneListRef}>
            
            {/* 🌟 日付ごとのグループ表示 */}
            {sortedDoneDates.map(date => (
              <div key={date} style={doneDateGroupWrapper}>
                <div style={doneDateHeader}>✨ {date === todaySlash ? '今日' : date.split('/')[2] + '日'}の完了分 ({groupedDone[date].length}名)</div>
                {groupedDone[date].sort(sortFn(rightSort)).map((h, idx) => (
                  <div key={idx} onClick={() => setShowReset(h)} style={doneCardStyle}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px', color:'#64748b'}}>{h.room}号室</div>
                      <b style={{fontSize:'15px', color:'#475569'}}>{h.name} 様</b>
                      <div style={doneMenuDetail}>{h.menu}</div>
                    </div>
                    <span style={{...badgeStyle, backgroundColor: '#10b981'}}>完了</span>
                  </div>
                ))}
              </div>
            ))}

            {/* キャンセル（欠席）枠 */}
            {cancelMembers.length > 0 && (
              <div style={{...doneDateGroupWrapper, marginTop:'20px'}}>
                <div style={{...doneDateHeader, color:'#ef4444', borderColor:'#fecaca'}}>🚩 欠席（キャンセル） ({cancelMembers.length}名)</div>
                {cancelMembers.sort(sortFn(rightSort)).map((m, idx) => (
                  <div key={idx} onClick={() => setShowReset(m)} style={{...doneCardStyle, borderColor: '#fecaca'}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:'11px', color:'#64748b'}}>{m.room}号室</div>
                      <b style={{fontSize:'15px', color:'#ef4444'}}>{m.name} 様</b>
                    </div>
                    <span style={{...badgeStyle, backgroundColor: '#ef4444'}}>欠席</span>
                  </div>
                ))}
              </div>
            )}

            {isAllFinished && (
              <div ref={finishBtnRef} style={{ padding: '20px 0' }}>
                <button onClick={() => setShowConfirmPopup(true)} style={finishBtnStyle}>お疲れさまでした♡</button>
              </div>
            )}
          </div>
        </section>
      </div>

      {saveMessage && ( <div style={toastStyle}>{saveMessage}</div> )}

      {/* 🌟 施術完了確認ポップアップ (PC用) */}
      {showConfirmDone && (
        <div style={overlayStyle} onClick={() => setShowConfirmDone(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showConfirmDone.name} 様</h3>
            <div style={{fontSize: '22px', fontWeight:'bold', color: '#1e293b', margin: '20px 0 30px'}}>施術完了ですか？</div>
            <div style={{display:'flex', gap:'20px'}}>
              <button onClick={() => onConfirmDoneOk(showConfirmDone)} style={{...confirmYesBtn, backgroundColor: '#10b981', flex:1}}>OK</button>
              <button onClick={() => setShowConfirmDone(null)} style={{...confirmNoBtn, flex:1}}>NO</button>
            </div>
          </div>
        </div>
      )}

      {/* キャンセル確認 */}
      {showCancelConfirm && (
        <div style={overlayStyle} onClick={() => setShowCancelConfirm(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showCancelConfirm.name} 様</h3>
            <div style={{fontSize: '16px', color: '#64748b', margin: '15px 0 25px'}}>予約をキャンセル（欠席）扱いにしますか？</div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button onClick={() => executeCancelMember(showCancelConfirm)} style={confirmYesBtn}>はい、キャンセルします</button>
              <button onClick={() => setShowCancelConfirm(null)} style={confirmNoBtn}>いいえ、戻ります</button>
            </div>
          </div>
        </div>
      )}

      {/* 完了ポップアップ (TaskConfirmMode) */}
      {showConfirmPopup && (
        <div style={fullOverlayStyle} onClick={() => setShowConfirmPopup(false)}>
          <div style={popupWrapperStyle} onClick={e => e.stopPropagation()}>
            <TaskConfirmMode
              historyList={historyList} bookingList={bookingList} facilityName={activeFacility} user={user}
              setPage={(target) => { if (target === 'task') setShowConfirmPopup(false); else setPage(target); }}
              completeFacilityBooking={async () => { if (refreshAllData) await refreshAllData(); setShowConfirmPopup(false); setPage('admin-history'); }}
            />
          </div>
        </div>
      )}

      {/* 当日追加 */}
      {showAddMember && (
        <div style={overlayStyle} onClick={() => setShowAddMember(false)}>
          <div style={{...modalStyle, width:'500px', maxHeight:'80vh', display:'flex', flexDirection:'column'}} onClick={e => e.stopPropagation()}>
            <h3 style={{margin:'0 0 15px'}}>当日追加</h3>
            <div style={{flex:1, overflowY:'auto', textAlign:'left'}}>
              {users.filter(u => u.facility === activeFacility && !allMembersInTask.some(m => m.name === u.name)).sort(sortFn(addSearchSort)).map(u => (
                <div key={u.id} style={addSearchRow}>
                  <span>{u.room} {u.name} 様</span>
                  <button onClick={async () => {
                    const updatedMembers = [...allMembersInTask, { ...u, status: 'yet', menus: ['カット'] }];
                    await updateBookingInCloud(updatedMembers);
                  }} style={addPlusBtn}>＋</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddMember(false)} style={modalCloseBtn}>閉じる</button>
          </div>
        </div>
      )}

      {/* カラー選択フロー */}
      {showColorTypePicker && (
        <div style={overlayStyle} onClick={() => setShowColorTypePicker(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showColorTypePicker.name} 様</h3>
            <div style={modalGrid}>
              <button onClick={() => { setPendingMenuName(showColorTypePicker.menus.join('＆').replace('カラー','カラー(リ)')); setShowColorNumberPicker(showColorTypePicker); setShowColorTypePicker(null); }} style={menuChoiceBtn}>🎨 リタッチ</button>
              <button onClick={() => { setPendingMenuName(showColorTypePicker.menus.join('＆').replace('カラー','カラー(全)')); setShowColorNumberPicker(showColorTypePicker); setShowColorTypePicker(null); }} style={menuChoiceBtn}>🌈 全体</button>
            </div>
            <button onClick={() => setShowColorTypePicker(null)} style={modalCloseBtn}>閉じる</button>
          </div>
        </div>
      )}

      {showColorNumberPicker && (
        <div style={overlayStyle} onClick={() => setShowColorNumberPicker(null)}>
          <div style={{...modalStyle, width: '600px'}} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a', marginBottom:'20px'}}>{showColorNumberPicker.name} 様</h3>
            <p style={{fontWeight:'bold', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>{pendingMenuName}</p>
            <div style={{textAlign:'left', maxHeight:'50vh', overflowY:'auto', padding:'0 10px'}}>
              {['オリーブカーキー', 'プルーンアッシュ'].map(group => (
                <div key={group} style={{marginBottom:'20px'}}>
                  <div style={{fontSize:'14px', fontWeight:'bold', color: group==='オリーブカーキー'?'#2d6a4f':'#4b2c5e', marginBottom:'8px'}}>【{group}】</div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                    {colorList.filter(c => c.includes(group==='オリーブカーキー'?'OK':'PA')).map(c => (
                      <button key={c} onClick={() => completeTask(showColorNumberPicker, pendingMenuName, c)} style={colorBtnStyle}>{c}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowColorNumberPicker(null); setShowColorTypePicker(showColorNumberPicker); }} style={modalCloseBtn}>戻る</button>
          </div>
        </div>
      )}

      {/* リセット確認 */}
      {showReset && (
        <div style={overlayStyle} onClick={() => setShowReset(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showReset.name} 様</h3>
            <button onClick={() => handleRestore(showReset)} style={modalRestoreBtn}>未完了に戻す</button>
            <button onClick={() => setShowReset(null)} style={modalCloseBtn}>キャンセル</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 デザイン定数（完全維持 + 追加分）
const doneDateGroupWrapper = { marginBottom: '30px', padding: '10px', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #e2e8f0' };
const doneDateHeader = { fontSize: '13px', fontWeight: 'bold', color: '#10b981', paddingBottom: '8px', marginBottom: '12px', borderBottom: '2px solid #ecfdf5' };

const confirmYesBtn = { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const confirmNoBtn = { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const toastStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(30, 58, 138, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '50px', zIndex: 20000, fontWeight: 'bold', fontSize: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none' };
const saveBtn = { padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const finishBtnStyle = { width: '100%', padding: '25px', backgroundColor: '#ff85d0', color: 'white', border: 'none', borderRadius: '20px', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer' };
const headerPanelStyle = { backgroundColor:'white', padding:'15px 25px', borderBottom:'1px solid #e2e8f0' };
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#f8fafc' };
const mainLayout = { display:'flex', flex:1, overflow:'hidden', padding:'10px', gap:'10px' };
const columnStyle = { flex:1, display:'flex', flexDirection:'column', backgroundColor:'white', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };
const columnHeader = { padding:'10px 15px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' };
const scrollArea = { flex:1, overflowY:'auto', padding:'10px', scrollBehavior: 'smooth' };
const cardStyle = { display:'flex', alignItems:'center', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'10px', cursor:'pointer', backgroundColor:'#fff', transition:'0.2s' };
const doneCardStyle = { display:'flex', padding:'12px', border:'1px solid #edf2f7', marginBottom:'8px', borderRadius:'10px', backgroundColor:'#fff', cursor:'pointer' };
const inlineCancelBtn = { padding:'6px 12px', backgroundColor:'#fff', color:'#ef4444', border:'1px solid #ef4444', borderRadius:'6px', fontSize:'11px', fontWeight:'bold' };
const addMemberBtn = { padding:'8px 20px', backgroundColor:'#1e3a8a', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold' };
const addSearchRow = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', borderBottom:'1px solid #f1f5f9' };
const addPlusBtn = { width:'32px', height:'32px', borderRadius:'50%', border:'none', backgroundColor:'#3b82f6', color:'white', fontWeight:'bold' };
const modalRestoreBtn = { width:'100%', padding:'15px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold' };
const doneMenuDetail = { fontSize:'11px', color:'#1e40af', backgroundColor:'#eff6ff', padding:'2px 6px', borderRadius:'4px', marginTop:'4px', display:'inline-block' };
const sortTabGroup = { display:'flex', gap:'4px' };
const sortTab = (active) => ({ padding:'4px 10px', fontSize:'11px', borderRadius:'4px', border:'1px solid #cbd5e1', backgroundColor: active ? '#1e3a8a' : '#fff', color: active ? '#fff' : '#64748b', cursor:'pointer' });
const progressValue = { fontSize:'14px', fontWeight:'bold', marginTop:'5px' };
const badgeStyle = { color:'white', padding:'2px 8px', borderRadius:'4px', fontSize:'11px', height:'fit-content' };
const nameStyle = { fontSize:'18px', fontWeight:'bold' };
const hopeMenuBadgeStyle = { fontSize:'11px', padding:'2px 6px', backgroundColor:'#f1f5f9', color:'#475569', borderRadius:'4px' };
const overlayStyle = { position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex: 100, display:'flex', justifyContent:'center', alignItems:'center' };
const modalStyle = { backgroundColor:'white', padding:'25px', borderRadius:'20px', width:'400px', textAlign:'center' };
const modalGrid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'15px' };
const menuChoiceBtn = { padding:'20px 10px', borderRadius:'12px', border:'2px solid #e2e8f0', fontWeight:'bold', cursor:'pointer' };
const colorBtnStyle = { padding:'12px 2px', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'bold' };
const modalCloseBtn = { marginTop:'10px', width:'100%', padding:'10px', border:'none', color:'#64748b', cursor:'pointer' };
const roomNumStyle = { fontSize:'12px', color:'#64748b' };
const fullOverlayStyle = { position:'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10000, display:'flex', justifyContent:'center', alignItems:'center', backdropFilter: 'blur(4px)' };
const popupWrapperStyle = { backgroundColor: 'white', width: '90%', maxWidth: '600px', height: '90vh', borderRadius: '32px', overflowY: 'auto' };