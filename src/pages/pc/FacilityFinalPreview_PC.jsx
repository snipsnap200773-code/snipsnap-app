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

  // 🌟【鉄壁ガード】混在データから安全に日付文字列を取得し、ソート
  const myKeepDates = keepDates
    .map(d => (typeof d === 'string' ? d : d?.date))
    .filter(Boolean)
    .sort();

  const firstDate = myKeepDates[0] || "";
  const activeMonth = firstDate ? firstDate.substring(0, 7) : "";
  const activeDates = myKeepDates.filter(date => date.startsWith(activeMonth));

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

  const sendEmailNotification = async () => {
    const dateListStr = activeDates.map(d => formatDateTime(d)).join('\n');
    const memberListStr = sortedMembers.map(m => `・${m.room} ${m.name} 様 (${(m.menus || []).join(', ')})`).join('\n');

    const templateParams = {
      facility_name: user?.name || user?.facilityName || user?.facility_name || "施設名取得エラー",
      facility_email: user?.email || user?.details?.email || "", 
      admin_email: "h.snipsnap@gmail.com", 
      visit_month: activeMonth.replace('-', '年 ') + '月',
      date_list: dateListStr,
      member_count: selectedMembers.length,
      member_list: memberListStr,
    };

    try {
      // 🌟 三土手さんへの通知
      await emailjs.send('service_ty8h26r', 'template_6tos45t', templateParams, '4QQyusD3MBj0A0aa9');
      // 🌟 施設様への通知
      await emailjs.send('service_ty8h26r', 'template_o1n3dud', templateParams, '4QQyusD3MBj0A0aa9');
    } catch (error) {
      console.error('メール送信失敗:', error);
      alert("通知メールの送信中にエラーが発生しました。");
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("この内容で予約を確定し、通知を送信しますか？")) return;
    setIsSending(true);
    try {
      await sendEmailNotification();
      await finalizeBooking();
      alert("予約が確定しました。三土手さんと施設様へ確認メールを送信しました。");
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
          <h2 style={{margin:0, color: '#4a3728', fontSize: '32px'}}>🏁 内容確認、最終チェック</h2>
          <p style={{fontSize: '18px', color: '#7a6b5d', marginTop: '8px', fontWeight: '800'}}>
            {activeMonth.replace('-', '年 ')}月分の予約内容を確定します
          </p>
        </div>
      </header>

      <div style={contentWrapperStyle}>
        {/* 左側：訪問日確認 */}
        <div style={leftPaneStyle}>
          <div style={cardHeaderStyle}>📅 訪問スケジュール</div>
          <div style={cardBodyStyle}>
            {activeDates.map(date => (
              <div key={date} style={dateRowStyle}>{formatDateTime(date)}</div>
            ))}
            <div style={infoNoteStyle}>※各訪問日の開始時間です</div>
          </div>
        </div>

        {/* 右側：名簿確認 */}
        <div style={rightPaneStyle}>
          <div style={{...cardHeaderStyle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>👥 施術を受ける方</span>
            <span style={countBadgeStyle}>{selectedMembers.length}名</span>
          </div>
          <div style={cardBodyStyle}>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
              <button onClick={() => toggleSort('room')} style={{...pcSortBtn, backgroundColor: sortKey === 'room' ? '#4a3728' : 'white', color: sortKey === 'room' ? 'white' : '#4a3728', borderColor: '#4a3728'}}>部屋順</button>
              <button onClick={() => toggleSort('name')} style={{...pcSortBtn, backgroundColor: sortKey === 'name' ? '#4a3728' : 'white', color: sortKey === 'name' ? 'white' : '#4a3728', borderColor: '#4a3728'}}>名前順</button>
            </div>
            <div style={memberListStyle}>
              {sortedMembers.map(item => (
                <div key={item.id} style={memberRowStyle}>
                  <div style={{ fontWeight: '800', fontSize: '22px', color: '#4a3728' }}>
                    <span style={roomNumStyle}>{item.room}号室</span> {item.name} 様
                  </div>
                  <div style={badgeContainerStyle}>
                    {(item.menus || []).map(m => <span key={m} style={pcBadgeStyle}>{m}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer style={pcFooterStyle}>
        <p style={{ fontSize: '16px', color: '#7a6b5d', margin: 0, fontWeight: 'bold' }}>
          内容に間違いがなければ、右のボタンを押して確定してください。
        </p>
        <div style={{display:'flex', gap:'20px'}}>
          <button onClick={() => setPage('timeselect')} style={pcBackBtn} disabled={isSending}>戻る</button>
          <button onClick={handleConfirm} style={pcFinalBtn} disabled={isSending}>
            {isSending ? '送信中...' : 'この内容で確定・送信する ➔'}
          </button>
        </div>
      </footer>
    </div>
  );
}

// 🎨 デザインスタイル
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '25px', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { backgroundColor: 'white', padding: '24px 35px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)' };
const contentWrapperStyle = { flex: 1, display: 'flex', gap: '30px', minHeight: 0, marginBottom: '100px' };

const leftPaneStyle = { flex: '0 0 400px', backgroundColor: 'white', borderRadius: '25px', border: '1px solid #e0d6cc', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' };
const rightPaneStyle = { flex: 1, backgroundColor: 'white', borderRadius: '25px', border: '1px solid #e0d6cc', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' };

const cardHeaderStyle = { padding: '24px 30px', backgroundColor: '#f9f7f5', color: '#4a3728', fontWeight: '800', borderBottom: '2px solid #e0d6cc', fontSize: '20px' };
const cardBodyStyle = { padding: '35px', flex: 1, overflowY: 'auto' };

const dateRowStyle = { fontSize: '26px', fontWeight: '800', color: '#2d6a4f', marginBottom: '20px', letterSpacing: '0.05em' };
const infoNoteStyle = { fontSize: '14px', color: '#94a3b8', marginTop: '10px' };

const countBadgeStyle = { backgroundColor: '#e8f5e9', color: '#2d6a4f', padding: '6px 20px', borderRadius: '20px', fontSize: '16px', border: '1px solid #c8e6c9' };
const pcSortBtn = { flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid', fontSize: '15px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' };

const memberListStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const memberRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '2px solid #faf9f8' };
const roomNumStyle = { fontSize: '14px', color: '#8b5e3c', marginRight: '10px', backgroundColor: '#fdfcfb', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e0d6cc' };

const badgeContainerStyle = { display: 'flex', gap: '8px' };
const pcBadgeStyle = { fontSize: '14px', backgroundColor: '#f0f7f4', color: '#2d6a4f', padding: '6px 16px', borderRadius: '10px', border: '2px solid #d1e5de', fontWeight: '800' };

const pcFooterStyle = { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '30px 50px', backgroundColor: 'white', borderRadius: '35px 35px 0 0', boxShadow: '0 -10px 30px rgba(74, 55, 40, 0.1)', zIndex: 10, border: '1px solid #e2d6cc' };
const pcBackBtn = { padding: '15px 40px', backgroundColor: 'white', border: '2px solid #e0d6cc', borderRadius: '18px', cursor: 'pointer', fontWeight: '800', fontSize: '18px', color: '#7a6b5d' };
const pcFinalBtn = { padding: '20px 60px', backgroundColor: '#2d6a4f', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '22px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(45, 106, 79, 0.4)', transition: '0.3s' };