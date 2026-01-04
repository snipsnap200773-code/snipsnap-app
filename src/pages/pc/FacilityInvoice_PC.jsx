import React, { useState, useMemo } from 'react';

export default function FacilityInvoice_PC({ historyList = [], user }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));

  // ログインユーザーの施設名（この施設だけのデータを対象にする）
  const myFacilityName = user?.name || "";

  // 🌟 価格取得ロジック（管理者用から移植：キーワード判定版）
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

  // 🌟 データ抽出・重複排除（管理者用ロジックをこの施設専用に適用）
  const sortedList = useMemo(() => {
    const rawData = historyList.filter(h => h.facility === myFacilityName && h.date.startsWith(monthSlash));
    
    // 重複排除（同じ日に同じ人が複数回記録されている場合、最新を保持）
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

  // 🌟 印刷実行関数（管理者用と全く同じ完璧なレイアウト）
  const openPrintWindow = () => {
    const displayMonth = selectedMonth.split('-')[1];
    const printTitle = `${myFacilityName}_${displayMonth}月度_利用明細書`;

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    
    let content = `
      <html>
        <head>
          <title>${printTitle}</title>
          <style>
            /* 🌟 余白0・自動レイアウト設定 */
            @page { size: A4; margin: 0; }
            body { font-family: sans-serif; margin: 0; padding: 0; background: white; color: black; }
            .full-list-page { 
              width: 210mm; 
              min-height: 297mm; 
              padding: 15mm 20mm; 
              box-sizing: border-box; 
            }
            .header-area { 
              display: flex; 
              justify-content: space-between; 
              border-bottom: 2px solid #000; 
              padding-bottom: 10px; 
              margin-bottom: 20px; 
            }
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
        <h2 style={{ color: '#1e293b', textAlign: 'center', margin: '0 0 20px 0' }}>📑 請求・利用明細書の確認</h2>
        
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

        <div style={actionArea}>
          {sortedList.length > 0 ? (
            <>
              <div style={statusBadge}>
                <strong>{myFacilityName}</strong> 様の {selectedMonth.split('-')[1]}月分 データを抽出しました
              </div>
              <button style={printMainBtn} onClick={openPrintWindow}>📄 明細書を発行（印刷・保存）</button>
            </>
          ) : (
            <div style={{...statusBadge, backgroundColor: '#f1f5f9', color: '#64748b'}}>
              {selectedMonth.split('-')[1]}月分の利用データはありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 デザイン設定（InvoiceManager_PCと統一）
const containerStyle = { padding: '40px', height: '100%', boxSizing: 'border-box' };
const controlPanel = { backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', maxWidth: '700px', margin: '0 auto' };
const yearRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '30px' };
const circleBtn = { width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px' };
const monthGrid = { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '40px' };
const monthBtn = { padding: '15px', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };
const actionArea = { marginTop: '20px', paddingTop: '30px', borderTop: '2px dashed #e2e8f0', textAlign: 'center' };
const statusBadge = { display: 'inline-block', padding: '10px 25px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '30px', marginBottom: '25px', fontSize: '15px' };
const printMainBtn = { padding: '20px 40px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', width: '100%' };