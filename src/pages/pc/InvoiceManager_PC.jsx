import React, { useState, useMemo } from 'react';

export default function InvoiceManager_PC({ historyList = [], dbFacilities = [] }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));
  const [selectedFacility, setSelectedFacility] = useState("");

  const monthSlash = selectedMonth.replace(/-/g, '/');
  const filteredList = historyList.filter(h => h.facility === selectedFacility && h.date.startsWith(monthSlash));
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  });
  const totalAmount = sortedList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const hasData = (fName) => historyList.some(h => h.facility === fName && h.date.startsWith(monthSlash));
  const getDayName = (dateStr) => ['日', '月', '火', '水', '木', '金', '土'][new Date(dateStr.replace(/\//g, '-')).getDay()];

  // 🌟【最重要】別ウィンドウを開いて印刷する関数
  const openPrintWindow = (mode) => {
    const isIndividual = mode === 'individual';
    const displayMonth = selectedMonth.split('-')[1];
    const printTitle = `${selectedFacility}_${displayMonth}月度_請求書類`;

    // 1. 新しいウィンドウを開く
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    
    // 2. 印刷用コンテンツの構築（CSSもここに封じ込める）
    let content = `
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
            .full-list-page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; box-sizing: border-box; page-break-after: always; color: black; }
            .individual-page { display: flex; flex-wrap: wrap; width: 210mm; height: 297mm; page-break-after: always; align-content: flex-start; }
            .ticket-box { width: 105mm; height: 74.25mm; border: 0.1mm solid #000; box-sizing: border-box; padding: 5mm 8mm; display: flex; flex-direction: column; overflow: hidden; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
            .stripe-bg { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
            .gray-bg { background-color: #eee !important; -webkit-print-color-adjust: exact; }
            h1 { font-size: 24px; margin: 0; }
            h2 { font-size: 18px; margin: 0; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
    `;

    if (!isIndividual) {
      // --- 全体明細モード ---
      const pages = Math.ceil(sortedList.length / 24) || 1;
      for (let p = 0; p < pages; p++) {
        const rows = sortedList.slice(p * 24, p * 24 + 24);
        content += `
          <div class="full-list-page">
            <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px;">
              <div><h1>${displayMonth}月度 請求明細書</h1><h2>${selectedFacility} 御中</h2></div>
              <div style="font-size:11px; text-align:right;"><strong>美容室SnipSnap</strong><br/>〒227-0055 横浜市青葉区つつじヶ丘36-22-102<br/>TEL (045) 984-8808</div>
            </div>
            <table>
              <thead><tr><th>No</th><th>日付</th><th>部屋</th><th>名前</th><th>メニュー</th><th class="right">金額</th></tr></thead>
              <tbody>
                ${rows.map((item, i) => `
                  <tr class="${i % 2 === 1 ? 'stripe-bg' : ''}">
                    <td>${p * 24 + i + 1}</td>
                    <td>${item.date.split('/')[2]}日(${getDayName(item.date)})</td>
                    <td>${item.room}</td>
                    <td><strong>${item.name} 様</strong></td>
                    <td>${item.menu}</td>
                    <td class="right">¥${Number(item.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${p === pages - 1 ? `
              <div style="margin-top:20px; text-align:right;">
                <div style="font-size:22px; font-weight:bold;">合計金額：¥${totalAmount.toLocaleString()} (税込)</div>
                <div style="margin-top:10px; border:1px solid #000; padding:10px; display:inline-block; text-align:left; font-size:12px;">
                  <strong>【お振込先】</strong><br/>三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
    } else {
      // --- 8分割個別領収書モード ---
      const pages = Math.ceil(sortedList.length / 8) || 1;
      for (let p = 0; p < pages; p++) {
        const rows = sortedList.slice(p * 8, p * 8 + 8);
        content += `<div class="individual-page">`;
        rows.forEach((item, i) => {
          content += `
            <div class="ticket-box">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid #000; font-size:10pt;"><span>領収書</span><span>No.${String(p * 8 + i + 1).padStart(3, '0')}</span></div>
              <div style="text-align:center; margin:15px 0;"><div style="border-bottom:1px solid #000; display:inline-block; padding:0 20px;"><span style="font-size:14pt; font-weight:bold;">${item.room} ${item.name} 様</span></div></div>
              <div class="gray-bg" style="text-align:center; font-size:16pt; font-weight:bold; padding:5px;">¥${Number(item.price).toLocaleString()}</div>
              <div style="border-bottom:1px solid #000; margin:10px 0; font-size:10pt;">但 ${item.menu} 代</div>
              <div style="margin-top:auto; font-size:8pt;"><div style="display:flex; justify-content:space-between;"><span>${item.date}</span><span>上記正に領収いたしました。</span></div><strong>美容室SnipSnap</strong></div>
            </div>
          `;
        });
        content += `</div>`;
      }
    }

    content += `
          <script>
            window.onload = function() {
              window.print();
              // 印刷終了後に自動で閉じる場合は下を有効に
              // window.onafterprint = function() { window.close(); };
            };
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
        <h2 style={{ color: '#1e293b', textAlign: 'center', margin: '0 0 20px 0' }}>📑 請求書類 作成管理 (PC)</h2>
        
        {/* 年月選択 */}
        <div style={yearRow}>
          <button style={circleBtn} onClick={() => setCurrentYear(y => y - 1)}>◀</button>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentYear}年</span>
          <button style={circleBtn} onClick={() => setCurrentYear(y => y + 1)}>▶</button>
        </div>

        <div style={monthGrid}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
            const target = `${currentYear}-${m.toString().padStart(2, '0')}`;
            const active = selectedMonth === target;
            return (
              <button 
                key={m} 
                style={{...monthBtn, backgroundColor: active ? '#1e293b' : 'white', color: active ? 'white' : '#334155'}} 
                onClick={() => setSelectedMonth(target)}
              >{m}月</button>
            );
          })}
        </div>

        {/* 施設一覧 */}
        <h4 style={{ color: '#64748b', marginBottom: '15px' }}>施設名を選択してください：</h4>
        <div style={facilityGrid}>
          {dbFacilities.map(f => {
            const ok = hasData(f.name);
            const active = selectedFacility === f.name;
            return (
              <button 
                key={f.id} 
                style={{
                  ...facilityBtn, 
                  opacity: ok ? 1 : 0.4, 
                  backgroundColor: active ? '#3b82f6' : 'white',
                  color: active ? 'white' : '#1e293b',
                  borderColor: active ? '#3b82f6' : '#cbd5e1'
                }} 
                onClick={() => ok && setSelectedFacility(f.name)}
                disabled={!ok}
              >
                {ok ? '🏢' : '🚫'} {f.name}
              </button>
            );
          })}
        </div>

        {/* 印刷アクション */}
        {selectedFacility && (
          <div style={actionArea}>
            <div style={statusBadge}>
              <strong>{selectedFacility}</strong> 様の {selectedMonth.split('-')[1]}月分 データを抽出しました
            </div>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button style={printMainBtn} onClick={() => openPrintWindow('full')}>📄 全体明細を発行する</button>
              <button style={printSubBtn} onClick={() => openPrintWindow('individual')}>✂️ 8分割領収書を発行する</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { padding: '40px', height: '100%', boxSizing: 'border-box' };
const controlPanel = { backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', maxWidth: '900px', margin: '0 auto' };
const yearRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '30px' };
const circleBtn = { width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px' };
const monthGrid = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '40px' };
const monthBtn = { padding: '15px', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const facilityGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' };
const facilityBtn = { padding: '15px', border: '1.5px solid #cbd5e1', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', transition: '0.2s' };
const actionArea = { marginTop: '50px', paddingTop: '30px', borderTop: '2px dashed #e2e8f0', textAlign: 'center' };
const statusBadge = { display: 'inline-block', padding: '10px 25px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '30px', marginBottom: '25px', fontSize: '15px' };
const printMainBtn = { padding: '20px 40px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' };
const printSubBtn = { padding: '20px 40px', backgroundColor: '#ed32ea', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' };