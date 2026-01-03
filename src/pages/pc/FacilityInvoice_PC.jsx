import React, { useState } from 'react';

export default function FacilityInvoice_PC({ historyList = [], bookingList = [], user }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const myFacilityName = user?.name || "";

  // 1. 指定された月のデータをフィルタリング
  const filteredList = historyList.filter(h => {
    const monthMatch = h.date.startsWith(selectedMonth.replace(/-/g, '/'));
    const facilityMatch = h.facility === myFacilityName;
    return monthMatch && facilityMatch;
  });

  // 2. 欠席者の抽出
  const cancelList = bookingList.filter(b => {
    const monthMatch = b.date.startsWith(selectedMonth);
    const facilityMatch = b.facility === myFacilityName;
    return monthMatch && facilityMatch;
  }).flatMap(b => (b.members || []).filter(m => m.status === 'cancel').map(m => ({ ...m, date: b.date })));

  // 3. 日付順にソート
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
  });

  const totalAmount = sortedList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const [yearPart, monthPart] = selectedMonth.split('-');
  const titleDateStr = `${yearPart}年${monthPart}月度`;

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr.replace(/\//g, '-'));
    return isNaN(d) ? "" : days[d.getDay()];
  };

  const itemsPerPage = 24;
  const totalPages = Math.max(1, Math.ceil(sortedList.length / itemsPerPage));

  return (
    <div style={{ padding: '20px' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #print-area-wrapper, #print-area-wrapper * { visibility: visible !important; }
          #print-area-wrapper { 
            position: absolute !important; left: 0 !important; top: 0 !important; width: 210mm !important;
            height: auto !important; overflow: visible !important; display: block !important;
          }
          .a4-page-sheet { page-break-after: always !important; border: none !important; box-shadow: none !important; margin: 0 !important; }
          .a4-page-sheet:last-child { page-break-after: auto !important; }
        }
      `}</style>

      {/* --- メイン操作パネル --- */}
      <header style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#1e3a8a' }}>📑 請求・利用明細書</h2>
      </header>

      <div style={panelCardStyle}>
        <div style={yearNavRow}>
          <button style={navCircleBtn} onClick={() => setCurrentYear(y => y - 1)}>◀</button>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{currentYear}年</span>
          <button style={navCircleBtn} onClick={() => setCurrentYear(y => y + 1)}>▶</button>
        </div>

        <div style={monthGridPc}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => {
            const target = `${currentYear}-${m.toString().padStart(2, '0')}`;
            const isActive = selectedMonth === target;
            return (
              <button 
                key={m} 
                style={isActive ? activeMonthStyle : normalMonthStyle} 
                onClick={() => setSelectedMonth(target)}
              >
                {m}月
              </button>
            );
          })}
        </div>

        <button 
          style={sortedList.length > 0 ? bigBlueBtn : bigDisabledBtn}
          onClick={() => sortedList.length > 0 && setIsPreviewOpen(true)}
        >
          {sortedList.length > 0 ? `📑 請求明細を表示（${sortedList.length}件）` : '🚫 データなし'}
        </button>
      </div>

      {/* --- 🌟 ポップアップ（モーダル）プレビューエリア --- */}
      {isPreviewOpen && (
        <div style={modalOverlay} onClick={() => setIsPreviewOpen(false)}>
          {/* ポップアップのヘッダー：ここだけ画面上部に固定 */}
          <div style={modalHeader} onClick={e => e.stopPropagation()}>
            <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>📄 {titleDateStr} 請求明細書プレビュー</div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button style={actionBtn('#22c55e')} onClick={() => window.print()}>🖨️ 印刷・保存</button>
              <button style={actionBtn('#64748b')} onClick={() => setIsPreviewOpen(false)}>✕ 閉じる</button>
            </div>
          </div>

          {/* スクロールする中身：ここがA4サイズで表示される */}
          <div style={modalScrollBody} onClick={e => e.stopPropagation()}>
            <div id="print-area-wrapper">
              {Array.from({ length: totalPages }).map((_, pageIdx) => (
                <div key={pageIdx} className="a4-page-sheet" style={a4Paper}>
                  <header style={invoiceHeader}>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '26px' }}>{titleDateStr} 請求明細書</h1>
                      <h2 style={recipientLine}>{myFacilityName} 御中</h2>
                    </div>
                    <div style={senderDetail}>
                      <strong>美容室SnipSnap</strong><br />
                      〒227-0055 横浜市青葉区つつじヶ丘36-22-102<br />
                      TEL (045) 984-8808 / 代表：三土手 大蔵
                    </div>
                  </header>

                  <table style={mainTable}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000' }}>
                        <th style={thStyle}>No.</th>
                        <th style={thStyle}>日付</th>
                        <th style={thStyle}>部屋</th>
                        <th style={thStyle}>お名前</th>
                        <th style={thStyle}>メニュー</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedList.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee', height: '9mm' }}>
                          <td>{pageIdx * itemsPerPage + idx + 1}</td>
                          <td>{item.date.split('/')[2]}日({getDayName(item.date)})</td>
                          <td>{item.room}</td>
                          <td style={{ fontWeight: 'bold' }}>{item.name} 様</td>
                          <td>{item.menu}</td>
                          <td style={{ textAlign: 'right' }}>¥{item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {pageIdx === totalPages - 1 && (
                    <div style={{ marginTop: 'auto' }}>
                      {cancelList.length > 0 && (
                        <div style={cancelInfo}>
                          ※今月の欠席者（参考）：{cancelList.map(c => `${c.name}様(${c.date.split('-')[2]}日)`).join(', ')}
                        </div>
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <div style={totalDisplay}>合計金額：¥{totalAmount.toLocaleString()} -</div>
                        <div style={bankBox}>
                          <strong>【お振込先】</strong><br />
                          三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
                        </div>
                      </div>
                    </div>
                  )}
                  {/* プレビュー中だけ見えるページ番号 */}
                  <div className="no-print" style={{ textAlign: 'center', fontSize: '12px', color: '#ccc', marginTop: '20px' }}>
                    --- Page {pageIdx + 1} / {totalPages} ---
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 スタイル（ポップアップ・スクロール最適化）
const panelCardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '700px' };
const yearNavRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', marginBottom: '30px' };
const navCircleBtn = { width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '18px' };
const monthGridPc = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '30px' };
const normalMonthStyle = { padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' };
const activeMonthStyle = { ...normalMonthStyle, backgroundColor: '#1e3a8a', color: 'white', borderColor: '#1e3a8a' };
const bigBlueBtn = { width: '100%', padding: '20px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' };
const bigDisabledBtn = { ...bigBlueBtn, backgroundColor: '#cbd5e1', cursor: 'not-allowed' };

// 🌟 ポップアップ用スタイル
const modalOverlay = { 
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
  backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000, 
  display: 'flex', flexDirection: 'column', alignItems: 'center' 
};
const modalHeader = { 
  width: '100%', padding: '15px 40px', backgroundColor: '#333', 
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10001 
};
const modalScrollBody = { 
  flex: 1, width: '100%', overflowY: 'auto', // ここで縦にスクロールさせる
  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' 
};

const a4Paper = { 
  width: '210mm', minHeight: '297mm', padding: '20mm', backgroundColor: 'white', 
  marginBottom: '40px', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column',
  boxShadow: '0 0 30px rgba(0,0,0,0.5)' // プレビュー中だけ影をつけて紙っぽく
};
const invoiceHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '40px' };
const recipientLine = { margin: '10px 0 0', fontSize: '20px', borderBottom: '2px solid #000', display: 'inline-block', minWidth: '250px' };
const senderDetail = { textAlign: 'right', fontSize: '12px', lineHeight: '1.6' };
const mainTable = { width: '100%', borderCollapse: 'collapse', marginBottom: '20px' };
const thStyle = { padding: '10px 5px', textAlign: 'left', fontSize: '14px' };
const cancelInfo = { fontSize: '11px', color: '#666', marginBottom: '15px', padding: '10px', backgroundColor: '#f9fafb' };
const totalDisplay = { fontSize: '24px', fontWeight: 'bold', borderBottom: '3px double #000', display: 'inline-block' };
const bankBox = { marginTop: '15px', padding: '15px', border: '1px solid #000', borderRadius: '8px', textAlign: 'left', display: 'inline-block', fontSize: '13px' };
const actionBtn = (color) => ({ padding: '10px 20px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' });