import React, { useState, useEffect } from 'react';
import FacilityKeepDate_PC from './FacilityKeepDate_PC';
import FacilityUserList_PC from './FacilityUserList_PC';
import FacilityConfirmBooking_PC from './FacilityConfirmBooking_PC';
import FacilityTimeSelection_PC from './FacilityTimeSelection_PC';
import FacilityFinalPreview_PC from './FacilityFinalPreview_PC';
import FacilityThanks_PC from './FacilityThanks_PC';
import FacilityScheduleManager_PC from './FacilityScheduleManager_PC'; 
import FacilityVisitHistory_PC from './FacilityVisitHistory_PC';
import FacilityInvoice_PC from './FacilityInvoice_PC'; 
import PrintUserList_PC from './PrintUserList_PC';
import Manual_PC from './Manual_PC'; 

export default function FacilityMenu_PC({ 
  user, page, setPage, users, bookingList, historyList, keepDates, 
  ngDates, refreshAllData, selectedMembers, setSelectedMembers, 
  scheduleTimes, setScheduleTimes, finalizeBooking, checkDateSelectable,
  handleLogout // 🌟 App.jsx から渡されるログアウト関数
}) {
  // --- ロジック保持：初期タブ判定 ---
  const [activeTab, setActiveTab] = useState(() => {
    if (['confirm', 'timeselect', 'preview', 'thanks'].includes(page)) {
      return 'confirm';
    }
    if (page === 'schedule') return 'schedule-manager';
    if (page === 'print-userlist') return 'print-userlist';
    if (page === 'manual') return 'manual'; 
    return page === 'menu' ? 'user-list' : page;
  });

  // --- ロジック保持：同期処理 ---
  useEffect(() => {
    if (['confirm', 'timeselect', 'preview', 'thanks'].includes(page)) {
      setActiveTab('confirm');
    } else if (page === 'schedule') {
      setActiveTab('schedule-manager');
    } else if (page === 'print-userlist') {
      setActiveTab('print-userlist');
    } else if (page === 'manual') {
      setActiveTab('manual');
    } else if (page !== 'menu') {
      setActiveTab(page);
    }
  }, [page]);

  const menuPrices = {
    'カット': 1600, 'カラー（リタッチ）': 4600, 'カラー（全体）': 5600, 'パーマ': 4600,
    'カット＋カラー（リタッチ）': 6100, 'カット＋カラー（全体）': 7100, 'カット＋パーマ': 6100,
    'カット＋カラー（リタッチ）＋パーマ': 11600, 'カット＋カラー（全体）＋パーマ': 11600, 'カラー': 5600
  };

  return (
    <div style={pcLayoutStyle}>
      {/* --- 左側：施設専用サイドバー --- */}
      <aside style={sidebarStyle}>
        <div style={sidebarHeader}>
          <h2 style={brandTitleStyle}>SnipSnap</h2>
          <div style={subTitleStyle}>FOR FACILITY</div>
          <div style={userBadgeStyle}>
             <span style={{opacity: 0.7, fontSize: '12px'}}>Welcome,</span><br/>
             <span style={{fontSize: '18px', fontWeight: '900'}}>{user?.name} 様</span>
          </div>
        </div>
        
        <nav style={navStyle}>
          {/* 1. 👥 あつまれ綺麗にする人 */}
          <button 
            onClick={() => { setActiveTab('user-list'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'user-list' ? '#d4a017' : 'transparent', color: activeTab === 'user-list' ? '#fff' : '#e0d6cc'}}
          >
            👥 あつまれ綺麗にする人
          </button>

          {/* 2. 📅 キープ！この日とった！ */}
          <button 
            onClick={() => { setActiveTab('calendar'); setPage('menu'); }} 
            style={{...navBtnStyle, backgroundColor: activeTab === 'calendar' ? '#d4a017' : 'transparent', color: activeTab === 'calendar' ? '#fff' : '#e0d6cc'}}
          >
            📅 キープ！この日とった！
          </button>

          {/* 3. ✅ これで決まり！予約確定！ */}
          <button 
            onClick={() => { setActiveTab('confirm'); setPage('confirm'); }} 
            style={{...navBtnStyle, backgroundColor: activeTab === 'confirm' ? '#2d6a4f' : 'transparent', border: activeTab === 'confirm' ? '2px solid #52b69a' : '2px solid transparent', color: '#fff'}}
          >
            ✅ これで決まり！予約確定！
          </button>

          {/* 4. 🖨️ 掲示用名簿をプリント（並び順変更） */}
          <button 
            onClick={() => { setActiveTab('print-userlist'); setPage('print-userlist'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'print-userlist' ? '#d4a017' : 'transparent', color: activeTab === 'print-userlist' ? '#fff' : '#e0d6cc'}}
          >
            🖨️ 掲示用名簿をプリント
          </button>

          {/* 5. 📊 予約の状況・進捗（並び順変更） */}
          <button 
            onClick={() => { setActiveTab('schedule-manager'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'schedule-manager' ? '#d4a017' : 'transparent', color: activeTab === 'schedule-manager' ? '#fff' : '#e0d6cc'}}
          >
            📊 予約の状況・進捗
          </button>

          {/* 6. 📜 過去の訪問記録 */}
          <button 
            onClick={() => { setActiveTab('history'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'history' ? '#d4a017' : 'transparent', color: activeTab === 'history' ? '#fff' : '#e0d6cc'}}
          >
            📜 過去の訪問記録
          </button>

          {/* 7. 📑 請求・利用明細 */}
          <button 
            onClick={() => { setActiveTab('invoice'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'invoice' ? '#d4a017' : 'transparent', color: activeTab === 'invoice' ? '#fff' : '#e0d6cc'}}
          >
            📑 請求・利用明細
          </button>

          {/* --- 下部アクションエリア --- */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => { setActiveTab('manual'); setPage('manual'); }}
              style={{...navBtnStyle, backgroundColor: activeTab === 'manual' ? '#ed8936' : 'rgba(255,255,255,0.05)', color: '#fff', textAlign: 'center', fontSize: '15px'}}
            >
              💡 使い方ガイド
            </button>

            <button 
              onClick={() => { if(window.confirm('ログアウトしてログイン画面に戻りますか？')) handleLogout(); }}
              style={{...navBtnStyle, backgroundColor: 'transparent', color: '#fca5a5', border: '1px solid rgba(252,165,165,0.3)', textAlign: 'center', fontSize: '15px'}}
            >
              🚪 ログアウト
            </button>
          </div>
        </nav>
      </aside>

      {/* --- 右側：メインコンテンツ --- */}
      <main style={mainContentStyle}>
        {activeTab === 'user-list' && (
          <FacilityUserList_PC users={users} facilityName={user.name} refreshAllData={refreshAllData} />
        )}

        {activeTab === 'calendar' && (
          <FacilityKeepDate_PC user={user} keepDates={keepDates} bookingList={bookingList} ngDates={ngDates} setPage={setPage} refreshAllData={refreshAllData} checkDateSelectable={checkDateSelectable} />
        )}

        {(activeTab === 'schedule-manager' || page === 'schedule') && (
          <FacilityScheduleManager_PC keepDates={keepDates} bookingList={bookingList} historyList={historyList} user={user} />
        )}

        {activeTab === 'print-userlist' && (
          <PrintUserList_PC users={users} historyList={historyList} keepDates={keepDates} facilityName={user.name} setPage={setPage} />
        )}

        {activeTab === 'manual' && (
          <Manual_PC />
        )}

        {activeTab === 'confirm' && (
          <>
            {page === 'confirm' && (
              <FacilityConfirmBooking_PC 
                keepDates={keepDates.filter(kd => {
                  const dateStr = typeof kd === 'string' ? kd : kd?.date;
                  const facilityName = typeof kd === 'string' ? user?.name : kd?.facility;
                  return facilityName === user?.name;
                })} 
                users={users} 
                selectedMembers={selectedMembers} 
                setSelectedMembers={setSelectedMembers} 
                setPage={setPage} 
                menuPrices={menuPrices} 
                historyList={historyList} 
                user={user} 
              />
            )}
            {page === 'timeselect' && (
               <FacilityTimeSelection_PC 
                 keepDates={keepDates.filter(kd => {
                    const dateStr = typeof kd === 'string' ? kd : kd?.date;
                    const facilityName = typeof kd === 'string' ? user?.name : kd?.facility;
                    return facilityName === user?.name;
                 })} 
                 scheduleTimes={scheduleTimes} 
                 setScheduleTimes={setScheduleTimes} 
                 setPage={setPage} 
                 user={user} 
               />
            )}
            {page === 'preview' && (
              <FacilityFinalPreview_PC 
                user={user} 
                keepDates={keepDates.filter(kd => {
                  const dateStr = typeof kd === 'string' ? kd : kd?.date;
                  const facilityName = typeof kd === 'string' ? user?.name : kd?.facility;
                  return facilityName === user?.name;
                })} 
                selectedMembers={selectedMembers} 
                scheduleTimes={scheduleTimes} 
                setPage={setPage} 
                finalizeBooking={finalizeBooking} 
              />
            )}
            {page === 'thanks' && (
              <FacilityThanks_PC user={user} setPage={setPage} />
            )}
          </>
        )}

        {activeTab === 'invoice' && (
          <FacilityInvoice_PC historyList={historyList} bookingList={bookingList} user={user} />
        )}

        {activeTab === 'history' && (
          <FacilityVisitHistory_PC historyList={historyList} bookingList={bookingList} user={user} />
        )}
      </main>
    </div>
  );
}

// 🎨 スタイル設定（変更なし：アンティーク維持）
const pcLayoutStyle = { display: 'flex', height: '100vh', width: '100%', backgroundColor: '#f9f7f5', overflow: 'hidden', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const sidebarStyle = { width: '300px', minWidth: '300px', backgroundColor: '#2d1e14', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.2)', zIndex: 100 };
const sidebarHeader = { padding: '40px 25px', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' };
const brandTitleStyle = { margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '0.1em', color: '#d4a017' };
const subTitleStyle = { fontSize: '10px', letterSpacing: '0.3em', marginTop: '5px', opacity: 0.6, fontWeight: 'bold' };
const userBadgeStyle = { marginTop: '25px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '15px', border: '1px solid rgba(212, 160, 23, 0.2)' };
const navStyle = { flex: 1, padding: '30px 15px', display: 'flex', flexDirection: 'column', gap: '12px' };
const navBtnStyle = { width: '100%', padding: '18px 20px', border: 'none', textAlign: 'left', borderRadius: '15px', cursor: 'pointer', fontSize: '16px', fontWeight: '800', transition: '0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' };
const mainContentStyle = { flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' };