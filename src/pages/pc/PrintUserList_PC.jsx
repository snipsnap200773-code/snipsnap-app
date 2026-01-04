import React, { useState } from 'react';

export default function PrintUserList_PC({ users, historyList, keepDates = [], facilityName, setPage }) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  
  const getDayName = (dateStr) => {
    const d = new Date(dateStr.replace(/\//g, '-'));
    return isNaN(d) ? "" : ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  };
  
  // 🌟 ロジック保持：日付リスト作成
  const targetMonthlyDates = keepDates
    .filter(kd => kd.facility === facilityName && kd.date.replace(/\//g, '-').startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(kd => {
      const parts = kd.date.replace(/\//g, '-').split('-');
      return `${parseInt(parts[1])}/${parseInt(parts[2])}(${getDayName(kd.date)})`;
    });

  const dateListString = targetMonthlyDates.length > 0 ? targetMonthlyDates.join(' ・ ') : "（未定）";

  // 🌟 ロジック保持：フロア集計
  const floorGroups = users.reduce((acc, user) => {
    const floor = user.floor || '不明';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(user);
    return acc;
  }, {});

  const sortedFloors = Object.keys(floorGroups).sort();

  const getLastDate = (name) => {
    const visits = historyList.filter(h => h.name === name && h.facility === facilityName).sort((a, b) => b.date.localeCompare(a.date));
    return visits.length > 0 ? visits[0].date.split('/').slice(1).join('/') : 'ー';
  };

  // 🌟 ロジック保持：印刷レイアウト（一切変更なし）
  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=1200,height=800');
    let content = `
      <html>
        <head>
          <title>${facilityName}_名簿</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
            .floor-block { page-break-after: always; }
            .floor-block:last-child { page-break-after: auto; }
            table { width: 100%; border-collapse: collapse; border: 3px solid #000; }
            thead { display: table-header-group; }
            .print-header { border-bottom: 4px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .flex-header { display: flex; justify-content: space-between; align-items: flex-end; }
            th { background-color: #f1f5f9; border: 1px solid #000; padding: 12px 4px; font-size: 16px; }
            td { border: 1px solid #000; padding: 0 4px; text-align: center; height: 11mm; font-size: 20px; }
            tr { page-break-inside: avoid; }
            .name-cell { text-align: left; font-weight: bold; padding-left: 20px; font-size: 24px; }
            .check-box { width: 24px; height: 24px; border: 2.5px solid #000; margin: 0 auto; }
            .footer { text-align: right; font-size: 14px; margin-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${sortedFloors.map(floor => {
            const floorUsers = [...floorGroups[floor]].sort((a,b)=>a.room.toString().localeCompare(b.room.toString(), undefined, {numeric:true}));
            return `
              <div class="floor-block">
                <div class="print-header">
                  <div class="flex-header">
                    <h1 style="margin: 0; font-size: 28px;">美容室SnipSnap あつまれ綺麗にしたい人</h1>
                    <span style="font-size: 24px;">フロア：<b style="font-size: 48px;">${floor}</b></span>
                  </div>
                  <div style="font-size: 22px; font-weight: bold; margin-top: 10px;">訪問予定日：${dateListString}</div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 10mm;">申込</th>
                      <th style="width: 20mm;">部屋</th>
                      <th style="width: 65mm;">お名前</th>
                      <th style="width: 85mm;">希望メニュー</th>
                      <th style="width: 20mm;">前回</th>
                      <th>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${floorUsers.map((u, idx) => `
                      <tr style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#fff'}">
                        <td><div class="check-box"></div></td>
                        <td>${u.room}</td>
                        <td class="name-cell">${u.name} 様</td>
                        <td>
                          <div style="display: flex; justify-content: space-around; font-size: 18px;">
                            <span>▢カット</span><span>▢カラー</span><span>▢パーマ</span>
                          </div>
                        </td>
                        <td>${getLastDate(u.name)}</td>
                        <td></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                <div class="footer">${facilityName} 様 / 印刷日: ${new Date().toLocaleDateString('ja-JP')}</div>
              </div>
            `;
          }).join('')}
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWin.document.write(content);
    printWin.document.close();
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{color: '#4a3728', fontSize: '32px', marginBottom: '15px', fontWeight: '900'}}>🖨️ 掲示用名簿のプリント</h2>
        <p style={{color: '#7a6b5d', fontSize: '18px', marginBottom: '50px', fontWeight: '800'}}>
          階（フロア）ごとに自動でページを分けて作成します
        </p>
        
        <div style={selectorRowStyle}>
          <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() - 1, 1))}>◀</button>
          <span style={monthLabelStyle}>{year}年 {month}月度</span>
          <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() + 1, 1))}>▶</button>
        </div>

        <button style={printMainBtnStyle} onClick={handlePrint}>
          📄 名簿を発行（印刷・保存）
        </button>
        
        <div style={infoBoxStyle}>
          <p>💡 <b>名簿の使い道（ご自由にどうぞ）</b></p>
          <p>掲示板に貼って入居者様にお知らせしたり、スタッフ様がカット希望者をチェックするリストとしてご活用ください。</p>
        </div>
      </div>
    </div>
  );
}

// 🎨 デザイン設定（特大文字・アンティーク調）
const containerStyle = { 
  padding: '80px 20px', 
  display: 'flex', 
  justifyContent: 'center', 
  fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' 
};

const cardStyle = { 
  backgroundColor: 'white', 
  padding: '80px', 
  borderRadius: '50px', 
  boxShadow: '0 30px 60px rgba(74, 55, 40, 0.12)', 
  width: '100%', 
  maxWidth: '900px', 
  textAlign: 'center', 
  border: '1px solid #e2d6cc' 
};

const selectorRowStyle = { 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  gap: '60px', 
  marginBottom: '60px' 
};

const circleBtnStyle = { 
  width: '80px', 
  height: '80px', 
  borderRadius: '50%', 
  border: '2px solid #e0d6cc', 
  background: 'white', 
  cursor: 'pointer', 
  fontSize: '30px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  color: '#4a3728',
  fontWeight: 'bold',
  transition: '0.3s'
};

const monthLabelStyle = { 
  fontSize: '48px', 
  fontWeight: '900', 
  minWidth: '320px',
  color: '#4a3728',
  letterSpacing: '0.05em'
};

const printMainBtnStyle = { 
  padding: '30px 80px', 
  backgroundColor: '#4a3728', 
  color: 'white', 
  border: 'none', 
  borderRadius: '25px', 
  fontSize: '26px', 
  fontWeight: '900', 
  cursor: 'pointer', 
  width: '100%',
  boxShadow: '0 10px 25px rgba(74, 55, 40, 0.3)',
  transition: '0.3s'
};

const infoBoxStyle = {
  marginTop: '50px',
  padding: '25px',
  backgroundColor: '#fdfcfb',
  borderRadius: '20px',
  border: '1px solid #f2ede9',
  textAlign: 'left',
  color: '#7a6b5d',
  fontSize: '16px',
  lineHeight: '1.8'
};