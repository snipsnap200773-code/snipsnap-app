import React, { useState } from 'react';

export default function AdminTodayList_PC({ historyList = [], dbFacilities = [], bookingList = [], users = [] }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7)); // YYYY-MM
  const [selectedFacility, setSelectedFacility] = useState("");
  const [sortBy, setSortBy] = useState("room");

  // 月と施設で予約をフィルタリング
  const monthKey = selectedMonth; // "YYYY-MM"
  const filteredBookings = bookingList
    .filter(b => b.facility === selectedFacility && b.status === 'confirmed' && b.date.startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date));

  const hasBooking = (fName) => bookingList.some(b => b.facility === fName && b.date.startsWith(monthKey) && b.status === 'confirmed');

  // 🌟 別ウィンドウで当日リストを印刷する関数
  const openPrintWindow = (booking) => {
    const displayDate = booking.date.replace(/-/g, '/');
    const printTitle = `${selectedFacility}_${displayDate.replace(/\//g, '')}_当日名簿`;

    // 該当するメンバーを抽出してソート
    const targetMembers = users.filter(u => {
      if (u.facility !== selectedFacility) return false;
      return booking.members.some(m => {
        const bName = typeof m === 'string' ? m : (m.name || "");
        const cleanBName = bName.replace(/様| |　/g, "").trim();
        const cleanUName = (u.name || "").replace(/様| |　/g, "").trim();
        return cleanUName.includes(cleanBName) || cleanBName.includes(cleanUName);
      });
    });

    const sortedMembers = [...targetMembers].sort((a, b) => {
      if (sortBy === "room") {
        return String(a.room || "").localeCompare(String(b.room || ""), undefined, { numeric: true });
      }
      return (a.kana || a.name).localeCompare(b.kana || b.name, 'ja');
    });

    // 階数ごとにグループ化
    const grouped = sortedMembers.reduce((acc, m) => {
      let f = m.floor;
      if (!f && m.room && /^\d/.test(String(m.room))) f = String(m.room)[0] + "階";
      const fKey = f || "階数未設定";
      if (!acc[fKey]) acc[fKey] = [];
      acc[fKey].push(m);
      return acc;
    }, {});

    const sortedFloors = Object.keys(grouped).sort();

    // ウィンドウ生成
    const printWin = window.open('', '_blank', 'width=1000,height=1200');
    
    let content = `
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: "Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", sans-serif; margin: 0; color: black; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            h1 { font-size: 22px; margin: 0; }
            .info { font-size: 16px; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
            th { border: 1px solid #000; background: #f2f2f2; padding: 8px; font-size: 12px; }
            td { border: 1px solid #000; padding: 10px 5px; font-size: 14px; text-align: center; overflow: hidden; }
            .floor-title { background: #333; color: white; padding: 5px 15px; font-size: 16px; margin-top: 20px; }
            .page-break { page-break-after: always; }
            .checkbox { font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>施術希望者リスト（当日用）</h1>
            <div class="info">施設：<strong>${selectedFacility}</strong> / 訪問日：${displayDate}</div>
          </div>
    `;

    sortedFloors.forEach((floor, idx) => {
      content += `
        <div class="floor-title">📍 ${floor}</div>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">済</th>
              <th style="width: 60px;">部屋</th>
              <th style="width: 180px;">氏名</th>
              <th style="width: 150px;">メニュー</th>
              <th style="width: 80px;">前回日</th>
              <th>備考・手書きメモ欄</th>
            </tr>
          </thead>
          <tbody>
            ${grouped[floor].map(m => `
              <tr>
                <td class="checkbox">□</td>
                <td>${m.room || ''}</td>
                <td style="text-align:left; font-weight:bold; padding-left:10px;">${m.name} 様</td>
                <td>${m.menu || 'カット'}</td>
                <td style="font-size:12px;">${m.lastDate ? m.lastDate.substring(5) : '---'}</td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    });

    content += `
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;

    printWin.document.write(content);
    printWin.document.close();
  };

  return (
    <div style={containerStyle}>
      <div style={controlPanel}>
        <h2 style={{ color: '#1e293b', textAlign: 'center', margin: '0 0 20px 0' }}>📋 当日リスト印刷 (管理者)</h2>
        
        {/* 年月選択 */}
        <div style={yearRow}>
          <button style={circleBtn} onClick={() => {
            const d = new Date(selectedMonth + "-01");
            d.setMonth(d.getMonth() - 1);
            setSelectedMonth(d.toISOString().substring(0, 7));
          }}>◀</button>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{selectedMonth.replace('-', '年')}月</span>
          <button style={circleBtn} onClick={() => {
            const d = new Date(selectedMonth + "-01");
            d.setMonth(d.getMonth() + 1);
            setSelectedMonth(d.toISOString().substring(0, 7));
          }}>▶</button>
        </div>

        {/* ソート順選択 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          <button style={{...sortBtn, backgroundColor: sortBy === 'room' ? '#1e293b' : 'white', color: sortBy === 'room' ? 'white' : '#1e293b'}} onClick={() => setSortBy('room')}>部屋順で印刷</button>
          <button style={{...sortBtn, backgroundColor: sortBy === 'name' ? '#1e293b' : 'white', color: sortBy === 'name' ? 'white' : '#1e293b'}} onClick={() => setSortBy('name')}>名前順で印刷</button>
        </div>

        {/* 施設一覧 */}
        <h4 style={{ color: '#64748b', marginBottom: '15px' }}>施設名を選択：</h4>
        <div style={facilityGrid}>
          {dbFacilities.map(f => {
            const ok = hasBooking(f.name);
            const active = selectedFacility === f.name;
            return (
              <button 
                key={f.id} 
                style={{
                  ...facilityBtn, 
                  opacity: ok ? 1 : 0.4, 
                  backgroundColor: active ? '#1e3a8a' : 'white',
                  color: active ? 'white' : '#1e3a8a',
                  borderColor: active ? '#1e3a8a' : '#cbd5e1'
                }} 
                onClick={() => ok && setSelectedFacility(f.name)}
                disabled={!ok}
              >
                {ok ? '✅' : '➖'} {f.name}
              </button>
            );
          })}
        </div>

        {/* 訪問日選択 */}
        {selectedFacility && (
          <div style={actionArea}>
            <h4 style={{ color: '#1e293b', marginBottom: '15px' }}>印刷する訪問日を選択してください：</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
              {filteredBookings.length > 0 ? filteredBookings.map(b => (
                <button key={b.date} style={printDateBtn} onClick={() => openPrintWindow(b)}>
                  🖨️ {b.date.replace(/-/g, '/')} のリストを印刷
                </button>
              )) : <p style={{color: '#ef4444'}}>この月の確定予約はありません</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 スタイル設定（請求書と統一感を出しています）
const containerStyle = { padding: '40px', height: '100%', boxSizing: 'border-box' };
const controlPanel = { backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', maxWidth: '950px', margin: '0 auto' };
const yearRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '20px' };
const circleBtn = { width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px' };
const sortBtn = { padding: '10px 20px', borderRadius: '10px', border: '1px solid #1e293b', cursor: 'pointer', fontWeight: 'bold' };
const facilityGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' };
const facilityBtn = { padding: '15px', border: '1.5px solid #cbd5e1', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left' };
const actionArea = { marginTop: '40px', paddingTop: '30px', borderTop: '2px dashed #e2e8f0', textAlign: 'center' };
const printDateBtn = { padding: '15px 25px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' };