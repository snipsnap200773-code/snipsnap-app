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
  // 🌟 追加：キャンセル確認用ポップアップの状態
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
  
  const [leftSort, setLeftSort] = useState("room");
  const [rightSort, setRightSort] = useState("room");
  const [showColorTypePicker, setShowColorTypePicker] = useState(null);
  const [showColorNumberPicker, setShowColorNumberPicker] = useState(null);
  const [pendingMenuName, setPendingMenuName] = useState("");
  const [showReset, setShowReset] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addSearchSort, setAddSearchSort] = useState("room");

  // 🌟【最重要：セット予約の日程特定ロジック】
  // 今日の日付が含まれている「セット予約」全体を見つけます
  const currentBookingSet = bookingList.find(b => 
    b.facility === activeFacility && 
    Array.isArray(b.dates) && 
    b.dates.some(d => formatDateForCompare(d) === todaySlash)
  );

  // 今回のセッション期間（全日程）を配列化：['2025/12/12', '2025/12/13'...]
  const sessionDates = currentBookingSet 
    ? currentBookingSet.dates.map(d => formatDateForCompare(d)) 
    : [todaySlash];

  // 現在の施設の「今日」の予約枠を特定（追加用）
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

  // 🌟【進捗ステータス判定：セッション期間を考慮】
  // 完了：今回のセット期間中に1回でも履歴がある人
  const doneMembers = allMembersInTask.filter(m => 
    historyList.some(h => h.name === m.name && sessionDates.includes(h.date) && h.facility === activeFacility)
  );
  // キャンセル：ステータスがcancelの人
  const cancelMembers = allMembersInTask.filter(m => m.status === 'cancel');
  // 未完了：完了でもキャンセルでもない人
  const yetMembers = allMembersInTask.filter(m => 
    !historyList.some(h => h.name === m.name && sessionDates.includes(h.date) && h.facility === activeFacility) && 
    m.status !== 'cancel'
  );

  const totalRaw = allMembersInTask.length;
  const doneCount = doneMembers.length;
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

  const handleMemberClick = (m) => {
    const hopeMenus = m.menus || [];
    if (hopeMenus.includes('カラー')) setShowColorTypePicker(m);
    else completeTask(m, hopeMenus.join('＆') || 'カット');
  };

  const completeTask = async (m, finalMenu, colorNum = "") => {
    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");
    let price = 0;
    const basePrices = {
      'カット': 1600, 'カラー': 5600, 'パーマ': 4600,
      'カラー（リタッチ）': 4600, 'カラー（全体）': 5600
    };
    if (basePrices[finalMenu]) {
      price = basePrices[finalMenu];
    } else if (finalMenu.includes('カラー')) {
      if (finalMenu.includes('カット')) {
        price = (finalMenu.includes('リタッチ') || finalMenu.includes('(リ)')) ? 6100 : 7100;
      } else {
        price = (finalMenu.includes('リタッチ') || finalMenu.includes('(リ)')) ? 4600 : 5600;
      }
    } else if (finalMenu.includes('カット')) {
      price = basePrices['カット'];
    } else if (finalMenu.includes('パーマ')) {
      price = basePrices['パーマ'];
    }

    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room,
      name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
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
    // セッション期間中の履歴をすべて削除対象にする
    setHistoryList(prev => prev.filter(h => !(h.name === m.name && sessionDates.includes(h.date) && h.facility === activeFacility)));
    // DBからも今回のセッション期間の履歴を消す
    await supabase.from('history').delete()
      .match({ name: m.name, facility: activeFacility })
      .in('date', sessionDates);

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
      if (currentBooking) {
        await supabase.from('bookings').upsert(currentBooking, { onConflict: 'id' });
      }
      setSaveMessage("保存しました！");
      setTimeout(() => { 
        setSaveMessage("");
        setPage('admin-top'); 
      }, 1000);
    } catch (error) {
      setSaveMessage("保存に失敗しました");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const closeAllModals = () => {
    setShowColorTypePicker(null); setShowColorNumberPicker(null); setShowReset(null);
  };

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
            <h3>⏳ 施術待ち</h3>
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
            {yetMembers.length === 0 && (
              <div style={{textAlign:'center', color:'#94a3b8', marginTop:'100px'}}>待ちの方はいません</div>
            )}
          </div>
        </section>

        {/* 右カラム：完了・キャンセル */}
        <section style={{...columnStyle, backgroundColor: '#f8fafc', borderLeft: '2px solid #e2e8f0'}}>
          <div style={columnHeader}>
            <h3>✅ 完了・キャンセル</h3>
            <div style={sortTabGroup}>
              <button onClick={()=>setRightSort("room")} style={sortTab(rightSort==="room")}>部屋順</button>
              <button onClick={()=>setRightSort("name")} style={sortTab(rightSort==="name")}>名前順</button>
            </div>
          </div>
          <div style={scrollArea} ref={doneListRef}>
            {[...doneMembers, ...cancelMembers].sort(sortFn(rightSort)).map((m, idx) => {
              // 今回のセッション期間内での履歴を探す
              const hist = historyList.find(h => h.name === m.name && sessionDates.includes(h.date) && h.facility === activeFacility);
              const isCancel = m.status === 'cancel';
              return (
                <div key={idx} onClick={() => setShowReset(m)} style={{...doneCardStyle, borderColor: isCancel ? '#fecaca' : '#10b981'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'12px', color:'#64748b'}}>{m.room}号室</div>
                    <b>{m.name} 様</b>
                    {hist && (
                      <div style={{marginTop:'4px'}}>
                        <div style={doneMenuDetail}>{hist.menu}</div>
                        {hist.date !== todaySlash && (
                          <div style={{fontSize:'10px', color:'#10b981', fontWeight:'bold', marginTop:'2px'}}>
                            ✨ {hist.date.split('/')[2]}日に施術済み
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={{...badgeStyle, backgroundColor: isCancel ? '#ef4444' : '#10b981'}}>
                    {isCancel ? '欠席' : '完了'}
                  </span>
                </div>
              );
            })}
            {isAllFinished && (
              <div ref={finishBtnRef} style={{ padding: '20px 0' }}>
                <button onClick={() => setShowConfirmPopup(true)} style={finishBtnStyle}>お疲れさまでした♡</button>
              </div>
            )}
          </div>
        </section>
      </div>

      {saveMessage && (
        <div style={toastStyle}>{saveMessage}</div>
      )}

      {/* キャンセル確認ポップアップ */}
      {showCancelConfirm && (
        <div style={overlayStyle} onClick={() => setShowCancelConfirm(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a'}}>{showCancelConfirm.name} 様</h3>
            <div style={{fontSize: '16px', color: '#64748b', margin: '15px 0 25px'}}>
              予約をキャンセル（欠席）扱いに<br/>しますか？
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button onClick={() => executeCancelMember(showCancelConfirm)} 
                style={confirmYesBtn}>はい、キャンセルします</button>
              <button onClick={() => setShowCancelConfirm(null)} 
                style={confirmNoBtn}>いいえ、戻ります</button>
            </div>
          </div>
        </div>
      )}

      {/* 完了ポップアップ (TaskConfirmMode) */}
      {showConfirmPopup && (
        <div style={fullOverlayStyle} onClick={() => setShowConfirmPopup(false)}>
          <div style={popupWrapperStyle} onClick={e => e.stopPropagation()}>
            <TaskConfirmMode
              historyList={historyList}
              bookingList={bookingList}
              facilityName={activeFacility}
              user={user}
              setPage={(target) => {
                if (target === 'task') setShowConfirmPopup(false);
                else setPage(target); 
              }}
              completeFacilityBooking={async () => {
                if (refreshAllData) await refreshAllData();
                setShowConfirmPopup(false);
                setPage('admin-history');
              }}
            />
          </div>
        </div>
      )}

      {/* 当日追加ポップアップ */}
      {showAddMember && (
        <div style={overlayStyle} onClick={() => setShowAddMember(false)}>
          <div style={{...modalStyle, width:'500px', maxHeight:'80vh', display:'flex', flexDirection:'column'}} onClick={e => e.stopPropagation()}>
            <h3 style={{margin:'0 0 15px'}}>当日追加</h3>
            <div style={{flex:1, overflowY:'auto', textAlign:'left'}}>
              {users.filter(u => u.facility === activeFacility && !allMembersInTask.some(m => m.name === u.name))
                .sort(sortFn(addSearchSort)).map(u => (
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

      {/* カラーリタッチ・全体選択 */}
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

      {/* 薬剤ブランドグループ表示 */}
      {showColorNumberPicker && (
        <div style={overlayStyle} onClick={() => setShowColorNumberPicker(null)}>
          <div style={{...modalStyle, width: '600px'}} onClick={e => e.stopPropagation()}>
            <h3 style={{color:'#1e3a8a', marginBottom:'20px'}}>{showColorNumberPicker.name} 様</h3>
            <p style={{fontWeight:'bold', marginBottom:'20px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
              {pendingMenuName}
            </p>
            
            <div style={{textAlign:'left', maxHeight:'50vh', overflowY:'auto', padding:'0 10px'}}>
              {/* オリーブカーキー (OK) */}
              <div style={{marginBottom:'20px'}}>
                <div style={{fontSize:'14px', fontWeight:'bold', color:'#2d6a4f', marginBottom:'8px'}}>【オリーブカーキー】</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                  {colorList.filter(c => c.includes('OK')).map(c => (
                    <button key={c} onClick={() => completeTask(showColorNumberPicker, pendingMenuName, c)} style={colorBtnStyle}>{c}</button>
                  ))}
                </div>
              </div>

              {/* プルーンアッシュ (PA) */}
              <div style={{marginBottom:'20px'}}>
                <div style={{fontSize:'14px', fontWeight:'bold', color:'#4b2c5e', marginBottom:'8px'}}>【プルーンアッシュ】</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'10px'}}>
                  {colorList.filter(c => c.includes('PA')).map(c => (
                    <button key={c} onClick={() => completeTask(showColorNumberPicker, pendingMenuName, c)} style={colorBtnStyle}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => { setShowColorNumberPicker(null); setShowColorTypePicker(showColorNumberPicker); }} style={modalCloseBtn}>戻る</button>
          </div>
        </div>
      )}

      {/* 未完了に戻すポップアップ */}
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

// 🎨 デザイン定数（省略なし）
const confirmYesBtn = { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const confirmNoBtn = { width: '100%', padding: '16px', borderRadius: '15px', border: 'none', backgroundColor: '#64748b', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
const toastStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(30, 58, 138, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '50px', zIndex: 20000, fontWeight: 'bold', fontSize: '18px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none' };
const saveBtn = { padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const finishBtnStyle = { width: '100%', padding: '25px', backgroundColor: '#ff85d0', color: 'white', border: 'none', borderRadius: '20px', fontSize: '24px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(255, 133, 208, 0.3)', transition: '0.3s' };
const headerPanelStyle = { backgroundColor:'white', padding:'15px 25px', borderBottom:'1px solid #e2e8f0' };
const containerStyle = { display:'flex', flexDirection:'column', height:'100vh', backgroundColor:'#f8fafc' };
const mainLayout = { display:'flex', flex:1, overflow:'hidden', padding:'10px', gap:'10px' };
const columnStyle = { flex:1, display:'flex', flexDirection:'column', backgroundColor:'white', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' };
const columnHeader = { padding:'10px 15px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' };
const scrollArea = { flex:1, overflowY:'auto', padding:'10px', scrollBehavior: 'smooth' };
const cardStyle = { display:'flex', alignItems:'center', padding:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', marginBottom:'10px', cursor:'pointer', backgroundColor:'#fff', transition:'0.2s' };
const doneCardStyle = { display:'flex', padding:'12px', border:'2px solid', marginBottom:'8px', borderRadius:'10px', backgroundColor:'#fff', cursor:'pointer' };
const inlineCancelBtn = { padding:'6px 12px', backgroundColor:'#fff', color:'#ef4444', border:'1px solid #ef4444', borderRadius:'6px', fontSize:'11px', fontWeight:'bold', cursor:'pointer' };
const addMemberBtn = { padding:'8px 20px', backgroundColor:'#1e3a8a', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer' };
const addSearchRow = { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', borderBottom:'1px solid #f1f5f9' };
const addPlusBtn = { width:'32px', height:'32px', borderRadius:'50%', border:'none', backgroundColor:'#3b82f6', color:'white', fontWeight:'bold', cursor:'pointer' };
const modalRestoreBtn = { width:'100%', padding:'15px', backgroundColor:'#10b981', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' };
const doneMenuDetail = { fontSize:'12px', color:'#1e40af', backgroundColor:'#eff6ff', padding:'2px 6px', borderRadius:'4px', marginTop:'4px', display:'inline-block' };
const sortTabGroup = { display:'flex', gap:'4px' };
const sortTab = (active) => ({ padding:'4px 10px', fontSize:'11px', borderRadius:'4px', border:'1px solid #cbd5e1', backgroundColor: active ? '#1e3a8a' : '#fff', color: active ? '#fff' : '#64748b', cursor:'pointer' });
const progressValue = { fontSize:'14px', fontWeight:'bold', marginTop:'5px' };
const badgeStyle = { color:'white', padding:'2px 8px', borderRadius:'4px', fontSize:'12px', height:'fit-content' };
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