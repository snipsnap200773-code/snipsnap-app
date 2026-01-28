import React, { useState, useMemo } from 'react';

export default function FacilityInvoice_PC({ historyList = [], user }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));

  const myFacilityName = user?.name || "";

  // 🌟 ロジック保持：価格取得
  const getPriceForMenu = (menuName) => {
    if (!menuName) return 0;
    const basePrices = {
      'カット': 1600, 'カラー': 5600, 'パーマ': 4600,
      'カラー（リタッチ）': 4600, 'カラー（全体）': 5600
    };
    if (basePrices[menuName]) return basePrices[menuName];
    if (menuName.includes('カラー')) {
      if (menuName.includes('カット')) {
        return (menuName.includes('リタッチ') || menuName.includes('(リ)')) ? 6100 : 7100;
      }
      return (menuName.includes('リタッチ') || menuName.includes('(リ)')) ? 4600 : 5600;
    }
    if (menuName.includes('カット')) return basePrices['カット'];
    if (menuName.includes('パーマ')) return basePrices['パーマ'];
    return 0;
  };

  const getItemPrice = (item) => {
    return (item.price && Number(item.price) > 0) ? Number(item.price) : getPriceForMenu(item.menu);
  };

  const monthSlash = selectedMonth.replace(/-/g, '/');

  // 🌟 ロジック保持：データ抽出・重複排除
  const sortedList = useMemo(() => {
    const rawData = historyList.filter(h => h.facility === myFacilityName && h.date.startsWith(monthSlash));
    const uniqueMap = new Map();
    rawData.forEach(item => {
      const key = `${item.date}-${item.name}`;
      uniqueMap.set(key, item);
    });
    return Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
    });
  }, [historyList, myFacilityName, monthSlash]);

  const totalAmount = sortedList.reduce((sum, item) => sum + getItemPrice(item), 0);
  const getDayName = (dateStr) => ['日', '月', '火', '水', '木', '金', '土'][new Date(dateStr.replace(/\//g, '-')).getDay()];

  // 🌟 ロジック保持：印刷実行（中身は一切変えていません）
  const openPrintWindow = () => {
    const displayMonth = selectedMonth.split('-')[1];
    const printTitle = `${myFacilityName}_${displayMonth}月度_利用明細書`;
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    let content = `
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; color: black; }
            .full-list-page { width: 210mm; min-height: 297mm; padding: 15mm 20mm; box-sizing: border-box; }
            .header-area { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
            .stripe-bg { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
            h1 { font-size: 24px; margin: 0; }
            h2 { font-size: 18px; margin: 0; }
            .right { text-align: right; }
            tr { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="full-list-page">
            <div class="header-area">
              <div><h1>${displayMonth}月度 請求明細書</h1><h2>${myFacilityName} 御中</h2></div>
              <div style="font-size:11px; text-align:right;"><strong>美容室SnipSnap</strong><br/>〒227-0055 横浜市青葉区つつじヶ丘36-22-102<br/>TEL (045) 984-8808</div>
            </div>
            <table>
              <thead>
                <tr><th>No</th><th>日付</th><th>部屋</th><th>名前</th><th>メニュー</th><th class="right">金額</th></tr>
              </thead>
              <tbody>
                ${sortedList.map((item, i) => `
                  <tr class="${i % 2 === 1 ? 'stripe-bg' : ''}">
                    <td>${i + 1}</td>
                    <td>${item.date.split('/')[2]}日(${getDayName(item.date)})</td>
                    <td>${item.room}</td>
                    <td><strong>${item.name} 様</strong></td>
                    <td>${item.menu}</td>
                    <td class="right">¥${getItemPrice(item).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top:20px; text-align:right; page-break-inside: avoid;">
              <div style="font-size:22px; font-weight:bold;">合計金額：¥${totalAmount.toLocaleString()} (税込)</div>
              <div style="margin-top:10px; border:1px solid #000; padding:10px; display:inline-block; text-align:left; font-size:12px;">
                <strong>【お振込先】</strong><br/>三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
    printWin.document.write(content);
    printWin.document.close();
  };

  return (
    <div style={containerStyle}>
      <div style={controlPanel}>
        <h2 style={{ color: '#4a3728', textAlign: 'center', margin: '0 0 30px 0', fontSize: '28px', fontWeight: '900' }}>
          📑 請求・利用明細書の確認
        </h2>
        
        <div style={yearRow}>
          <button style={circleBtn} onClick={() => setCurrentYear(y => y - 1)}>◀</button>
          <span style={{ fontSize: '32px', fontWeight: '900', color: '#4a3728', minWidth: '160px', textAlign: 'center' }}>
            {currentYear}年
          </span>
          <button style={circleBtn} onClick={() => setCurrentYear(y => y + 1)}>▶</button>
        </div>

        <div style={monthGrid}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
            const target = `${currentYear}-${m.toString().padStart(2, '0')}`;
            const active = selectedMonth === target;
            return (
              <button 
                key={m} 
                style={{
                  ...monthBtn, 
                  backgroundColor: active ? '#4a3728' : 'white', 
                  color: active ? 'white' : '#5d4037',
                  borderColor: active ? '#4a3728' : '#e0d6cc',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                }} 
                onClick={() => setSelectedMonth(target)}
              >{m}月</button>
            );
          })}
        </div>

        <div style={actionArea}>
          {sortedList.length > 0 ? (
            <>
              <div style={statusBadge}>
                <span style={{fontSize: '20px'}}>✅</span> <strong>{myFacilityName}</strong> 様の {selectedMonth.split('-')[1]}月分 データを抽出しました
              </div>
              <button style={printMainBtn} onClick={openPrintWindow}>
                📄 明細書を発行（印刷・保存）
              </button>
            </>
          ) : (
            <div style={{...statusBadge, backgroundColor: '#f9f7f5', color: '#a39081', border: '1px dashed #cbd5e1'}}>
              {selectedMonth.split('-')[1]}月分の利用データはありません
            </div>
          )}
        </div>
      </div>
      <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '30px', fontSize: '14px'}}>
        ※前月分以前のデータも、年・月を切り替えることでいつでも発行可能です。
      </p>
    </div>
  );
}

