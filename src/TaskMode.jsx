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
  const monthKeySlash = todaySlash.substring(0, 7); // 🌟 2026/01 形式を取得
  
  // --- 状態管理 ---
  const [sortBy, setSortBy] = useState("room");
  const [showMenu, setShowMenu] = useState(null); 
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showReset, setShowReset] = useState(null); 
  const [showAddList, setShowAddList] = useState(false); 
  const [addListSortKey, setAddListSortKey] = useState('room');
  const [saveMessage, setSaveMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);

  // 🌟【最重要：セット予約の日程特定ロジック】
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
  
  // 施設切り替え初期化
  useEffect(() => {
    if (!activeFacility && facilities.length > 0) {
      setActiveFacility(facilities[0]);
    }
  }, [facilities, activeFacility, setActiveFacility]);

  // 🌟【進捗計算ロジック：今月の履歴全体を対象に拡張】
  const doneCount = allMembersInTask.filter(m => 
    historyList.some(h => 
      h.name === m.name && 
      h.facility === activeFacility &&
      h.date.startsWith(monthKeySlash) // 🌟 日付一致ではなく「今月の履歴にあるか」で判定
    )
  ).length;

  const cancelCount = allMembersInTask.filter(m => m.status === 'cancel').length;
  const totalRaw = allMembersInTask.length;
  const remainingCount = totalRaw - doneCount - cancelCount;
  const progressPercent = totalRaw > 0 ? ((doneCount + cancelCount) / totalRaw) * 100 : 0;
  const isFinishedAll = totalRaw > 0 && remainingCount === 0;

  useEffect(() => {
    if (isFinishedAll) {
      setTimeout(() => {
        finishButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [isFinishedAll]);

  // クラウド保存処理
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

  // キャンセル（欠席）実行
  const executeCancelMember = (memberName) => {
    const updatedMembers = allMembersInTask.map(m => 
      m.name === memberName ? { ...m, status: 'cancel' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    setShowCancelConfirm(null);
  };

  // 完了リセット（未完了に戻す）
  const handleResetMember = async (targetMember) => {
    // 今月の該当施設の履歴をすべて削除対象にする
    setHistoryList(prev => prev.filter(h => 
      !(h.name === targetMember.name && h.date.startsWith(monthKeySlash) && h.facility === activeFacility)
    ));
    const updatedMembers = allMembersInTask.map(m => 
      m.name === targetMember.name ? { ...m, status: 'yet' } : m
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));
    
    // DBからも今月の履歴を消す
    await supabase.from('history').delete()
      .match({ name: targetMember.name, facility: activeFacility })
      .like('date', `${monthKeySlash}%`);
      
    setShowReset(null);
  };

  // 施術完了処理
  const completeTask = (m, finalMenu, colorNum = "") => {
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

    const menuName = finalMenu + (colorNum ? ` ${colorNum}` : "");

    // 履歴追加
    setHistoryList(prev => [...prev, {
      date: todaySlash, facility: activeFacility, room: m.room, 
      name: m.name, kana: m.kana, menu: menuName, price: price, status: 'done'
    }]);

    // 予約リストのメンバーステータス更新
    const updatedMembers = allMembersInTask.map(member => 
      member.name === m.name ? { ...member, status: 'done' } : member
    );
    setBookingList(prev => prev.map(b => 
      b.id === currentBooking.id ? { ...b, members: updatedMembers } : b
    ));

    if (colorNum) updateUserNotes(m.name, activeFacility, colorNum); 

    setShowMenu(null); setShowColorPicker(null);
  };

  // 🌟【並び替え：今月の履歴で完了判定】
  const sortedDisplayMembers = [...allMembersInTask].sort((a, b) => {
    const isDoneA = historyList.some(h => h.name === a.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash));
    const isDoneB = historyList.some(h => h.name === b.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash));
    
    const statusA = isDoneA ? 'done' : (a.status || 'yet');
    const statusB = isDoneB ? 'done' : (b.status || 'yet');
    
    const weight = { 'yet': 0, 'done': 1, 'cancel': 1 };
    if (weight[statusA] !== weight[statusB]) return weight[statusA] - weight[statusB];
    
    if (sortBy === "room") return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
    return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
  });

  // 当日追加
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
      {/* 固定ヘッダー */}
      <div style={fixedHeaderWrapperStyle}>
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          {facilities.length > 1 && (
            <div style={tabContainerStyle}>
              {facilities.map(f => (
                <button key={f} onClick={() => setActiveFacility(f)} 
                  style={{...miniFacilityTab, backgroundColor: activeFacility===f?'#1e3a8a':'#e2e8f0', color: activeFacility===f?'white':'#64748b'}}>
                  {f}
                </button>
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
          {allMembersInTask.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedDisplayMembers.map((m, idx) => {
                // 🌟【修正：今月の履歴を探す】
                const hist = historyList.find(h => h.name === m.name && h.facility === activeFacility && h.date.startsWith(monthKeySlash));
                const isDone = !!hist;
                const isCancel = m.status === 'cancel';
                
                return (
                  <div key={idx} onClick={() => (isDone || isCancel) ? setShowReset(m) : setShowMenu(m)}
                    style={{ 
                      ...memberRowStyle, 
                      backgroundColor: isCancel ? '#fee2e2' : (isDone ? '#f1f5f9' : 'white'), 
                      borderColor: isCancel ? '#ef4444' : (isDone ? '#cbd5e1' : (m.isExtra ? '#3b82f6' : '#e2e8f0')), 
                      opacity: (isDone || isCancel) ? 0.8 : 1 
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <span style={roomNumSimpleStyle}>{m.room}</span>
                      <div style={{ marginLeft: '12px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '18px', color: (isDone||isCancel)?'#94a3b8':'#1e293b' }}>
                          {m.name} 様 {isCancel && "(キャンセル)"}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {(m.menus || ["カット"]).join(' / ')} {m.isExtra && "★当日"}
                        </div>
                        {/* 🌟 過去日の施術済ラベルを表示 */}
                        {isDone && (
                          <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginTop: '2px' }}>
                            ✨ {hist.date !== todaySlash ? `${hist.date.split('/')[2]}日に ` : ''}施術済み
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(!isDone && !isCancel) ? ( 
                        <button onClick={(e) => {e.stopPropagation(); setShowCancelConfirm(m)}} style={cancelBtnStyle}>キャンセル</button>
                      ) : ( 
                        <span style={{fontSize:'12px', fontWeight:'bold', color: isCancel?'#ef4444':'#64748b'}}>{isCancel ? '取消済' : '完了済'}</span> 
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{textAlign:'center', padding:'40px', color:'#94a3b8'}}><div style={{fontSize:'40px', marginBottom:'10px'}}>📅</div>本日予定されている<br/>訪問予約はありません</div>
          )}

          <div style={{ marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {isFinishedAll && ( 
              <button ref={finishButtonRef} onClick={() => setPage('task-confirm')} style={finishBtnStyle}>
                お仕事お疲れさました！ ♡
              </button> 
            )}
            <button onClick={handleFinalSave} style={pauseBtnStyle}>今日はここまで (保存して戻る)</button>
          </div>
        </div>
      </Layout>

      <button className="floating-back-btn" onClick={handleFinalSave} style={{ position:'fixed', zIndex: 10001, bottom: '20px', left: '20px', width:'50px', height:'50px', borderRadius:'25px', backgroundColor:'#1e3a8a', color:'white', border:'none', fontSize:'24px', cursor:'pointer' }}>←</button>
      {saveMessage && ( <div style={toastStyle}>{saveMessage}</div> )}

      {/* キャンセル確認 */}
      {showCancelConfirm && (
        <div style={overlayStyle} onClick={() => setShowCancelConfirm(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showCancelConfirm.name} 様</div>
            <div style={{fontSize: '15px', color: '#64748b', margin: '10px 0 20px'}}>
              予約をキャンセル（欠席）扱いに<br/>しますか？
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <button onClick={() => executeCancelMember(showCancelConfirm.name)} 
                style={{...bigBtnStyle, backgroundColor: '#ef4444'}}>はい、キャンセルします</button>
              <button onClick={() => setShowCancelConfirm(null)} 
                style={{...bigBtnStyle, backgroundColor: '#64748b'}}>いいえ、戻ります</button>
            </div>
          </div>
        </div>
      )}

      {/* 未完了に戻す */}
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

      {/* メニュー選択 */}
      {showMenu && (
        <div style={overlayStyle} onClick={() => setShowMenu(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showMenu.name} 様</div>
            <div style={{marginTop: '20px', display:'flex', flexDirection:'column', gap:'10px'}}>
              {getMenuOptions(showMenu).map(opt => (
                <button key={opt} onClick={() => {
                    if (opt.includes("カラー")) {
                      setShowColorPicker({ member: showMenu, menu: opt });
                      setShowMenu(null);
                    } else {
                      completeTask(showMenu, opt);
                    }
                  }} 
                  style={{...bigBtnStyle, backgroundColor: '#10b981'}}>{opt.includes('（') ? opt : `✅ ${opt} 完了`}</button>
              ))}
              <button onClick={() => setShowMenu(null)} style={{...bigBtnStyle, backgroundColor: '#64748b'}}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 薬剤カラー選択 */}
      {showColorPicker && (
        <div style={overlayStyle} onClick={() => setShowColorPicker(null)}>
          <div style={menuBoxStyle} onClick={e => e.stopPropagation()}>
            <div style={modalNameStyle}>{showColorPicker.member.name} 様</div>
            <div style={{fontSize: '13px', color: '#64748b', marginBottom: '15px'}}>{showColorPicker.menu} の薬剤を選択</div>
            
            <div style={{textAlign:'left', maxHeight:'40vh', overflowY:'auto', padding:'5px'}}>
              <div style={{marginBottom:'15px'}}>
                <div style={{fontSize:'12px', fontWeight:'bold', color:'#2d6a4f', marginBottom:'8px'}}>【オリーブカーキー】</div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                  {colorList.filter(c => c.includes('OK')).map(color => (
                    <button key={color} onClick={() => completeTask(showColorPicker.member, showColorPicker.menu, color)}
                      style={{...miniSortBtnStyle, padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>{color}</button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:'15px'}}>
                <div style={{fontSize:'12px', fontWeight:'bold', color:'#4b2c5e', marginBottom:'8px'}}>【プルーンアッシュ】</div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'}}>
                  {colorList.filter(c => c.includes('PA')).map(color => (
                    <button key={color} onClick={() => completeTask(showColorPicker.member, showColorPicker.menu, color)}
                      style={{...miniSortBtnStyle, padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none'}}>{color}</button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => { setShowColorPicker(null); setShowMenu(showColorPicker.member); }} style={{...bigBtnStyle, backgroundColor: '#64748b', marginTop: '15px'}}>戻る</button>
          </div>
        </div>
      )}

      {/* 当日追加ポップアップ */}
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
              {users
                .filter(u => u.facility === activeFacility && !allMembersInTask.some(am => am.name === u.name))
                .sort((a, b) => {
                  if (addListSortKey === 'room') return String(a.room).localeCompare(String(b.room), undefined, { numeric: true });
                  return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
                })
                .map((u, i) => (
                  <div key={i} onClick={() => handleAddExtra(u)} style={addListRowStyle}>
                    <span style={{fontWeight:'bold'}}>{u.room} {u.name} 様</span><span style={plusIconStyle}>＋</span>
                  </div>
                ))}
            </div>
            <button onClick={() => setShowAddList(false)} style={closeBtnStyle}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 デザイン定数（省略なし）
const toastStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(30, 58, 138, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '50px', zIndex: 20000, fontWeight: 'bold', fontSize: '17px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', pointerEvents: 'none', animation: 'fadeInOut 1.2s ease-in-out' };
const fixedHeaderWrapperStyle = { position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '1000px', backgroundColor: '#f0f7f4', zIndex: 1000, padding: '8px 15px', boxSizing: 'border-box', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const statusRowStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginBottom: '8px', padding: '4px 0' };
const facilityNameBadge = { backgroundColor: '#ff8d02ff', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' };
const progressTextStyle = { fontSize: '16px', color: '#000000ff', fontWeight: 'bold', alignSelf: 'flex-end', textAlign: 'right' };
const tabContainerStyle = {display:'flex', gap:'5px', marginBottom:'6px', overflowX:'auto'};
const miniFacilityTab = { padding: '4px 10px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };
const sortBtnSmall = { flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid #1e3a8a', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };
const addTopBtnStyle = { flex: 1.2, padding: '8px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor:'pointer' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px', border: '2px solid transparent', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', padding: '10px 15px' };
const roomNumSimpleStyle = { fontSize: '16px', fontWeight: 'bold', color: '#64748b', minWidth: '30px' };
const cancelBtnStyle = { padding: '6px 12px', backgroundColor: '#fff', color: '#ef4444', border: '1.5px solid #ef4444', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor:'pointer' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10002 };
const menuBoxStyle = { backgroundColor: 'white', width: '85%', maxWidth: '400px', borderRadius: '24px', padding: '20px', textAlign: 'center' };
const modalNameStyle = { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' };
const bigBtnStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: 'none', color: 'white', fontSize: '15px', fontWeight: 'bold', cursor:'pointer' };
const largeListPopupStyle = { backgroundColor: 'white', width: '90%', height: '80vh', maxWidth: '500px', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding:'15px' };
const modalHeaderStyle = { paddingBottom: '10px', borderBottom: '1px solid #eee', textAlign: 'center' };
const scrollListAreaStyle = { flex: 1, overflowY: 'auto', padding: '10px 0' };
const addListRowStyle = { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', cursor:'pointer' };
const plusIconStyle = { backgroundColor: '#3b82f6', color: 'white', width: '24px', height: '24px', borderRadius: '12px', textAlign: 'center', lineHeight: '24px', fontWeight: 'bold' };
const closeBtnStyle = { padding: '12px', backgroundColor: '#f8fafc', border: 'none', fontWeight: 'bold', cursor:'pointer' };
const finishBtnStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', backgroundColor: '#ff85a2', color: 'white', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer' };
const pauseBtnStyle = { width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #1e3a8a', backgroundColor: 'white', color: '#1e3a8a', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };
const miniSortBtnStyle = { flex: 1, padding: '6px', borderRadius: '8px', border: '1px solid #1e3a8a', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' };