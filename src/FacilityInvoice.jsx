import React, { useState } from 'react';

// 🌟 bookingList を受け取れるように引数を追加
export default function FacilityInvoice({ historyList = [], bookingList = [], user, setPage }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const myFacilityName = user?.name || "";

  // 1. 指定された月のデータをフィルタリング（実際に施術した人）
  const filteredList = historyList.filter(h => {
    const monthMatch = h.date.startsWith(selectedMonth.replace(/-/g, '/'));
    const facilityMatch = h.facility === myFacilityName;
    return monthMatch && facilityMatch;
  });

  // 2. 🌟 欠席者をフィルタリング（金額には含めない参考情報）
  const cancelList = bookingList.filter(b => {
    const monthMatch = b.date.startsWith(selectedMonth);
    const facilityMatch = b.facility === myFacilityName;
    return monthMatch && facilityMatch;
  }).flatMap(b => (b.members || []).filter(m => m.status === 'cancel').map(m => ({ ...m, date: b.date })));

  // 3. ソート（日付順 ＞ 部屋順）
  const sortedList = [...filteredList].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  });

  const totalAmount = sortedList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr.replace(/\//g, '-'));
    return isNaN(d) ? "" : days[d.getDay()];
  };

  return (
    <div className="invoice-standalone-root" style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0 !important; }
          html, body, #root, .invoice-standalone-root {
            margin: 0 !important; padding: 0 !important;
            width: 210mm !important; height: auto !important;
            background: white !important; display: block !important;
          }
          .no-print { display: none !important; }
          .modal-overlay { background: none !important; position: static !important; padding: 0 !important; }
          .modal-content { 
            box-shadow: none !important; padding: 0 !important; width: 210mm !important; 
            max-width: none !important; height: auto !important; margin: 0 !important; 
          }
          .full-list-page {
            width: 210mm; min-height: 297mm; padding: 10mm 15mm 20mm 15mm !important;
            box-sizing: border-box; page-break-after: always; position: relative; overflow: hidden !important;
          }
          .data-row { height: 9mm !important; page-break-inside: avoid; }
          .stripe-bg { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
        }

        .screen-ui { padding: 40px 20px; max-width: 700px; margin: 0 auto; font-family: sans-serif; }
        .control-card { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .year-nav { display: flex; align-items: center; justify-content: center; gap: 40px; margin-bottom: 25px; }
        .year-btn { padding: 10px 25px; background: #f1f5f9; border: none; border-radius: 12px; cursor: pointer; font-size: 20px; font-weight: bold; }
        .month-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
        .toggle-btn { padding: 14px; border: 1px solid #cbd5e1; border-radius: 12px; background: white; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s; }
        .toggle-btn.active { background: #1e3a8a; color: white; border-color: #1e3a8a; box-shadow: 0 4px 12px rgba(30,58,138,0.3); }
        
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; z-index: 10000;
          padding: 20px; overflow-y: auto;
        }
        .modal-content { background: white; position: relative; border-radius: 4px; }
        .preview-header {
          position: sticky; top: 0; width: 210mm; background: #333; padding: 15px;
          display: flex; gap: 15px; justify-content: center; z-index: 10001; border-radius: 8px 8px 0 0;
        }
        .btn-preview { padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; }
        .close-x { position: absolute; right: -50px; top: 0; color: white; font-size: 30px; cursor: pointer; border: none; background: none; }
        .floating-back-btn {
          position: fixed; bottom: 20px; left: 20px; width: 54px; height: 54px;
          background-color: #1e3a8a; color: white; border: none; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 24px;
          cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 999;
        }
      `}</style>

      {/* --- 📱 操作パネル --- */}
      <div className="no-print screen-ui">
        <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>
        
        <div className="control-card">
          <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#1e3a8a' }}>請求明細書 発行</h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>{myFacilityName} 様 専用ページ</p>

          <div className="year-nav">
            <button className="year-btn" onClick={() => setCurrentYear(y => y - 1)}>◀</button>
            <span style={{ fontSize: '26px' }}>{currentYear}年</span>
            <button className="year-btn" onClick={() => setCurrentYear(y => y + 1)}>▶</button>
          </div>

          <div className="month-grid">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
              const target = `${currentYear}-${m.toString().padStart(2, '0')}`;
              return (
                <button 
                  key={m} 
                  className={`toggle-btn ${selectedMonth === target ? 'active' : ''}`} 
                  onClick={() => setSelectedMonth(target)}
                >
                  {m}月
                </button>
              );
            })}
          </div>

          <button 
            style={{ width: '100%', padding: '18px', background: sortedList.length > 0 ? '#1e3a8a' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 'bold', cursor: sortedList.length > 0 ? 'pointer' : 'not-allowed' }}
            onClick={() => sortedList.length > 0 && setIsPreviewOpen(true)}
            disabled={sortedList.length === 0}
          >
            {sortedList.length > 0 ? `📑 請求明細を表示（${sortedList.length}件）` : '🚫 データがありません'}
          </button>
        </div>
      </div>

      {/* --- 🖼️ 請求書ポップアップ --- */}
      {isPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-header no-print" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setIsPreviewOpen(false)}>✕</button>
            <div style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>📄 請求明細書 プレビュー</div>
            <div style={{ width: '1px', background: '#666', margin: '0 20px' }}></div>
            <button className="btn-preview" style={{ background: '#22c55e' }} onClick={() => window.print()}>🖨️ 印刷 / 保存</button>
          </div>

          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div id="print-area-full">
              {Array.from({ length: Math.max(1, Math.ceil(sortedList.length / 24)) }).map((_, pageIdx) => (
                <div key={pageIdx} className="full-list-page">
                  {pageIdx === 0 ? (
                    <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', marginBottom: '15px', paddingBottom: '5px' }}>
                      <div><h1 style={{ margin: 0, fontSize: '24px' }}>請求明細書</h1><h2 style={{ margin: 0, fontSize: '18px' }}>{myFacilityName} 御中</h2></div>
                      <div style={{ textAlign: 'right', fontSize: '11px' }}><strong>美容室SnipSnap</strong><br/>〒227-0055 横浜市青葉区つつじヶ丘36-22-102<br/>TEL (045) 984-8808</div>
                    </header>
                  ) : (
                    <div style={{ height: '30mm' }}></div> 
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #000', height: '10mm' }}>
                        <th style={{ textAlign: 'left', width: '10mm' }}>No.</th>
                        <th style={{ textAlign: 'left', width: '22mm' }}>日付</th>
                        <th style={{ textAlign: 'left', width: '15mm' }}>部屋</th>
                        <th style={{ textAlign: 'left' }}>名前</th>
                        <th style={{ textAlign: 'left' }}>メニュー</th>
                        <th style={{ textAlign: 'right', width: '25mm' }}>金額</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedList.slice(pageIdx * 24, pageIdx * 24 + 24).map((item, idx) => (
                        <tr key={idx} className={`data-row ${idx % 2 === 1 ? 'stripe-bg' : ''}`} style={{ borderBottom: '1px solid #ddd' }}>
                          <td>{pageIdx * 24 + idx + 1}</td>
                          <td>{item.date.split('/')[2]}日({getDayName(item.date)})</td>
                          <td>{item.room}</td>
                          <td style={{ fontWeight: 'bold' }}>{item.name} 様</td>
                          <td>{item.menu}</td>
                          <td style={{ textAlign: 'right' }}>¥{item.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 🌟 最終ページに追加情報を表示 */}
                  {pageIdx === Math.ceil(sortedList.length / 24) - 1 && (
                    <div style={{ marginTop: '5mm' }}>
                      {/* 欠席者情報の表示（任意） */}
                      {cancelList.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
                          ※今月の欠席者（参考）: {cancelList.map(c => `${c.name}様(${c.date.split('-')[2]}日)`).join(', ')}
                        </div>
                      )}

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>合計金額：¥{totalAmount.toLocaleString()} (税込)</div>
                        <div style={{ marginTop: '10px', padding: '15px', border: '1px solid #000', borderRadius: '10px', textAlign: 'left', display: 'inline-block', fontSize: '13px' }}>
                          <strong>【お振込先】</strong><br/>三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}