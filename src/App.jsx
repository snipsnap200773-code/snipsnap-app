import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Menu from './Menu';
import ListPage from './UserList';
import KeepDate from './KeepDate';
import ConfirmBooking from './ConfirmBooking';
import TimeSelection from './TimeSelection';
import FinalPreview from './FinalPreview';
import ThanksPage from './ThanksPage';
import ScheduleManager from './ScheduleManager';
import AdminScheduleManager from './AdminScheduleManager';
import VisitHistory from './VisitHistory';

// 🌟 移動したメニューを新しい住所（パス）からインポート
import AdminMenu from './pages/mobile/AdminMenu';
import AdminMenu_PC from './pages/pc/AdminMenu_PC';
import FacilityMenu_PC from './pages/pc/FacilityMenu_PC';

import TaskMode from './TaskMode';
import TaskConfirmMode from './TaskConfirmMode';
import ScheduleNG from './ScheduleNG';
import AdminHistory from './AdminHistory';
import InvoiceManager from './InvoiceManager';
import FacilityInfo from './FacilityInfo';
import AdminFacilityList from './AdminFacilityList';
import AdminMasterUserList from './AdminMasterUserList';
import AdminDashboard from './AdminDashboard';
import PrintUserList from './PrintUserList'; 
import FacilityInvoice from './FacilityInvoice'; 
import AdminTodayList from './AdminTodayList';

