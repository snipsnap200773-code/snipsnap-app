import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function FacilityFinalPreview_PC({ 
  keepDates = [], 
  selectedMembers = [], 
  scheduleTimes = {}, 
  setPage,
  finalizeBooking,
  user 
}) {
  const [isSending, setIsSending] = useState(false);

  // コンソールでデータの渡りを確認（ログに「あおばの里」が出ていれば成功です）
  console.log("三土手さん、現在のuserデータの中身はこれです:", user);

  const sortedKeepDates = [...keepDates].sort();
  const firstDate = sortedKeepDates[0];
  const activeMonth = firstDate ? firstDate.substring(0, 7) : "";
  const activeDates = keepDates.filter(date => date.startsWith(activeMonth));

  const [sortKey, setSortKey] = useState('room'); 
  const [sortOrder, setSortOrder] = useState('asc'); 

  const sortedMembers = [...selectedMembers].sort((a, b) => {
    let valA, valB;
    if (sortKey === 'name') {
      valA = a.kana || a.name || "";
      valB = b.kana || b.name || "";
    } else {
      valA = a[sortKey] || "";
      valB = b[sortKey] || "";
    }
    if (sortOrder === 'desc') [valA, valB] = [valB, valA];
    return valA.toString().localeCompare(valB.toString(), 'ja', { numeric: true });
  });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const formatDateTime = (dateStr) => {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const datePart = `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
    const timePart = scheduleTimes[dateStr] || '未設定';
    return `${datePart} ${timePart} 〜`;
  };

  // 🌟 メール送信ロジック（管理者と施設へ2通送信）
  const sendEmailNotification = async () => {
    const dateListStr = activeDates.map(d => formatDateTime(d)).join('\n');
    const memberListStr = sortedMembers.map(m => `・${m.room} ${m.name} 様 (${(m.menus || []).join(', ')})`).join('\n');

    const templateParams = {
      facility_name: user?.name || user?.facilityName || user?.facility_name || "施設名取得エラー",
      facility_email: user?.email || user?.details?.email || "", 
      admin_email: "snipsnap.2007.7.3@gmail.com", 
      visit_month: activeMonth.replace('-', '年 ') + '月',
      date_list: dateListStr,
      member_count: selectedMembers.length,
      member_list: memberListStr,
    };

    try {
      // 1️⃣ 三土手さん（管理者）への事務通知
      await emailjs.send(
        'service_ty8h26r', 
        'template_6tos45t', 
        templateParams,
        '4QQyusD3MBj0A0aa9'
      );

      // 2️⃣ 施設様への「SnipSnap 三土手」としての挨拶メール
      // 🌟 ここに新しく作ったテンプレートのIDを貼り付けてください
      await emailjs.send(
        'service_ty8h26r', 
        'template_o1n3dud', 
        templateParams,
        '4QQyusD3MBj0A0aa9'
      );

      console.log('メール送信に成功しました（管理者・施設様両方）');
    } catch (error) {
      console.error('メール送信失敗:', error);
      alert("通知メールの送信中にエラーが発生しました。IDが正しいか確認してください。");
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("この内容で予約を確定し、通知を送信しますか？")) return;
    
    setIsSending(true);
    try {
      // 1. メール送信（2通）
      await sendEmailNotification();
      // 2. データベース更新
      await finalizeBooking();
      
      alert("予約が確定しました。三土手さんと施設様へそれぞれ内容の異なる確認メールを送信しました。");
    } catch (e) {
      alert("確定処理中にエラーが発生しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#2d6a4f'}}>🏁 内容確認、最終チェック</h2>
          <p style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>
            {activeMonth.replace('-', '年 ')}月分の予約内容を確定します
          </p>
        </div>
      </header>

      <div style={contentWrapperStyle}>
        <div style={leftPaneStyle}>
          <div style={cardHeaderStyle}>📅 訪問スケジュール</div>
          <div style={cardBodyStyle}>
            {activeDates.map(date => (
              <div key={date} style={dateRowStyle}>{formatDateTime(date)}</div>
            ))}
          </div>
        </div>

        <div style={rightPaneStyle}>
          <div style={{...cardHeaderStyle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>👥 施術を受ける方</span>
            <span style={countBadgeStyle}>{selectedMembers.length}名</span>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
              <button onClick={() => toggleSort('room')} style={{...pcSortBtn, backgroundColor: sortKey === 'room' ? '#2d6a4f' : 'white', color: sortKey === 'room' ? 'white' : '#666'}}>部屋順</button>
              <button onClick={() => toggleSort('name')} style={{...pcSortBtn, backgroundColor: sortKey === 'name' ? '#2d6a4f' : 'white', color: sortKey === 'name' ? 'white' : '#666'}}>名前順</button>
            </div>
            <div style={memberListStyle}>
              {sortedMembers.map(item => (
                <div key={item.id} style={memberRowStyle}>
                  <div style={{ fontWeight: 'bold' }}><span style={roomNumStyle}>{item.room}</span> {item.name} 様</div>
                  <div style={badgeContainerStyle}>{(item.menus || []).map(m => <span key={m} style={pcBadgeStyle}>{m}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer style={pcFooterStyle}>
        <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>内容を確認し、確定ボタンを押してください。三土手さんと施設様にそれぞれの内容で通知が届きます。</p>
        <div style={{display:'flex', gap:'15px'}}>
          <button onClick={() => setPage('timeselect')} style={pcBackBtn} disabled={isSending}>戻る</button>
          <button onClick={handleConfirm} style={pcFinalBtn} disabled={isSending}>
            {isSending ? '送信中...' : 'この内容で確定・送信する'}
          </button>
        </div>
      </footer>
    </div>
  );
}

// デザインスタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' };
const contentWrapperStyle = { flex: 1, display: 'flex', gap: '25px', minHeight: 0 };
const leftPaneStyle = { flex: '0 0 350px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e0efea', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const rightPaneStyle = { flex: 1, backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e0efea', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const cardHeaderStyle = { padding: '20px', backgroundColor: '#f0f7f4', color: '#2d6a4f', fontWeight: 'bold', borderBottom: '1px solid #e0efea' };
const cardBodyStyle = { padding: '25px', flex: 1, overflowY: 'auto' };
const dateRowStyle = { fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f', marginBottom: '15px' };
const countBadgeStyle = { backgroundColor: '#dcfce7', color: '#2d6a4f', padding: '4px 15px', borderRadius: '15px', fontSize: '14px' };
const pcSortBtn = { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ccc', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' };
const memberListStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f8f9fa' };
const roomNumStyle = { fontSize: '12px', color: '#94a3b8', marginRight: '10px' };
const badgeContainerStyle = { display: 'flex', gap: '5px' };
const pcBadgeStyle = { fontSize: '12px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1e5de', fontWeight: 'bold' };
const pcFooterStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px 40px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 -5px 20px rgba(0,0,0,0.05)' };
const pcBackBtn = { padding: '12px 30px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const pcFinalBtn = { padding: '15px 50px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(45, 106, 79, 0.3)' };