import React, { useState } from 'react';
import AdminMasterUserList_PC from './AdminMasterUserList_PC';
import AdminHistory_PC from './AdminHistory_PC';
import InvoiceManager_PC from './InvoiceManager_PC';
import AdminDashboard_PC from './AdminDashboard_PC';
import AdminScheduleNG_PC from './AdminScheduleNG_PC'; // 🌟 追加（カレンダー×用）
import AdminScheduleManager_PC from './AdminScheduleManager_PC'; // 🌟 追加（進捗リスト用）
import AdminTodayList_PC from './AdminTodayList_PC';
import AdminFacilityList_PC from './AdminFacilityList_PC';
import TaskMode_PC from './TaskMode_PC';
import TaskConfirmMode_PC from './TaskConfirmMode_PC';

export default function AdminMenu_PC({ 
  setPage, 
  user, 
  users = [], 
  setUsers, 
  dbFacilities = [], 
  historyList = [], 
  bookingList = [],
  keepDates = [], // 🌟 追加
  setKeepDates, // 🌟 追加
  setBookingList, // 🌟 追加
  ngDates = [],
  setNgDates,
  checkDateSelectable, // 🌟 追加
  setActiveFacility, 
  activeFacility     
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getNavBtnStyle = (tabName) => ({
    ...navBtnStyle,
    backgroundColor: activeTab === tabName ? 'rgba(255,255,255,0.15)' : 'transparent',
    color: activeTab === tabName ? '#ffffff' : 'rgba(255,255,255,0.7)',
    borderLeft: activeTab === tabName ? '4px solid #3b82f6' : '4px solid transparent',
  });

  return (
    <div style={pcLayoutStyle}>
      {/* --- 左側：サイドバーメニュー --- */}
      <aside style={sidebarStyle}>
        <div style={sidebarHeader}>
          <h2 style={sidebarTitleStyle}>
            SnipSnap <span style={adminBadgeStyle}>PC ADMIN</span>
          </h2>
          <p style={userNameStyle}>{user?.name || '管理者'}さん、お疲れ様です</p>
        </div>
        
        <nav style={navStyle}>
          <div style={sectionLabelStyle}>全体把握</div>
          <button onClick={() => setActiveTab('dashboard')} style={getNavBtnStyle('dashboard')}>
            <span style={iconStyle}>📊</span> 売上状況
          </button>

          {/* 🌟 予約管理を2つの役割に分離 */}
          <div style={sectionLabelStyle}>スケジュール管理</div>
          <button onClick={() => setActiveTab('calendar-ng')} style={getNavBtnStyle('calendar-ng')}>
            <span style={iconStyle}>📅</span> 予約受付・NG設定
          </button>
          <button onClick={() => setActiveTab('schedule-manager')} style={getNavBtnStyle('schedule-manager')}>
            <span style={iconStyle}>📋</span> 予約進捗・一括管理
          </button>

          <div style={sectionLabelStyle}>現場・バックアップ</div>
          <button onClick={() => setActiveTab('task-input')} style={getNavBtnStyle('task-input')}>
            <span style={iconStyle}>✂️</span> 施術タスク入力
          </button>
          <button onClick={() => setActiveTab('print-list')} style={getNavBtnStyle('print-list')}>
            <span style={iconStyle}>🖨️</span> 当日リスト印刷
          </button>

          <div style={sectionLabelStyle}>事務・マスター管理</div>
          <button onClick={() => setActiveTab('invoice')} style={getNavBtnStyle('invoice')}>
            <span style={iconStyle}>📑</span> 請求書発行
          </button>
          <button onClick={() => setActiveTab('history')} style={getNavBtnStyle('history')}>
            <span style={iconStyle}>📜</span> 過去履歴
          </button>
          <button onClick={() => setActiveTab('user-manager')} style={getNavBtnStyle('user-manager')}>
            <span style={iconStyle}>👥</span> 利用者名簿
          </button>
          <button onClick={() => setActiveTab('facility-manager')} style={getNavBtnStyle('facility-manager')}>
            <span style={iconStyle}>🏢</span> 施設名簿
          </button>
        </nav>

        <div style={sidebarFooter}>
          <button onClick={() => setPage('menu')} style={backBtnStyle}>← モバイル画面へ戻る</button>
        </div>
      </aside>

      {/* --- 右側：メインコンテンツ --- */}
      <main style={mainContentStyle}>
        <div style={contentInnerStyle}>
          {activeTab === 'dashboard' && (
            <AdminDashboard_PC historyList={historyList} dbFacilities={dbFacilities} users={users} />
          )}

          {/* 🌟 カレンダー形式（休み×をつける） */}
          {activeTab === 'calendar-ng' && (
            <AdminScheduleNG_PC 
              bookingList={bookingList} 
              ngDates={ngDates} 
              setNgDates={setNgDates} 
              keepDates={keepDates} 
              historyList={historyList}
              checkDateSelectable={checkDateSelectable}
            />
          )}

          {/* 🌟 リスト形式（進捗確認・一括終了処理） */}
          {activeTab === 'schedule-manager' && (
            <AdminScheduleManager_PC 
              bookingList={bookingList} 
              setBookingList={setBookingList}
              keepDates={keepDates} 
              setKeepDates={setKeepDates}
              historyList={historyList} 
              allUsers={users}
            />
          )}

          {activeTab === 'task-input' && (
            <TaskMode_PC bookingList={bookingList} setPage={setPage} setActiveFacility={setActiveFacility} activeFacility={activeFacility} />
          )}

          {activeTab === 'print-list' && (
            <AdminTodayList_PC bookingList={bookingList} dbFacilities={dbFacilities} users={users} />
          )}

          {activeTab === 'invoice' && (
            <InvoiceManager_PC historyList={historyList} dbFacilities={dbFacilities} />
          )}

          {activeTab === 'history' && (
            <AdminHistory_PC historyList={historyList} bookingList={bookingList} />
          )}

          {activeTab === 'user-manager' && (
            <AdminMasterUserList_PC users={users} setUsers={setUsers} facilityMaster={dbFacilities} historyList={historyList} />
          )}

          {activeTab === 'facility-manager' && (
            <AdminFacilityList_PC dbFacilities={dbFacilities} />
          )}

          {activeTab === 'task-confirm-view' && (
            <TaskConfirmMode_PC activeFacility={activeFacility} setPage={() => setActiveTab('task-input')} />
          )}
        </div>
      </main>
    </div>
  );
}

// --- スタイル定義 (変更なし) ---
const pcLayoutStyle = { display: 'flex', height: '100vh', width: '100%', backgroundColor: '#f1f5f9', overflow: 'hidden' };
const sidebarStyle = { width: '280px', minWidth: '280px', backgroundColor: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', zIndex: 10 };
const sidebarHeader = { padding: '40px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' };
const sidebarTitleStyle = { margin: 0, fontSize: '22px', letterSpacing: '1px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const adminBadgeStyle = { fontSize: '10px', fontWeight: 'normal', padding: '2px 6px', backgroundColor: '#3b82f6', borderRadius: '4px', marginLeft: '8px' };
const userNameStyle = { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '12px' };
const sectionLabelStyle = { padding: '24px 24px 8px 20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' };
const navStyle = { flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column', overflowY: 'auto' };
const navBtnStyle = { width: '100%', padding: '14px 24px', backgroundColor: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s ease', fontWeight: '500', display: 'flex', alignItems: 'center', outline: 'none' };
const iconStyle = { marginRight: '12px', fontSize: '18px' };
const sidebarFooter = { padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' };
const backBtnStyle = { width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' };
const mainContentStyle = { flex: 1, overflowY: 'auto', height: '100vh', boxSizing: 'border-box', position: 'relative' };
const contentInnerStyle = { padding: '40px min(5vw, 60px)', maxWidth: '1600px', margin: '0 auto' };