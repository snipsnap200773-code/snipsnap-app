import React, { useState, useEffect } from 'react';
import FacilityKeepDate_PC from './FacilityKeepDate_PC';
import FacilityUserList_PC from './FacilityUserList_PC';
import FacilityConfirmBooking_PC from './FacilityConfirmBooking_PC';
import FacilityTimeSelection_PC from './FacilityTimeSelection_PC';
import FacilityFinalPreview_PC from './FacilityFinalPreview_PC';
import FacilityThanks_PC from './FacilityThanks_PC';
import FacilityScheduleManager_PC from './FacilityScheduleManager_PC'; 
import FacilityVisitHistory_PC from './FacilityVisitHistory_PC';

export default function FacilityMenu_PC({ 
  user, page, setPage, users, bookingList, historyList, keepDates, 
  ngDates, refreshAllData, selectedMembers, setSelectedMembers, 
  scheduleTimes, setScheduleTimes, finalizeBooking, checkDateSelectable    
}) {
  // 初期タブ判定
  const [activeTab, setActiveTab] = useState(() => {
    if (['confirm', 'timeselect', 'preview', 'thanks'].includes(page)) {
      return 'confirm';
    }
    return page === 'menu' ? 'user-list' : page;
  });

  // App.jsx側のページ変更とサイドバーを同期
  useEffect(() => {
    if (['confirm', 'timeselect', 'preview', 'thanks'].includes(page)) {
      setActiveTab('confirm');
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
          <h2 style={{margin: 0, fontSize: '18px'}}>SnipSnap <span style={{fontSize:'12px'}}>施設様用</span></h2>
          <p style={{fontSize: '12px', opacity: 0.8, marginTop: '5px'}}>{user?.name} 御中</p>
        </div>
        
        <nav style={navStyle}>
          {/* 1. 名簿管理 */}
          <button 
            onClick={() => { setActiveTab('user-list'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'user-list' ? 'rgba(255,255,255,0.2)' : 'transparent'}}
          >
            👥 あつまれ綺麗にする人
          </button>

          {/* 2. カレンダー予約（キープ） */}
          <button 
            onClick={() => { setActiveTab('calendar'); setPage('menu'); }} 
            style={{...navBtnStyle, backgroundColor: activeTab === 'calendar' ? 'rgba(255,255,255,0.2)' : 'transparent'}}
          >
            📅 キープ！この日とった！
          </button>

          {/* 3. 予約確定 */}
          <button 
            onClick={() => { setActiveTab('confirm'); setPage('confirm'); }} 
            style={{...navBtnStyle, backgroundColor: activeTab === 'confirm' ? '#2d6a4f' : 'transparent'}}
          >
            ✅ これで決まり！予約確定！
          </button>

          {/* 4. 予約状況・進捗 */}
          <button 
            onClick={() => { setActiveTab('schedule-manager'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'schedule-manager' ? 'rgba(255,255,255,0.2)' : 'transparent'}}
          >
            📊 予約の状況・進捗
          </button>

          {/* 5. 過去実績 */}
          <button 
            onClick={() => { setActiveTab('history'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'history' ? 'rgba(255,255,255,0.2)' : 'transparent'}}
          >
            📜 過去の訪問実績
          </button>

          {/* 6. 請求明細（一番下） */}
          <button 
            onClick={() => { setActiveTab('invoice'); setPage('menu'); }}
            style={{...navBtnStyle, backgroundColor: activeTab === 'invoice' ? 'rgba(255,255,255,0.2)' : 'transparent'}}
          >
            📑 請求・利用明細
          </button>
        </nav>

        {/* 🌟 サイドバー下部の「モバイル版へ戻る」ボタンエリアを削除 */}
      </aside>

      {/* --- 右側：メインコンテンツ --- */}
      <main style={mainContentStyle}>
        {activeTab === 'user-list' && (
          <FacilityUserList_PC users={users} facilityName={user.name} refreshAllData={refreshAllData} />
        )}

        {activeTab === 'calendar' && (
          <FacilityKeepDate_PC user={user} keepDates={keepDates} bookingList={bookingList} ngDates={ngDates} setPage={setPage} refreshAllData={refreshAllData} checkDateSelectable={checkDateSelectable} />
        )}

        {activeTab === 'schedule-manager' && (
          <FacilityScheduleManager_PC keepDates={keepDates} bookingList={bookingList} historyList={historyList} user={user} />
        )}

        {activeTab === 'confirm' && (
          <>
            {page === 'confirm' && (
              <FacilityConfirmBooking_PC keepDates={keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date)} users={users} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} setPage={setPage} menuPrices={menuPrices} historyList={historyList} user={user} />
            )}
            {page === 'timeselect' && (
               <FacilityTimeSelection_PC keepDates={keepDates} scheduleTimes={scheduleTimes} setScheduleTimes={setScheduleTimes} setPage={setPage} user={user} />
            )}
            {page === 'preview' && (
              <FacilityFinalPreview_PC keepDates={keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date)} selectedMembers={selectedMembers} scheduleTimes={scheduleTimes} setPage={setPage} finalizeBooking={finalizeBooking} />
            )}
            {page === 'thanks' && (
              <FacilityThanks_PC user={user} setPage={setPage} />
            )}
          </>
        )}

        {activeTab === 'invoice' && (
          <div style={placeholderCard}>
            <h3>📑 請求・利用明細</h3>
            <p>管理者から発行された請求・利用明細を確認できます。</p>
          </div>
        )}

        {activeTab === 'history' && (
          <FacilityVisitHistory_PC historyList={historyList} bookingList={bookingList} user={user} />
        )}
      </main>
    </div>
  );
}

// スタイル（変更なし）
const pcLayoutStyle = { display: 'flex', height: '100vh', width: '100%', backgroundColor: '#f0f4f8', overflow: 'hidden' };
const sidebarStyle = { width: '260px', minWidth: '260px', backgroundColor: '#2d3748', color: 'white', display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' };
const navStyle = { flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px' };
const navBtnStyle = { width: '100%', padding: '12px 15px', backgroundColor: 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', transition: '0.2s' };
const mainContentStyle = { flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' };
const placeholderCard = { backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center' };