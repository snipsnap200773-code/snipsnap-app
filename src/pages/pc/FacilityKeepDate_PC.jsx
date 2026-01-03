import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function FacilityKeepDate_PC({ 
  user, 
  keepDates = [], 
  bookingList = [], 
  ngDates = [], 
  historyList = [], // 🌟 App.jsxから受け取る最新の実績
  allUsers = [],    // 🌟 App.jsxから受け取る最新の名簿
  refreshAllData,
  setPage,
  checkDateSelectable 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);

  // 🌟【最強判定】詳細なステータスラベルを取得（終了処理済・訪問済の区別）
  const getDynamicLabel = (dateStr) => {
    const dateSlash = dateStr.replace(/-/g, '/');
    const booking = bookingList.find(b => b.date === dateStr && b.facility === user.name);
    
    // 施術履歴があるか確認
    const finishedCount = historyList.filter(h => h.date === dateSlash && h.facility === user.name).length;
    
    // 履歴があるなら、その時点で「訪問済」または「終了処理済」の候補
    if (finishedCount > 0 || booking) {
      const cancelCount = booking?.members?.filter(m => m.status === 'cancel').length || 0;
      const totalCount = booking?.members?.length || 0;

      // 管理者が一括欠席（終了処理）を行った形跡がある場合
      if (cancelCount > 0 && (finishedCount + cancelCount >= totalCount)) {
        return '終了処理済';
      }
      // 全員分が完了または欠席で片付いている場合
      if (totalCount > 0 && (finishedCount + cancelCount >= totalCount)) {
        return '訪問済';
      }
      return booking ? '確定済' : '訪問済';
    }
    
    return null;
  };

  // 🌟【最強判定】日付の最終ステータス（色の決定）
  const getStatus = (dateStr) => {
    const label = getDynamicLabel(dateStr);
    
    // 1. すでに終わった、または終わらせた形跡があれば「グレー（finished）」で確定
    if (label === '訪問済' || label === '終了処理済') return 'finished';

    // 2. 自分の予約として確定している（まだ終わっていない）
    if (bookingList.some(b => b.date === dateStr && b.facility === user.name)) return 'my-booked'; 

    // 3. 過去の日付は無条件でロック（ finished 以外の過去日は past ）
    if (dateStr < todayStr) return 'past'; 

    // 4. その他の特殊状態
    if (ngDates.includes(dateStr)) return 'ng'; 
    if (keepDates.some(k => k.date === dateStr && k.facility === user.name)) return 'keeping'; 
    if (bookingList.some(b => b.date === dateStr)) return 'other-booked'; 
    if (keepDates.some(k => k.date === dateStr && k.facility !== user.name)) return 'other-keep';
    if (checkDateSelectable && !checkDateSelectable(dateStr)) return 'outside';
    
    return 'available';
  };

  const handleDateClick = async (day) => {
    if (!day) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const status = getStatus(dateStr);

    // 🌟 finished（訪問済・終了済）は絶対に変更させない
    if (status === 'finished') {
      alert('この日の施術は既に完了しているため、変更できません。');
      return;
    }
    
    if (status === 'past') { alert('過去の日付は変更できません。'); return; }
    if (status === 'ng') { alert('美容師の都合により予約できない日です。'); return; }
    if (status === 'my-booked') { alert('この日は既に予約が確定しています。'); return; }
    if (status === 'other-booked' || status === 'other-keep') { alert('他の施設が予約・キープ済みです。'); return; }
    if (status === 'outside') { alert('予約受付時間外、または定休日です。'); return; }

    try {
      if (status === 'keeping') {
        await supabase.from('keep_dates').delete().match({ date: dateStr, facility: user.name });
      } else {
        await supabase.from('keep_dates').upsert({ date: dateStr, facility: user.name });
      }
      // 🌟 クラウド更新後に全体同期を走らせる
      if (refreshAllData) await refreshAllData();
    } catch (err) {
      console.error("Keep Toggle Error:", err);
      alert("通信に失敗しました。");
    }
  };

  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
  };

  const myCurrentKeeps = keepDates
    .filter(kd => kd.facility === user.name && kd.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>📅 希望日のキープ！</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>カレンダーの日付をポチポチ選んでキープしてください</p>
        </div>
        <div style={navGroup}>
          <button onClick={prevMonth} style={iconBtnStyle}>◀</button>
          <span style={monthLabel}>{year}年 {month + 1}月</span>
          <button onClick={nextMonth} style={iconBtnStyle}>▶</button>
        </div>
      </header>

      <div style={calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(w => (
          <div key={w} style={weekHeaderStyle}>{w}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={i} style={emptyDayStyle}></div>;
          
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const status = getStatus(dateStr);
          const label = getDynamicLabel(dateStr);

          const config = {
            'keeping': { bg: '#fffbeb', border: '#f5a623', color: '#d97706', label: '選択中' },
            'my-booked': { bg: '#dcfce7', border: '#10b981', color: '#15803d', label: '確定済' },
            'finished': { bg: '#e2e8f0', border: '#cbd5e1', color: '#64748b', label: label || '訪問済' }, 
            'ng': { bg: '#fee2e2', border: '#ef4444', color: '#ef4444', label: '×' },
            'other-booked': { bg: '#f1f5f9', border: '#cbd5e1', color: '#94a3b8', label: '予約済' },
            'other-keep': { bg: '#f1f5f9', border: '#cbd5e1', color: '#94a3b8', label: 'キープ済' },
            'past': { bg: '#f8fafc', border: '#e2e8f0', color: '#cbd5e1', label: '-' },
            'outside': { bg: '#f8fafc', border: '#e2e8f0', color: '#cbd5e1', label: '×' },
            'available': { bg: 'white', border: '#e2e8f0', color: '#3b82f6', label: '○' }
          };
          const style = config[status];

          return (
            <div 
              key={i} 
              onClick={() => handleDateClick(day)}
              style={{
                ...dayStyle,
                cursor: (status === 'available' || status === 'keeping') ? 'pointer' : 'default',
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                opacity: status === 'finished' ? 0.8 : 1,
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <span style={{...dayNumStyle, color: (status === 'available' || status === 'keeping' || status === 'my-booked') ? '#1e293b' : '#94a3b8'}}>{day}</span>
                <span style={{fontSize: '10px', fontWeight: 'bold', color: style.color}}>{style.label}</span>
              </div>
              <div style={statusTextStyle}>
                {status === 'keeping' && <span style={{fontSize: '18px'}}>★</span>}
                {status === 'my-booked' && <span style={{fontSize: '12px'}}>✅</span>}
                {status === 'finished' && (
                  <span style={{fontSize: '12px', color: '#64748b'}}>
                    {label === '終了処理済' ? '🚩' : '🏁'}
                  </span>
                )}
                {status === 'available' && <span style={{fontSize: '18px'}}>○</span>}
              </div>
            </div>
          );
        })}
      </div>

      <footer style={footerAreaStyle}>
        <div style={legendArea}>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#fffbeb', border:'1px solid #f5a623'}}></span> 選択中</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#dcfce7', border:'1px solid #10b981'}}></span> 予約確定済</div>
           <div style={legendItem}><span style={{...dot, backgroundColor:'#e2e8f0', border:'1px solid #cbd5e1'}}></span> 訪問済/終了済</div>
        </div>

        {myCurrentKeeps.length > 0 && (
          <div style={nextActionBox}>
            <div style={keepBadgeList}>
              <span style={{fontSize:'13px', fontWeight:'bold', marginRight:'10px'}}>{month + 1}月のキープ：</span>
              {myCurrentKeeps.map(k => (
                <span key={k.date} style={keepBadge}>{formatShortDate(k.date)}</span>
              ))}
            </div>
            <button onClick={() => setPage('confirm')} style={confirmBtnStyle}>
              利用者様の選択へ進む ➔
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold', color: '#2d6a4f' };
const calendarGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: '#f1f5f9', gap: '2px', border: '2px solid #f1f5f9', borderRadius: '15px', overflow: 'hidden' };
const weekHeaderStyle = { backgroundColor: '#f8fafc', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '13px' };
const dayStyle = { padding: '10px', minHeight: '80px', display: 'flex', flexDirection: 'column', transition: '0.2s', backgroundColor: 'white' };
const emptyDayStyle = { backgroundColor: '#f8fafc' };
const dayNumStyle = { fontSize: '15px', fontWeight: 'bold' };
const statusTextStyle = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const footerAreaStyle = { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '15px' };
const legendArea = { display: 'flex', gap: '20px', justifyContent: 'center' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' };
const dot = { width: '12px', height: '12px', borderRadius: '3px' };
const nextActionBox = { backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const keepBadgeList = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' };
const keepBadge = { backgroundColor: '#fffbeb', color: '#d97706', padding: '4px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', border: '1px solid #f5a623' };
const confirmBtnStyle = { backgroundColor: '#f5a623', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(245,166,35,0.3)' };