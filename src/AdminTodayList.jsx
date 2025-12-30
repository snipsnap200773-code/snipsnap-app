import React, { useState, useEffect } from 'react';

export default function AdminTodayList({ facilityName, bookingList, users, setPage }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);

  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

  // 1. その施設の「選択された月」にある確定予約をすべて取得
  const monthlyBookings = bookingList
    .filter(b => b.facility === facilityName && b.status === 'confirmed' && b.date.startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 2. 表示する予約データを決定（選択された日、なければ一番新しい日）
  const currentBooking = selectedDate 
    ? monthlyBookings.find(b => b.date === selectedDate)
    : monthlyBookings[monthlyBookings.length - 1];

  // 照合ロジック
  const targetMembers = currentBooking && Array.isArray(currentBooking.members)
    ? users.filter(u => {
        if (u.facility !== facilityName) return false;
        return currentBooking.members.some(m => {
          const bName = typeof m === 'string' ? m : (m.name || "");
          const cleanBName = bName.replace(/様| |　/g, "").trim();
          const cleanUName = (u.name || "").replace(/様| |　/g, "").trim();
          if (!cleanBName || !cleanUName) return false;
          return cleanUName.includes(cleanBName) || cleanBName.includes(cleanUName);
        });
      })
    : [];

  const sortedMembers = [...targetMembers].sort((a, b) => {
    const rA = String(a.room || "");
    const rB = String(b.room || "");
    return rA.localeCompare(rB, undefined, { numeric: true });
  });

  const groupedMembers = sortedMembers.reduce((acc, m) => {
    let f = m.floor;
    if (!f && m.room && /^\d/.test(String(m.room))) f = String(m.room)[0] + "階";
    const fKey = f || "階数未設定";
    if (!acc[fKey]) acc[fKey] = [];
    acc[fKey].push(m);
    return acc;
  }, {});

  const sortedFloors = Object.keys(groupedMembers).sort();

  // 🌟 日付が手動で選ばれた時だけ自動印刷が走るように調整
  useEffect(() => {
    if (selectedDate && targetMembers.length > 0) {
      const timer = setTimeout(() => window.print(), 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, targetMembers.length]);

  const cellStyle = { 
    border: '1px solid #000', 
    padding: '5px 5px', 
    fontSize: '16px', 
    textAlign: 'center' 
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "---";
    const parts = dateStr.replace(/\//g, '-').split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[1]}/${parts[2]}`;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    setSelectedDate(null); // 月を変えたら選択をリセット
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <style>{`
        @media print { .no-print { display: none !important; } }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
        th { border: 1px solid #000; padding: 10px; font-size: 14px; background-color: #f8fafc; }
        .date-btn { padding: 10px 15px; border: 1px solid #1e3a8a; border-radius: 8px; background: white; cursor: pointer; font-weight: bold; color: #1e3a8a; }
        .date-btn.active { background: #1e3a8a; color: white; }
      `}</style>
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setPage('admin-top')} style={{ padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
          ← 戻る
        </button>
        
        {/* 🌟 月移動ナビゲーション */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '20px', fontWeight: 'bold' }}>
          <button onClick={() => changeMonth(-1)} style={{ fontSize: '24px', border: 'none', background: 'none', cursor: 'pointer' }}>◀</button>
          <span>{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
          <button onClick={() => changeMonth(1)} style={{ fontSize: '24px', border: 'none', background: 'none', cursor: 'pointer' }}>▶</button>
        </div>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* 🌟 日付選択ボタン一覧 */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>印刷する日を選んでください：</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          {monthlyBookings.length > 0 ? monthlyBookings.map(b => (
            <button 
              key={b.date} 
              className={`date-btn ${selectedDate === b.date ? 'active' : ''}`}
              onClick={() => setSelectedDate(b.date)}
            >
              {formatShortDate(b.date)}
            </button>
          )) : <p style={{ color: '#999' }}>この月の予約はありません</p>}
        </div>
      </div>

      {currentBooking ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', margin: '0' }}>施術希望者リスト（当日用）</h1>
            <p style={{ fontSize: '18px', marginTop: '10px' }}>
              施設：<strong>{facilityName}</strong> / 訪問日：{(currentBooking.date || "").replace(/-/g, '/')}
            </p>
          </div>

          {targetMembers.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '50px', padding: '40px', border: '2px dashed #cbd5e1', borderRadius: '20px' }}>
              <p style={{ color: '#e11d48', fontWeight: 'bold', fontSize: '18px' }}>⚠️ 名簿データが見つかりません</p>
            </div>
          ) : (
            sortedFloors.map((floor, index) => (
              <div key={floor} style={{ pageBreakBefore: index > 0 ? 'always' : 'auto' }}>
                <h2 style={{ fontSize: '18px', borderLeft: '10px solid #1e3a8a', paddingLeft: '15px', backgroundColor: '#f1f5f9', padding: '8px 15px' }}>
                  📍 {floor}
                </h2>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '20px' }}>済</th>
                      <th style={{ width: '35px' }}>部屋</th>
                      <th style={{ width: '160px' }}>氏名</th>
                      <th style={{ width: '160px' }}>メニュー</th>
                      <th style={{ width: '35px' }}>前回日</th>
                      <th>備考・手書きメモ欄</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedMembers[floor].map((m, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontSize: '20px' }}>□</td>
                        <td style={cellStyle}>{m.room}</td>
                        <td style={{ ...cellStyle, fontWeight: 'bold', fontSize: '16px', textAlign: 'left' }}>{m.name} 様</td>
                        <td style={cellStyle}>{m.menu || 'カット'}</td>
                        <td style={{ ...cellStyle, fontSize: '14px' }}>{formatShortDate(m.lastDate)}</td>
                        <td style={cellStyle}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      ) : (
        <div className="no-print" style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
          <p>表示する予約を選択してください</p>
        </div>
      )}
    </div>
  );
}