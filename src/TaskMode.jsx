import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase'; 

export default function TaskMode({ 
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
  const finishButtonRef = useRef(null);

  // --- 日付取得ユーティリティ ---
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getTodayStr();
  const todaySlash = todayStr.replace(/-/g, '/');
  const monthKeySlash = todaySlash.substring(0, 7); // 2026/01 形式
  
  // --- 状態管理 ---
  const [sortBy, setSortBy] = useState("room");
  const [showConfirmDone, setShowConfirmDone] = useState(null); 
  const [showMenu, setShowMenu] = useState(null); 
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showReset, setShowReset] = useState(null); 
  const [showAddList, setShowAddList] = useState(false); 
  const [addListSortKey, setAddListSortKey] = useState('room');
  const [saveMessage, setSaveMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  // セット予約の日程特定
  const currentBookingSet = bookingList.find(b => 
    b.facility === activeFacility && 
    Array.isArray(b.dates) && 
    b.dates.some(d => d.replace(/\//g, '-') === todayStr)
  );

  const sessionDates = currentBookingSet 
    ? currentBookingSet.dates.map(d => d.replace(/-/g, '/')) 
    : [todaySlash];

  // 今日のこの施設の予約データを特定
  const currentBooking = bookingList.find(b => 
    b.facility === activeFacility && (b.date || "").replace(/\//g, '-') === todayStr
  );
  
  const allMembersInTask = currentBooking?.members || [];

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

  // 進捗計算ロジック
  const doneCount = allMembersInTask.filter(m => 
    historyList.some(h => 
      h.name === m.name && 
      h.facility === activeFacility &&
      h.date.startsWith(monthKeySlash)
    )
  ).length;

  const cancelCount = allMembersInTask.filter(m => m.status === 'cancel').length;
  const totalRaw = allMembersInTask.length;
  const remainingCount = totalRaw - doneCount - cancelCount;
  const progressPercent = totalRaw > 0 ? ((doneCount + cancelCount) / totalRaw) * 100 : 0;
  
  // 🌟 エラー箇所修正：変数名を isFinishedAll に統一
  const isFinishedAll = totalRaw > 0 && remainingCount === 0;

  useEffect(() => {
    if (isFinishedAll) {
      setTimeout(() => {
        finishButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [isFinishedAll]);

  const handleFinalSave = async () => {
    try {
      setSaveMessage("クラウドに保存中...");
      if (currentBooking) {
        const { error } = await supabase.from('bookings').upsert(currentBooking, { onConflict: 'id' });
        if (error) throw error;
      }
      setSaveMessage("クラウドに保存しました！");
      setTimeout(() => { setPage('admin-top'); }, 1200);
    } catch (error) {
      setSaveMessage("保存に失敗しました");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const handleMemberClick = (m) => {
    setShowConfirmDone(m);
  };

  const onConfirmDoneOk = (m) => {
    const hopeMenus = m.menus || ["カット"];
    setShowConfirmDone(null);
    if (hopeMenus.includes("カラー")) {
      setShowMenu(m); 
    } else {
      completeTask(m, hopeMenus.join('＋'));
    }
  };

  const executeCancelMember = (memberName) => {
    const updatedMembers = allMembersInTask.map(m => 
      m.name === memberName ? { ...m, status: 'cancel' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    setShowCancelConfirm(null);
  };

  const handleResetMember = async (targetMember) => {
    setHistoryList(prev => prev.filter(h => 
      !(h.name === targetMember.name && h.date.startsWith(monthKeySlash) && h.facility === activeFacility)
    ));
    const updatedMembers = allMembersInTask.map(m => 
      m.name === targetMember.name ? { ...m, status: 'yet' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    await supabase.from('history').delete()
      .match({ name: targetMember.name, facility: activeFacility })
      .like('date', `${monthKeySlash}%`);
    setShowReset(null);
  };

  const completeTask = (m, finalMenu, colorNum = "") => {
    let price = 0;
    const basePrices = { 'カット': 1600, 'カラー': 5600, 'パーマ': 4600, 'カラー（リタッチ）': 4600, 'カラー（全体）': 5600 };
    if (basePrices[finalMenu]) { price = basePrices[finalMenu]; }
    else if (finalMenu.includes('カラー')) {
      price = finalMenu.includes('カット') ? (finalMenu.includes('リタッチ') ? 6100 : 7100) : (finalMenu.includes('リタッチ') ? 4600 : 5600);
    } else if (finalMenu.includes('カット')) { price = basePrices['カット']; }

    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");
    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room, name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
    }]);

    const updatedMembers = allMembersInTask.map(member => member.name === m.name ? { ...member, status: 'done' } : member);
    setBookingList(prev => prev.map(b => b.id === currentBooking.id ? { ...b, members: updatedMembers } : b));
    if (colorNum) updateUserNotes(m.name, activeFacility, colorNum); 
    setShowMenu(null); setShowColorPicker(null);
  };

  const sortedYetMembers = allMembersInTask
    .filter(m => !historyList.some(h => h.name === m.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash)) && m.status !== 'cancel')
    .sort((a, b) => sortBy === "room" ? String(a.room).localeCompare(String(b.room), undefined, { numeric: true }) : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja'));

  const groupedDone = historyList
    .filter(h => h.facility === activeFacility && h.date.startsWith(monthKeySlash))
    .reduce((acc, h) => {
      if (!acc[h.date]) acc[h.date] = [];
      acc[h.date].push(h);
      return acc;
    }, {});

  const sortedDoneDates = Object.keys(groupedDone).sort((a, b) => b.localeCompare(a));
  const cancelMembers = allMembersInTask.filter(m => m.status === 'cancel');

  const handleAddExtra = (m) => {
    const newMember = { ...m, id: `extra-${Date.now()}`, menus: ["カット"], facility: activeFacility, isExtra: true, status: 'yet' };
    setBookingList(prev => prev.map(b => {
      if (b.id === currentBooking.id) {
        if (b.members?.some(ex => ex.name === m.name)) return b;
        return { ...b, members: [...(b.members || []), newMember] };
      }
      return b;
    }));
    setShowAddList(false);
  };

  const getMenuOptions = (m) => {
    const originalMenu = (m.menus || ["カット"]).join('＋');
    if (!originalMenu.includes("カラー")) return [originalMenu];
    return [originalMenu.replace("カラー", "カラー（リタッチ）"), originalMenu.replace("カラー", "カラー（全体）")];
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <div style={fixedHeaderWrapperStyle}>
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          {facilities.length > 1 && (
            <div style={tabContainerStyle}>
              {facilities.map(f => (
                <button key={f} onClick={() => setActiveFacility(f)} style={{...miniFacilityTab, backgroundColor: activeFacility===f?'#1e3a8a':'#e2e8f0', color: activeFacility===f?'white':'#64748b'}}>{f}</button>
              ))}
            </div>
          )}
          <div style={statusRowStyle}>
            <div style={facilityNameBadge}>{activeFacility || "訪問先なし"}</div>
            <div style={progressTextStyle}>
                {totalRaw}名中 / <b style={{color:'#ed32eaff'}}>{doneCount}名 完</b> / 残 {remainingCount}名 
                {cancelCount > 0 && <span style={{color:'#ef4444'}}> / 欠 {cancelCount}名</span>}
            </div>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#ed32ea', transition: 'width 0.3s ease' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setSortBy('room')} style={{...sortBtnSmall, backgroundColor: sortBy==='room'?'#1e3a8a':'white', color: sortBy==='room'?'white':'#1e3a8a'}}>部屋順</button>
            <button onClick={() => setSortBy('name')} style={{...sortBtnSmall, backgroundColor: sortBy==='name'?'#1e3a8a':'white', color: sortBy==='name'?'white':'#1e3a8a'}}>名前順</button>
            <button onClick={() => setShowAddList(true)} style={{ ...addTopBtnStyle, backgroundColor: '#3b82f6', cursor: 'pointer' }}>＋ 追加</button>
          </div>
        </div>
      </div>

      <Layout>
        <div style={{ padding: '10px 12px', marginTop: '125px', paddingBottom: '120px' }}>
          
          <div style={{ marginBottom: '25px' }}>
            <h3 style={sectionLabelStyle}>⏳ 施術待ち ({sortedYetMembers.length}名)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedYetMembers.map((m, idx) => (
                <div key={idx} onClick={() => handleMemberClick(m)} style={memberRowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span style={roomNumSimpleStyle}>{m.room}</span>
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>{m.name} 様</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{(m.menus || ["カット"]).join(' / ')} {m.isExtra && "★当日"}</div>
                    </div>
                  </div>
                  <button onClick={(e) => {e.stopPropagation(); setShowCancelConfirm(m)}} style={cancelBtnStyle}>欠席</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <h3 style={sectionLabelStyle}>✅ 施術完了・欠席</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {sortedDoneDates.map(date => (
                <div key={date} style={doneDateGroupBoxStyle}>
                  <div style={doneDateHeaderStyle}>✨ {date === todaySlash ? '今日' : date.split('/')[2] + '日'}の完了分 ({groupedDone[date].length}名)</div>
                  {groupedDone[date].sort((a,b) => String(a.room).localeCompare(String(b.room), undefined, {numeric:true})).map((h, i) => (
                    <div key={i} onClick={() => setShowReset(h)} style={doneMemberItemStyle}>
                       <span style={{minWidth:'30px', color:'#94a3b8'}}>{h.room}</span>
                       <span style={{flex:1, fontWeight:'bold', color:'#64748b'}}>{h.name} 様</span>
                       <span style={{fontSize:'11px', color:'#10b981', backgroundColor:'#ecfdf5', padding:'2px 6px', borderRadius:'4px'}}>{h.menu} 済</span>
                    </div>
                  ))}
                </div>
              ))}

              {cancelMembers.length > 0 && (
                <div style={{...doneDateGroupBoxStyle, backgroundColor:'#fee2e2', borderColor:'#fecaca'}}>
                   <div style={{...doneDateHeaderStyle, color:'#e11d48'}}>🚩 欠席（キャンセル） ({cancelMembers.length}名)</div>
                   {cancelMembers.map((m, i) => (
                     <div key={i} onClick={() => setShowReset(m)} style={doneMemberItemStyle}>
                        <span style={{minWidth:'30px', color:'#fca5a5'}}>{m.room}</span>
                        <span style={{flex:1, fontWeight:'bold', color:'#ef4444'}}>{m.name} 様</span>
                        <span style={{fontSize:'11px', color:'white', backgroundColor:'#ef4444', padding:'2px 6px', borderRadius:'4px'}}>欠席</span>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {/* 🌟 修正箇所：isFinishedAll を使用 */}
            {isFinishedAll && ( <button ref={finishButtonRef} onClick={() => setPage('task-confirm')} style={finishBtnStyle}>お仕事お疲れさました！ ♡</button> )}
            <button onClick={handleFinalSave} style={pauseBtnStyle}>今日はここまで (保存して戻る)</button>
          </div>
        </div>
      </Layout>

      <button className="floating-back-btn" onClick={handleFinalSave} style={{ position:'fixed', zIndex: 10001, bottom: '20px', left: '20px', width:'50px', height:'50px', borderRadius:'25px', backgroundColor:'#1e3a8a', color:'white', border:'none', fontSize:'24px', cursor:'pointer' }}>←</button>
      {saveMessage && ( <div style={toastStyle}>{saveMessage}</div> )}

      {showConfirmDone && (
        <div style={overlayStyle} onClick={() => setShowConfirmDone(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showConfirmDone.name} 様</div>
            <div style={{fontSize: '18px', fontWeight:'bold', color: '#1e293b', margin: '15px 0 25px'}}>施術完了ですか？</div>
            <div style={{display:'flex', gap:'15px'}}>
              <button onClick={() => onConfirmDoneOk(showConfirmDone)} style={{...bigBtnStyle, backgroundColor: '#10b981', flex:1}}>OK</button>
              <button onClick={() => setShowConfirmDone(null)} style={{...bigBtnStyle, backgroundColor: '#64748b', flex:1}}>NO</button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div style={overlayStyle} onClick={() => setShowCancelConfirm(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showCancelConfirm.name} 様</div>
            <div style={{fontSize: '15px', color: '#64748b', margin: '10px 0 20px'}}>予約をキャンセル（欠席）扱いにしますか？</div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button onClick={() => executeCancelMember(showCancelConfirm.name)} style={{...bigBtnStyle, backgroundColor: '#ef4444'}}>はい、キャンセルします</button>
              <button onClick={() => setShowCancelConfirm(null)} style={{...bigBtnStyle, backgroundColor: '#64748b'}}>いいえ、戻ります</button>
            </div>
          </div>
        </div>
      )}

      {showReset && (
        <div style={overlayStyle} onClick={() => setShowReset(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showReset.name} 様</div>
            <div style={{marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px'}}>
              <button onClick={() => handleResetMember(showReset)} style={{...bigBtnStyle, backgroundColor: '#f59e0b'}}>未完了に戻す</button>
              <button onClick={() => setShowReset(null)} style={{...bigBtnStyle, backgroundColor: '#64748b'}}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showMenu && (
        <div style={overlayStyle} onClick={() => setShowMenu(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showMenu.name} 様</div>
            <div style={{marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px'}}>
              {getMenuOptions(showMenu).map(opt => (
                <button key={opt} onClick={() => { opt.includes("カラー") ? (setShowColorPicker({ member: showMenu, menu: opt }), setShowMenu(null)) : completeTask(showMenu, opt); }} style={{...bigBtnStyle, backgroundColor: '#10b981'}}>{opt.includes('（') ? opt : `✅ ${opt} 完了`}</button>
              ))}
              <button onClick={() => setShowMenu(null)} style={{...bigBtnStyle, backgroundColor: '#64748b'}}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {showColorPicker && (
        <div style={overlayStyle} onClick={() => setShowColorPicker(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showColorPicker.member.name} 様</div>
            <div style={{fontSize: '13px', color: '#64748b', marginBottom: '15px'}}>{showColorPicker.menu} の薬剤を選択</div>
            <div style={{textAlign:'left', maxHeight:'40vh', overflowY:'auto', padding:'5px'}}>
              {['オリーブカーキー', 'プルーンアッシュ'].map(group => (
                <div key={group} style={{marginBottom:'15px'}}>
                  <div style={{fontSize:'12px', fontWeight:'bold', color: group === 'オリーブカーキー' ? '#2d6a4f' : '#4b2c5e', marginBottom:'8px'}}>【{group}】</div>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                    {colorList.filter(c => c.includes(group === 'オリーブカーキー' ? 'OK' : 'PA')).map(color => (
                      <button key={color} onClick={() => completeTask(showColorPicker.member, showColorPicker.menu, color)} style={{...miniSortBtnStyle, padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>{color}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowColorPicker(null); setShowMenu(showColorPicker.member); }} style={{...bigBtnStyle, backgroundColor: '#64748b', marginTop: '15px'}}>戻る</button>
          </div>
        </div>
      )}

      {showAddList && (
        <div style={overlayStyle} onClick={() => setShowAddList(false)}>
          <div style={largeListPopupStyle} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{margin:0}}>当日追加</h3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setAddListSortKey('room')} style={{ ...miniSortBtnStyle, backgroundColor: addListSortKey === 'room' ? '#1e3a8a' : 'white', color: addListSortKey === 'room' ? 'white' : '#1e3a8a' }}>部屋順</button>
                <button onClick={() => setAddListSortKey('name')} style={{ ...miniSortBtnStyle, backgroundColor: addListSortKey === 'name' ? '#1e3a8a' : 'white', color: addListSortKey === 'name' ? 'white' : '#1e3a8a' }}>名前順</button>
              </div>
            </div>
            <div style={scrollListAreaStyle}>
              {users.filter(u => u.facility === activeFacility && !allMembersInTask.some(am => am.name === u.name)).sort((a, b) => addListSortKey === 'room' ? String(a.room).localeCompare(String(b.room), undefined, { numeric: true }) : (a.kana || a.name).localeCompare(b.kana || b.name, 'ja')).map((u, i) => (
                <div key={i} onClick={() => handleAddExtra(u)} style={addListRowStyle}><span style={{fontWeight:'bold'}}>{u.room} {u.name} 様</span><span style={plusIconStyle}>＋</span></div>
              ))}
            </div>
            <button onClick={() => setShowAddList(false)} style={closeBtnStyle}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionLabelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', paddingLeft: '4px' };
const doneDateGroupBoxStyle = { backgroundColor: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '12px', overflow: 'hidden', marginBottom:'10px' };
const doneDateHeaderStyle = { fontSize: '12px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px', borderBottom: '1px solid #edf2f7', paddingBottom: '4px' };
const doneMemberItemStyle = { display: 'flex', alignItems: 'center', padding: '8px 4px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', cursor: 'pointer' };
const toastStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(30, 58, 138, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '50px', zIndex: 20000, fontWeight: 'bold', fontSize: '17px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none' };
const fixedHeaderWrapperStyle = { position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1000px', backgroundColor: '#f0f7f4', zIndex: 1000, padding: '8px 15px' };
const statusRowStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: '8px' };
const facilityNameBadge = { backgroundColor: '#ff8d02ff', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' };
const progressTextStyle = { fontSize: '16px', color: '#000000ff', fontWeight: 'bold', alignSelf: 'flex-end' };
const tabContainerStyle = {display:'flex', gap:'5px', marginBottom:'6px', overflowX:'auto'};
const miniFacilityTab = { padding: '4px 10px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 'bold' };
const sortBtnSmall = { flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #1e3a8a', fontWeight: 'bold', fontSize: '16px' };
const addTopBtnStyle = { flex: 1.2, padding: '8px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', border: '2px solid transparent', backgroundColor: 'white', padding: '10px 15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom:'8px' };
const roomNumSimpleStyle = { fontSize: '16px', fontWeight: 'bold', color: '#64748b', minWidth: '30px' };
const cancelBtnStyle = { padding: '6px 12px', backgroundColor: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10002 };
const menuBoxStyle = { backgroundColor: 'white', width: '85%', maxWidth: '400px', borderRadius: '24px', padding: '20px', textAlign: 'center' };
const modalNameStyle = { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' };
const bigBtnStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', color: 'white', fontSize: '15px', fontWeight: 'bold' };
const largeListPopupStyle = { backgroundColor: 'white', width: '90%', height: '80vh', maxWidth: '500px', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding:'15px' };
const modalHeaderStyle = { paddingBottom: '10px', borderBottom: '1px solid #eee', textAlign: 'center' };
const scrollListAreaStyle = { flex: 1, overflowY: 'auto', padding: '10px 0' };
const addListRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9' };
const plusIconStyle = { backgroundColor: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '12px', textAlign: 'center', lineHeight: '24px', fontWeight: 'bold' };
const closeBtnStyle = { padding: '12px', backgroundColor: '#f8fafc', border: 'none', fontWeight: 'bold' };
const finishBtnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#ff85a2', color: 'white', fontSize: '17px', fontWeight: 'bold' };
const pauseBtnStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #1e3a8a', backgroundColor: 'white', color: '#1e3a8a', fontSize: '15px', fontWeight: 'bold' };
const miniSortBtnStyle = { flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid #1e3a8a', fontWeight: 'bold', fontSize: '12px' };