import { supabase } from './supabase';

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('menu');
  const [users, setUsers] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [manualKeepDates, setManualKeepDates] = useState([]); 
  const [bookingList, setBookingList] = useState([]);
  const [ngDates, setNgDates] = useState([]); 
  const [scheduleTimes, setScheduleTimes] = useState({}); 
  const [selectedMembers, setSelectedMembers] = useState([]); 
  const [activeFacility, setActiveFacility] = useState("");
  const [dbFacilities, setDbFacilities] = useState([]);

  // 💻 PCかスマホかを判定するState
  const [isPC, setIsPC] = useState(window.innerWidth > 1024);

  // 🌟【修正箇所1】リサイズ時はPC判定の更新のみを行い、setPageを絶対に実行しない
  // これによりブラウザを広げたり狭めたりしても「今のページ」が維持されます
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsPC(prev => {
        const next = width > 1024;
        if (prev !== next) return next;
        return prev;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const regularRules = [
    { facility: 'マリアの丘', day: 3, week: -1, time: '13:00' },
    { facility: 'マリアの丘', day: 4, week: -1, time: '13:00' },
    { facility: 'マリアの丘', day: 3, week: -2, time: '13:00' },
    { facility: 'マリアの丘', day: 4, week: -2, time: '13:00' },
    { facility: 'もえぎ野の杜', day: 0, week: 2, time: '09:00' },
    { facility: 'もえぎ野の杜', day: 0, week: 3, time: '09:00' },
  ];

  const colorList = ['６-OK', '７-OK', '８-OK', '９-OK', '６-PA', '７-PA', '８-PA', '９-PA'];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secretCode = params.get('admin');

    if (secretCode === 'dmaaaahkmm0216') {
      const adminUser = { role: 'barber', name: '三土手さん' };
      localStorage.setItem('saved_user', JSON.stringify(adminUser));
      setUser(adminUser);
      setPage('admin-top');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const saved = localStorage.getItem('saved_user');
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        setPage(parsedUser.role === 'barber' ? 'admin-top' : 'menu');
      } catch (e) {
        localStorage.removeItem('saved_user');
      }
    }
  }, []);

  const refreshAllData = async () => {
    const { data: mData } = await supabase.from('members').select('*');
    if (mData) setUsers(mData);
    const { data: hData } = await supabase.from('history').select('*');
    if (hData) setHistoryList(hData);
    const { data: bData } = await supabase.from('bookings').select('*');
    if (bData) setBookingList(bData);
    const { data: kData } = await supabase.from('keep_dates').select('*');
    if (kData) setManualKeepDates(kData);
    const { data: nData } = await supabase.from('ng_dates').select('*');
    if (nData) setNgDates(nData.map(d => d.date));
    const { data: fData } = await supabase.from('facilities').select('*');
    if (fData) setDbFacilities(fData);
  };

  // 🌟【修正箇所2】依存配列から page を削除し、user（ログイン）の変更時のみに絞る
  // これにより操作中にデータが勝手に読み直されて、入力中のStateが消えるのを防ぎます
  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  const setHistoryListWithSync = async (updateArg) => {
    const newList = typeof updateArg === 'function' ? updateArg(historyList) : updateArg;
    setHistoryList(newList);
    if (newList.length > 0) {
      const dataToSync = newList.map(({ id, created_at, ...rest }) => rest);
      await supabase.from('history').upsert(dataToSync, { onConflict: 'date,facility,name' });
    }
  };

  const setBookingListWithSync = async (updateArg) => {
    const newList = typeof updateArg === 'function' ? updateArg(bookingList) : updateArg;
    setBookingList(newList);
    if (newList.length > 0) {
      const formattedBookings = newList.map(b => ({
        ...b,
        id: `${b.facility}-${b.date}`.replace(/\//g, '-')
      }));
      await supabase.from('bookings').upsert(formattedBookings);
    }
  };

  const setManualKeepDatesWithSync = (updateArg) => {
    setManualKeepDates(prev => (typeof updateArg === 'function' ? updateArg(prev) : updateArg));
  };

  const setNgDatesWithSync = (updateArg) => {
    setNgDates(prev => (typeof updateArg === 'function' ? updateArg(prev) : updateArg));
  };

  const getSystemKeepDates = () => {
    const dates = [];
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');
    for (let m = 0; m <= 12; m++) {
      const year = now.getFullYear();
      const month = now.getMonth() + m;
      regularRules.forEach(rule => {
        const lastDayOfMonth = new Date(year, month + 1, 0);
        let matchDate = null;
        if (rule.week > 0) {
          let count = 0;
          for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const d = new Date(year, month, i);
            if (d.getDay() === rule.day) {
              count++;
              if (count === rule.week) { matchDate = d; break; }
            }
          }
        } else {
          let count = 0;
          for (let i = lastDayOfMonth.getDate(); i >= 1; i--) {
            const d = new Date(year, month, i);
            if (d.getDay() === rule.day) {
              count--;
              if (count === rule.week) { matchDate = d; break; }
            }
          }
        }
        if (matchDate) {
          const dateStr = matchDate.toLocaleDateString('sv-SE');
          const isAlreadyConfirmed = bookingList.some(b => b.date === dateStr && b.facility === rule.facility);
          if (dateStr >= todayStr && !isAlreadyConfirmed) {
            dates.push({ date: dateStr, facility: rule.facility, isSystem: true, time: rule.time });
          }
        }
      });
    }
    return dates;
  };

  const systemKeepDates = getSystemKeepDates();
  const keepDates = [...manualKeepDates, ...systemKeepDates].filter((v, i, a) =>
    a.findIndex(t => t.date === v.date && t.facility === v.facility) === i
  );

  const menuPrices = {
    'カット': 1600, 'カラー（リタッチ）': 4600, 'カラー（全体）': 5600, 'パーマ': 4600,
    'カット＋カラー（リタッチ）': 6100, 'カット＋カラー（全体）': 7100, 'カット＋パーマ': 6100,
    'カット＋カラー（リタッチ）＋パーマ': 11600, 'カット＋カラー（全体）＋パーマ': 11600, 'カラー': 5600
  };

  const businessConfig = { startHour: 9, endHour: 14, interval: 30 };
  const checkDateSelectable = (dateStr) => true;

  const deleteUserFromMaster = async (id) => {
    await supabase.from('members').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const completeFacilityBooking = async (facilityName) => {
    const todayISO = new Date().toLocaleDateString('sv-SE');
    await supabase.from('bookings').delete().match({ facility: facilityName, date: todayISO });
    refreshAllData();
  };

  const updateUserNotes = async (userName, facilityName, newEntry) => {
    const targetUser = users.find(u => u.name === userName && u.facility === facilityName);
    if (!targetUser) return;
    const today = new Date().toLocaleDateString('ja-JP');
    const updatedNotes = `${today} ${newEntry}\n${targetUser.notes || ""}`;
    await supabase.from('members').update({ notes: updatedNotes }).eq('id', targetUser.id);
    refreshAllData();
  };

  const finalizeBooking = async () => {
    const myKeepDates = keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date);
    const sortedKeepDates = [...myKeepDates].sort();
    if (sortedKeepDates.length === 0) return;
    const activeMonth = sortedKeepDates[0].substring(0, 7);
    const datesToConfirm = myKeepDates.filter(d => d.startsWith(activeMonth));
    
    const newConfirmedEntries = datesToConfirm.map(date => {
      const sysKeep = systemKeepDates.find(sk => sk.date === date && sk.facility === user.name);
      return {
        date: date, 
        facility: user.name, 
        members: [...selectedMembers],
        time: scheduleTimes[date] || (sysKeep ? sysKeep.time : '9:00'), 
        status: 'confirmed',
        id: `${user.name}-${date}`.replace(/\//g, '-')
      };
    });

    const { error } = await supabase.from('bookings').upsert(newConfirmedEntries);
    if (!error) {
      for (const d of datesToConfirm) {
        await supabase.from('keep_dates').delete().match({ facility: user.name, date: d });
      }
      setSelectedMembers([]); 
      setPage('thanks');
    }
  };

  const handleLogin = async (id, pass) => {
    let loggedInUser = null;
    if (id === 'a' && pass === 'a') {
      loggedInUser = { role: 'barber', name: '三土手さん' };
    } else {
      const { data: facility, error } = await supabase.from('facilities').select('*').eq('id', id).eq('pw', pass).single();
      if (!error && facility) {
        loggedInUser = { 
          role: 'facility', 
          name: facility.name, 
          facilityId: facility.id, 
          details: facility 
        };
      }
    }
    if (loggedInUser) {
      localStorage.setItem('saved_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setPage(loggedInUser.role === 'barber' ? 'admin-top' : 'menu');
    } else {
      alert('IDまたはパスワードが正しくありません');
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('saved_user');
    setUser(null); 
    setPage('menu'); 
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const currentPageName = typeof page === 'string' ? page : page.name;

  return (
    <div id="root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <div style={{ 
        width: '100%', 
        // 🌟 PC時はmaxWidthを解除して全画面。スマホ時は1000pxに制限。
        maxWidth: isPC ? 'none' : '1000px', 
        display: 'flex', 
        flexDirection: 'column', 
        // 🌟 PC時は中央寄せではなく画面端まで伸ばす
        alignItems: isPC ? 'stretch' : 'center', 
        position: 'relative' 
      }}>
        {user.role === 'barber' && (
          isPC ? (
            <AdminMenu_PC 
              page={page} // 🌟 現在のページを渡す
              setPage={setPage} 
              setActiveFacility={setActiveFacility}
              activeFacility={activeFacility}
              dbFacilities={dbFacilities} 
              user={user} 
              users={users} 
              setUsers={setUsers}
              historyList={historyList}
              bookingList={bookingList}
              ngDates={ngDates}
              setNgDates={setNgDatesWithSync}
              // 🌟 PC版Adminでもリセットを防ぐために必要なProps
              keepDates={keepDates}
              setKeepDates={setManualKeepDatesWithSync}
              setBookingList={setBookingListWithSync}
              checkDateSelectable={checkDateSelectable}
            />
          ) : (
            <div className="mobile-view-container" style={{width:'100%'}}>
              {currentPageName === 'admin-top' && <AdminMenu setPage={setPage} setActiveFacility={setActiveFacility} dbFacilities={dbFacilities} user={user} />}
              {currentPageName === 'admin-ng' && <ScheduleNG keepDates={keepDates} bookingList={bookingList} ngDates={ngDates} setNgDates={setNgDates} setPage={setPage} checkDateSelectable={checkDateSelectable} />}
              {currentPageName === 'task' && <TaskMode bookingList={bookingList} historyList={historyList} setHistoryList={setHistoryListWithSync} setBookingList={setBookingListWithSync} setPage={setPage} users={users} activeFacility={activeFacility} setActiveFacility={setActiveFacility} menuPrices={menuPrices} colorList={colorList} updateUserNotes={updateUserNotes} />}
              {currentPageName === 'task-confirm' && <TaskConfirmMode historyList={historyList} bookingList={bookingList} setPage={setPage} facilityName={activeFacility} user={user} completeFacilityBooking={() => refreshAllData()} />}
              {currentPageName === 'admin-reserve' && <AdminScheduleManager keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} setBookingList={setBookingListWithSync} setPage={setPage} user={user} historyList={historyList} allUsers={users} selectedMembers={selectedMembers} />}
              {currentPageName === 'admin-facility-list' && <AdminFacilityList setPage={setPage} />}
              {currentPageName === 'master-user-list' && <AdminMasterUserList users={users} setUsers={setUsers} facilityMaster={dbFacilities} setPage={setPage} historyList={historyList} bookingList={bookingList} />}
              {currentPageName === 'dashboard' && <AdminDashboard historyList={historyList} bookingList={bookingList} setPage={setPage} />}
              {currentPageName === 'visit-log' && <VisitHistory setPage={setPage} historyList={historyList} bookingList={bookingList} user={user} />}
              {currentPageName === 'admin-history' && <AdminHistory setPage={setPage} historyList={historyList} bookingList={bookingList} />}
              {currentPageName === 'invoice' && <InvoiceManager setPage={setPage} historyList={historyList} />}
              {currentPageName === 'admin-print-today' && <AdminTodayList facilityName={activeFacility} bookingList={bookingList} users={users} setPage={setPage} />}
            </div>
          )
        )}

        {user.role === 'facility' && (
          isPC ? (
            /* 🌟 PC版：サイドバー（FacilityMenu_PC）を土台として常に固定表示 */
            <FacilityMenu_PC 
              user={user} 
              page={page}               
              setPage={setPage} 
              users={users.filter(u => u.facility === user.name)}
              bookingList={bookingList}
              historyList={historyList}
              keepDates={keepDates}      
              ngDates={ngDates}        
              refreshAllData={refreshAllData}
              selectedMembers={selectedMembers}   
              setSelectedMembers={setSelectedMembers} 
              scheduleTimes={scheduleTimes}       
              setScheduleTimes={setScheduleTimes} 
              finalizeBooking={finalizeBooking}
              checkDateSelectable={checkDateSelectable}
            />
          ) : (
            <div className="mobile-view-container" style={{width:'100%'}}>
              {/* 🌟 スマホ版：リサイズしてもページを維持するように出し分けを整理 */}
              {currentPageName === 'menu' && <Menu setPage={setPage} user={user} />}
              {currentPageName === 'list' && <ListPage users={users.filter(u => u.facility === user.name)} setUsers={async (updated) => { await supabase.from('members').upsert(updated); refreshAllData(); }} deleteUserFromMaster={deleteUserFromMaster} setPage={setPage} facilityName={user.name} />}
              {currentPageName === 'keep-date' && <KeepDate keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} ngDates={ngDates} setPage={setPage} checkDateSelectable={checkDateSelectable} user={user} />}
              {currentPageName === 'confirm' && <ConfirmBooking keepDates={keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date)} users={users.filter(u => u.facility === user.name)} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembers} setPage={setPage} menuPrices={{ 'カット': 1600, 'カラー': 5600, 'パーマ': 4600 }} />}
              {currentPageName === 'timeselect' && <TimeSelection keepDates={keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date)} scheduleTimes={scheduleTimes} setScheduleTimes={setScheduleTimes} setPage={setPage} config={businessConfig} />}
              {currentPageName === 'preview' && <FinalPreview keepDates={keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date)} selectedMembers={selectedMembers} scheduleTimes={scheduleTimes} setPage={setPage} finalizeBooking={finalizeBooking} />}
              {currentPageName === 'thanks' && <ThanksPage setPage={setPage} />}
              {currentPageName === 'schedule' && <ScheduleManager keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} setBookingList={setBookingListWithSync} setPage={setPage} user={user} historyList={historyList} completeFacilityBooking={completeFacilityBooking} users={users} />}
              {currentPageName === 'history' && <VisitHistory setPage={setPage} historyList={historyList} bookingList={bookingList} user={user} />}
              {currentPageName === 'info' && <FacilityInfo user={user} setPage={setPage} />}
              {currentPageName === 'print-list' && <PrintUserList users={users.filter(u => u.facility === user.name)} historyList={historyList} keepDates={keepDates} bookingList={bookingList} facilityName={user.name} setPage={setPage} pageParams={page} />}
              {currentPageName === 'facility-invoice' && <FacilityInvoice historyList={historyList} bookingList={bookingList} user={user} setPage={setPage} />}
            </div>
          )
        )}
      </div>
      <div style={{ position: 'fixed', bottom: 10, right: 10, zIndex: 9999 }}>
        <button onClick={handleLogout} style={{ fontSize: '10px', opacity: 0.3, border: 'none', background: 'none', cursor: 'pointer' }}>Logout</button>
      </div>
    </div>
  );
}

export default App;