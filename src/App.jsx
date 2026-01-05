import React, { useState, useEffect, useMemo } from 'react';
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

// 🌟 モバイル版 使い方ガイドをインポート
import Manual from './Manual'; 

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
  const [isPC, setIsPC] = useState(window.innerWidth > 1024);

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

  // 🌟【最強の同期版：データ再取得関数】
  // ここに「is_selected」を反映した選択状態の同期ロジックを統合しました
  const refreshAllData = async () => {
    const [
      { data: mData },
      { data: hData },
      { data: bData },
      { data: kData },
      { data: nData },
      { data: fData }
    ] = await Promise.all([
      supabase.from('members').select('*'),
      supabase.from('history').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('keep_dates').select('*'),
      supabase.from('ng_dates').select('*'),
      supabase.from('facilities').select('*')
    ]);

    if (mData) {
      setUsers(mData);
      // 🌟【自動保存の肝】DB上で is_selected かつ 自分の施設のメンバーのみを同期
      if (user && user.role === 'facility') {
        const draftMembers = mData.filter(m => m.facility === user.name && m.is_selected === true);
        setSelectedMembers(draftMembers.map(m => ({ ...m, menus: m.menus || ['カット'] })));
      }
    }
    if (hData) setHistoryList(hData);
    if (bData) setBookingList(bData);
    if (kData) setManualKeepDates(kData);
    if (nData) setNgDates(nData.map(d => d.date));
    if (fData) setDbFacilities(fData);

    return true; 
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  // 🌟【選択メンバーのDB同期関数】
  // 施設がリストを選んだ瞬間、DBのis_selectedを書き換えるロジック
  const setSelectedMembersWithSync = async (updateArg) => {
    // 現在の選択状態を取得
    const nextMembers = typeof updateArg === 'function' ? updateArg(selectedMembers) : updateArg;
    
    // 変更があったユーザーを特定し、DBのフラグを更新
    if (user && user.role === 'facility') {
      const facilityUsers = users.filter(u => u.facility === user.name);
      
      // 全員分のフラグを一旦整理（現在の選択リストに入っているかどうか）
      const updatePromises = facilityUsers.map(u => {
        const isNowSelected = nextMembers.some(m => m.id === u.id);
        if (u.is_selected !== isNowSelected) {
          return supabase.from('members').update({ is_selected: isNowSelected }).eq('id', u.id);
        }
        return null;
      }).filter(p => p !== null);

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }
    }
    
    setSelectedMembers(nextMembers);
  };

  const setHistoryListWithSync = async (updateArg) => {
    const newList = typeof updateArg === 'function' ? updateArg(historyList) : updateArg;
    setHistoryList(newList);
    if (newList.length > 0) {
      const dataToSync = newList.map(({ id, created_at, finishTime, ...rest }) => ({
        ...rest,
        date: (rest.date || "").replace(/-/g, '/') 
      }));
      const { error } = await supabase.from('history').upsert(dataToSync, { onConflict: 'date,facility,name' });
      if (!error) await refreshAllData();
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
      const { error } = await supabase.from('bookings').upsert(formattedBookings);
      if (!error) await refreshAllData();
    }
  };

  const setManualKeepDatesWithSync = async (updateArg) => {
    setManualKeepDates(prev => (typeof updateArg === 'function' ? updateArg(prev) : updateArg));
  };

  const setNgDatesWithSync = async (updateArg) => {
    const next = typeof updateArg === 'function' ? updateArg(ngDates) : updateArg;
    setNgDates(next);
    await refreshAllData();
  };

  const getSystemKeepDates = () => {
    const dates = [];
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE');
    dbFacilities.forEach(fac => {
      const rules = fac.regular_rules || [];
      for (let m = 0; m <= 12; m++) {
        const year = now.getFullYear();
        const monthIndex = now.getMonth() + m;
        // 🌟 月条件の判定用
        const targetDateForMonth = new Date(year, monthIndex, 1);
        const displayMonth = targetDateForMonth.getMonth() + 1; // 1〜12月

        rules.forEach(rule => {
          // 🌟 追加：月の条件判定 (1: 奇数月, 2: 偶数月)
          if (rule.monthType === 1 && displayMonth % 2 === 0) return;
          if (rule.monthType === 2 && displayMonth % 2 !== 0) return;

          const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
          let matchDate = null;
          if (rule.week > 0) {
            let count = 0;
            for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
              const d = new Date(year, monthIndex, i);
              if (d.getDay() === rule.day) {
                count++;
                if (count === rule.week) { matchDate = d; break; }
              }
            }
          } else {
            let count = 0;
            for (let i = lastDayOfMonth.getDate(); i >= 1; i--) {
              const d = new Date(year, monthIndex, i);
              if (d.getDay() === rule.day) {
                count--;
                if (count === rule.week) { matchDate = d; break; }
              }
            }
          }
          if (matchDate) {
            const dateStr = matchDate.toLocaleDateString('sv-SE');
            const isAlreadyConfirmed = bookingList.some(b => b.date === dateStr && b.facility === fac.name);
            if (dateStr >= todayStr && !isAlreadyConfirmed) {
              dates.push({ 
                date: dateStr, 
                facility: fac.name, 
                isSystem: true, 
                time: rule.time || '09:00' 
              });
            }
          }
        });
      }
    });
    return dates;
  };

  const keepDates = useMemo(() => {
    const systemKeep = getSystemKeepDates();
    return [...manualKeepDates, ...systemKeep].filter((v, i, a) =>
      a.findIndex(t => t.date === v.date && t.facility === v.facility) === i
    );
  }, [dbFacilities, manualKeepDates, bookingList]);

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
    await refreshAllData();
  };

  const updateUserNotes = async (userName, facilityName, newEntry) => {
    const targetUser = users.find(u => u.name === userName && u.facility === facilityName);
    if (!targetUser) return;
    const label = "【前回薬剤】:";
    let currentNotes = targetUser.notes || "";
    let finalNotes = "";
    if (currentNotes.includes(label)) {
      const lines = currentNotes.split('\n');
      const updatedLines = lines.map(line => 
        line.startsWith(label) ? `${label} ${newEntry}` : line
      );
      finalNotes = updatedLines.join('\n');
    } else {
      finalNotes = `${label} ${newEntry}\n${currentNotes}`;
    }
    const { error } = await supabase.from('members').update({ notes: finalNotes }).eq('id', targetUser.id);
    if (!error) await refreshAllData();
  };

  const finalizeBooking = async () => {
    const myKeepDates = keepDates.filter(kd => kd.facility === user.name).map(kd => kd.date);
    const sortedKeepDates = [...myKeepDates].sort();
    if (sortedKeepDates.length === 0) return;
    const activeMonth = sortedKeepDates[0].substring(0, 7);
    const datesToConfirm = myKeepDates.filter(d => d.startsWith(activeMonth));
    const currentSystemKeeps = getSystemKeepDates();
    const newConfirmedEntries = datesToConfirm.map(date => {
      const sysKeep = currentSystemKeeps.find(sk => sk.date === date && sk.facility === user.name);
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
      // 🌟【予約確定時のクリーンアップ】
      // 確定した施設の「is_selected」フラグをDB上で一斉解除
      await supabase.from('members').update({ is_selected: false }).eq('facility', user.name);
      
      for (const d of datesToConfirm) {
        await supabase.from('keep_dates').delete().match({ facility: user.name, date: d });
      }
      setSelectedMembers([]); 
      setPage('thanks');
      await refreshAllData();
    } else {
      alert("予約の確定に失敗しました。");
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
        maxWidth: isPC ? 'none' : '1000px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isPC ? 'stretch' : 'center', 
        position: 'relative' 
      }}>
        {user.role === 'barber' && (
          isPC ? (
            <AdminMenu_PC 
              page={page} setPage={setPage} 
              setActiveFacility={setActiveFacility} activeFacility={activeFacility}
              dbFacilities={dbFacilities} user={user} users={users} setUsers={setUsers}
              historyList={historyList} colorList={colorList} 
              setHistoryList={setHistoryListWithSync} 
              bookingList={bookingList} setBookingList={setBookingListWithSync}
              ngDates={ngDates} setNgDates={setNgDatesWithSync}
              keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync}
              checkDateSelectable={checkDateSelectable}
              updateUserNotes={updateUserNotes} refreshAllData={refreshAllData}
            />
          ) : (
            <div className="mobile-view-container" style={{width:'100%'}}>
              {currentPageName === 'admin-top' && <AdminMenu setPage={setPage} setActiveFacility={setActiveFacility} dbFacilities={dbFacilities} user={user} />}
              {currentPageName === 'task' && <TaskMode bookingList={bookingList} historyList={historyList} setHistoryList={setHistoryListWithSync} setBookingList={setBookingListWithSync} setPage={setPage} users={users} activeFacility={activeFacility} setActiveFacility={setActiveFacility} menuPrices={menuPrices} colorList={colorList} updateUserNotes={updateUserNotes} />}
              {currentPageName === 'admin-reserve' && <AdminScheduleManager keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} setBookingList={setBookingListWithSync} setPage={setPage} user={user} historyList={historyList} allUsers={users} refreshAllData={refreshAllData} />}
              {currentPageName === 'admin-ng' && <ScheduleNG keepDates={keepDates} bookingList={bookingList} ngDates={ngDates} setNgDates={setNgDatesWithSync} historyList={historyList} setPage={setPage} checkDateSelectable={checkDateSelectable} />}
              {currentPageName === 'admin-facility-list' && <AdminFacilityList setPage={setPage} refreshAllData={refreshAllData} />}
              {currentPageName === 'master-user-list' && <AdminMasterUserList users={users} setUsers={setUsers} facilityMaster={dbFacilities} setPage={setPage} historyList={historyList} bookingList={bookingList} refreshAllData={refreshAllData} />}
              {currentPageName === 'admin-history' && <AdminHistory setPage={setPage} historyList={historyList} bookingList={bookingList} menuPrices={menuPrices} />}
              {currentPageName === 'invoice' && <InvoiceManager setPage={setPage} historyList={historyList} />}
              {currentPageName === 'dashboard' && <AdminDashboard historyList={historyList} bookingList={bookingList} setPage={setPage} />}
              {currentPageName === 'task-confirm' && <TaskConfirmMode historyList={historyList} bookingList={bookingList} setPage={setPage} facilityName={activeFacility} user={user} completeFacilityBooking={completeFacilityBooking} />}
              {currentPageName === 'admin-print-today' && <AdminTodayList facilityName={activeFacility} bookingList={bookingList} users={users} setPage={setPage} />}
            </div>
          )        )}

        {user.role === 'facility' && (
          isPC ? (
            <FacilityMenu_PC 
              user={user} page={page} setPage={setPage} 
              users={users.filter(u => u.facility === user.name)}
              bookingList={bookingList} historyList={historyList}
              allUsers={users} keepDates={keepDates} ngDates={ngDates}        
              refreshAllData={refreshAllData}
              selectedMembers={selectedMembers} 
              setSelectedMembers={setSelectedMembersWithSync} 
              scheduleTimes={scheduleTimes} setScheduleTimes={setScheduleTimes} 
              finalizeBooking={finalizeBooking} checkDateSelectable={checkDateSelectable}
              handleLogout={handleLogout} // 👈 この一行を最後に追加してください！
            />
          ) : (
            <div className="mobile-view-container" style={{width:'100%'}}>
              {currentPageName === 'menu' && <Menu setPage={setPage} user={user} />}
              {currentPageName === 'list' && <ListPage users={users.filter(u => u.facility === user.name)} setUsers={async (updated) => { await supabase.from('members').upsert(updated); await refreshAllData(); }} deleteUserFromMaster={deleteUserFromMaster} setPage={setPage} facilityName={user.name} />}
              {currentPageName === 'keep-date' && <KeepDate keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} ngDates={ngDates} historyList={historyList} setPage={setPage} checkDateSelectable={checkDateSelectable} user={user} />}
              {currentPageName === 'confirm' && <ConfirmBooking keepDates={keepDates.filter(kd => { const dateStr = typeof kd === 'string' ? kd : kd?.date; return (typeof kd === 'string' ? user?.name : kd?.facility) === user?.name; })} users={users.filter(u => u.facility === user.name)} selectedMembers={selectedMembers} setSelectedMembers={setSelectedMembersWithSync} setPage={setPage} menuPrices={menuPrices} historyList={historyList} user={user} />}
              {currentPageName === 'timeselect' && <TimeSelection keepDates={keepDates.filter(kd => (typeof kd === 'string' ? user?.name : kd?.facility) === user?.name).map(kd => (typeof kd === 'string' ? kd : kd.date))} scheduleTimes={scheduleTimes} setScheduleTimes={setScheduleTimes} setPage={setPage} config={businessConfig} />}
              {currentPageName === 'preview' && <FinalPreview keepDates={keepDates.filter(kd => (typeof kd === 'string' ? user?.name : kd?.facility) === user?.name).map(kd => (typeof kd === 'string' ? kd : kd.date))} selectedMembers={selectedMembers} scheduleTimes={scheduleTimes} setPage={setPage} finalizeBooking={finalizeBooking} />}
              {currentPageName === 'thanks' && <ThanksPage setPage={setPage} />}
              {currentPageName === 'schedule' && <ScheduleManager keepDates={keepDates} setKeepDates={setManualKeepDatesWithSync} bookingList={bookingList} setBookingList={setBookingListWithSync} setPage={setPage} user={user} historyList={historyList} users={users} />}
              {currentPageName === 'history' && <VisitHistory setPage={setPage} historyList={historyList} bookingList={bookingList} user={user} />}
              {currentPageName === 'info' && <FacilityInfo user={user} setPage={setPage} />}
              {currentPageName === 'print-list' && <PrintUserList users={users.filter(u => u.facility === user.name)} historyList={historyList} keepDates={keepDates} bookingList={bookingList} facilityName={user.name} setPage={setPage} pageParams={page} />}
              {currentPageName === 'facility-invoice' && <FacilityInvoice historyList={historyList} bookingList={bookingList} user={user} setPage={setPage} />}
              
              {/* 🌟 モバイル版 使い方ガイドを表示する条件分岐を追加 */}
              {currentPageName === 'manual' && <Manual setPage={setPage} />}
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