// 🎨 デザイン設定（特大文字・アンティーク調）
const containerStyle = { padding: '60px 40px', height: '100%', boxSizing: 'border-box', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const controlPanel = { 
  backgroundColor: 'white', 
  padding: '60px', 
  borderRadius: '40px', 
  boxShadow: '0 20px 60px rgba(74, 55, 40, 0.12)', 
  maxWidth: '850px', 
  margin: '0 auto',
  border: '1px solid #e2d6cc'
};

const yearRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '40px' };
const circleBtn = { 
  width: '60px', 
  height: '60px', 
  borderRadius: '50%', 
  border: '2px solid #e0d6cc', 
  backgroundColor: 'white', 
  cursor: 'pointer', 
  fontSize: '24px', 
  color: '#4a3728',
  transition: '0.3s',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontWeight: 'bold'
};

const monthGrid = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(4, 1fr)', // 6列から4列にして1つ1つを大きくしました
  gap: '15px', 
  marginBottom: '50px' 
};

const monthBtn = { 
  padding: '25px 10px', 
  border: '2px solid #e0d6cc', 
  borderRadius: '18px', 
  cursor: 'pointer', 
  fontWeight: '900', 
  fontSize: '22px', // 月の文字を特大に
  transition: '0.2s'
};

const actionArea = { 
  marginTop: '30px', 
  paddingTop: '40px', 
  borderTop: '3px dashed #f2ede9', 
  textAlign: 'center' 
};

const statusBadge = { 
  display: 'inline-block', 
  padding: '15px 35px', 
  backgroundColor: '#f0fdf4', 
  color: '#2d6a4f', 
  borderRadius: '40px', 
  marginBottom: '35px', 
  fontSize: '18px',
  fontWeight: '800',
  border: '1px solid #c8e6c9'
};

const printMainBtn = { 
  padding: '25px 50px', 
  backgroundColor: '#4a3728', 
  color: 'white', 
  border: 'none', 
  borderRadius: '20px', 
  fontSize: '24px', // 発行ボタンを最大に
  fontWeight: '900', 
  cursor: 'pointer', 
  boxShadow: '0 10px 25px rgba(74, 55, 40, 0.3)', 
  width: '100%',
  transition: '0.3s'
};