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
  
  const targetMonthlyDates = keepDates
    .filter(kd => kd.facility === facilityName && kd.date.replace(/\//g, '-').startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(kd => {
      const parts = kd.date.replace(/\//g, '-').split('-');
      return `${parseInt(parts[1])}/${parseInt(parts[2])}(${getDayName(kd.date)})`;
    });

  const dateListString = targetMonthlyDates.length > 0 ? targetMonthlyDates.join(' ・ ') : "（未定）";

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

  const handlePrint = () => {
    const printWin = window.open('', '_blank', 'width=1200,height=800');
    
    let content = `
      <html>
        <head>
          <title>${facilityName}_名簿</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; } /* 🌟 ブラウザの余白をしっかり確保 */
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
            
            .floor-block {
              page-break-after: always; /* 🌟 階が変わるたびに必ず新しい紙にする */
            }
            .floor-block:last-child { page-break-after: auto; }

            /* 🌟 2枚目に流れても「タイトル」と「フロア名」を自動で出す魔法の設定 */
            table { width: 100%; border-collapse: collapse; border: 3px solid #000; }
            
            /* theadを各ページの先頭に表示させる */
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
                <div class="footer">
                  ${facilityName} 様 / 印刷日: ${new Date().toLocaleDateString('ja-JP')}
                </div>
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
    <div style={{ padding: '80px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: '800px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <h2 style={{color: '#1e3a8a', fontSize: '28px', marginBottom: '10px'}}>掲示用名簿のプリント</h2>
        <p style={{color: '#64748b', fontSize: '16px', marginBottom: '40px'}}>階（フロア）ごとに自動でページを分けて作成します</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '50px', marginBottom: '50px' }}>
          <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() - 1, 1))}>◀</button>
          <span style={{ fontSize: '38px', fontWeight: 'bold', minWidth: '240px' }}>{year}年 {month}月度</span>
          <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() + 1, 1))}>▶</button>
        </div>

        <button style={printMainBtnStyle} onClick={handlePrint}>📄 名簿を発行（印刷・保存）</button>
      </div>
    </div>
  );
}

const circleBtnStyle = { width: '70px', height: '70px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const printMainBtnStyle = { padding: '25px 60px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '20px', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', width: '100%' };