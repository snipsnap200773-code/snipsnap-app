import React, { useState, useEffect } from 'react';

export default function InvoiceManager({ historyList = [], setPage }) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().substring(0, 7));
  const [selectedFacility, setSelectedFacility] = useState("");
  const [isIndividualMode, setIsIndividualMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. 全施設リストの取得
  const facilities = Array.from(new Set(historyList.map(h => h.facility))).filter(Boolean);

  // 2. 選択中の「月」にデータが存在する施設をチェック
  const hasData = (facilityName) => {
    return historyList.some(h => 
      h.facility === facilityName && 
      h.date.startsWith(selectedMonth.replace(/-/g, '/'))
    );
  };

  // 3. フィルタリング・ソート
  const filteredList = historyList.filter(h => {
    const monthMatch = h.date.startsWith(selectedMonth.replace(/-/g, '/'));
    const facilityMatch = h.facility === selectedFacility;
    return monthMatch && facilityMatch;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  });

  const totalAmount = sortedList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/\//g, '-')).getDay()];
  };

  const handleFacilityClick = (f) => {
    if (!hasData(f)) return;
    setSelectedFacility(f);
    setIsPreviewOpen(true);
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

          .individual-page { 
            display: flex; flex-wrap: wrap; width: 210mm; height: 297mm; 
            page-break-after: always; align-content: flex-start !important; 
          }
          
          .ticket-box {
            width: 105mm !important; height: 74.25mm !important; box-sizing: border-box;
            padding: 4mm 6mm 4mm 6mm; display: flex; flex-direction: column; 
            overflow: hidden; flex-grow: 0 !important; flex-shrink: 0 !important;
          }
          .gray-bg { background-color: #eeeeee !important; -webkit-print-color-adjust: exact; }
        }

        .screen-ui { padding: 40px 20px; max-width: 700px; margin: 0 auto; font-family: sans-serif; }
        .control-card { background: white; padding: 30px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .year-nav { display: flex; align-items: center; justify-content: center; gap: 40px; margin-bottom: 25px; }
        .year-btn { padding: 10px 25px; background: #f1f5f9; border: none; border-radius: 12px; cursor: pointer; font-size: 20px; font-weight: bold; }
        .month-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
        .facility-group { display: flex; flex-wrap: wrap; gap: 10px; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7; }
        
        .toggle-btn { padding: 14px; border: 1px solid #cbd5e1; border-radius: 12px; background: white; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s; }
        .toggle-btn.active { background: #1e293b; color: white; border-color: #1e293b; box-shadow: 0 4px 12px rgba(30,41,59,0.3); }
        .toggle-btn.disabled { background: #e2e8f0 !important; color: #94a3b8 !important; border-color: #cbd5e1 !important; cursor: not-allowed !important; opacity: 0.7; }

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

        /* 🌟 フローティング戻るボタンのCSSを追加 */
        .floating-back-btn {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 54px;
          height: 54px;
          background-color: #1e293b;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 999;
          transition: transform 0.2s;
        }
        .floating-back-btn:active { transform: scale(0.9); }
      `}</style>

      {/* --- 📱 操作リモコン画面 --- */}
      <div className="no-print screen-ui">
        {/* 🌟 浮いている戻るボタンに変更 */}
        <button className="floating-back-btn" onClick={() => setPage('admin-top')}>
          ←
        </button>
        
        <div className="control-card">
          <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#1e293b' }}>請求書類 作成リモコン</h2>

          <div className="year-nav">
            <button className="year-btn" onClick={() => setCurrentYear(y => y - 1)}>◀</button>
            <span style={{ fontSize: '26px' }}>{currentYear}年</span>
            <button className="year-btn" onClick={() => setCurrentYear(y => y + 1)}>▶</button>
          </div>

          <div className="month-grid">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
              const target = `${currentYear}-${m.toString().padStart(2, '0')}`;
              return (
                <button key={m} className={`toggle-btn ${selectedMonth === target ? 'active' : ''}`} onClick={() => setSelectedMonth(target)}>{m}月</button>
              );
            })}
          </div>

          <div style={{ fontWeight: 'bold', color: '#475569', marginBottom: '10px' }}>施設名（データがある月のみ選択可能）：</div>
          <div className="facility-group">
            {facilities.map(f => {
              const isEnabled = hasData(f);
              return (
                <button 
                  key={f} 
                  className={`toggle-btn ${isEnabled ? '' : 'disabled'}`} 
                  onClick={() => handleFacilityClick(f)} 
                  disabled={!isEnabled}
                  style={{ minWidth: '130px', border: isEnabled ? '1px solid #3b82f6' : '1px solid #cbd5e1' }}
                >
                  {isEnabled ? '🏢 ' : '🚫 '}{f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- 🖼️ 請求書ポップアップ --- */}
      {isPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-header no-print" onClick={e => e.stopPropagation()}>
            <button className="close-x" onClick={() => setIsPreviewOpen(false)}>✕</button>
            <button className="btn-preview" style={{ background: isIndividualMode ? '#475569' : '#1e293b' }} onClick={() => setIsIndividualMode(false)}>📄 全体明細</button>
            <button className="btn-preview" style={{ background: isIndividualMode ? '#ed32ea' : '#475569' }} onClick={() => setIsIndividualMode(true)}>✂️ 8分割個別</button>
            <div style={{ width: '1px', background: '#666', margin: '0 10px' }}></div>
            <button className="btn-preview" style={{ background: '#22c55e' }} onClick={() => window.print()}>🖨️ 印刷 / PDF保存</button>
          </div>

          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* ... 印刷エリアの中身（変更なしのため省略） ... */}
            {!isIndividualMode ? (
              <div id="print-area-full">
                {Array.from({ length: Math.max(1, Math.ceil(sortedList.length / 24)) }).map((_, pageIdx) => (
                  <div key={pageIdx} className="full-list-page">
                    {pageIdx === 0 ? (
                      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', marginBottom: '15px', paddingBottom: '5px' }}>
                        <div><h1 style={{ margin: 0, fontSize: '24px' }}>請求明細書</h1><h2 style={{ margin: 0, fontSize: '18px' }}>{selectedFacility} 御中</h2></div>
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
                    {pageIdx === Math.ceil(sortedList.length / 24) - 1 && (
                      <div style={{ marginTop: '10mm', textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 'bold' }}>合計金額：¥{totalAmount.toLocaleString()} (税込)</div>
                        <div style={{ marginTop: '10px', padding: '15px', border: '1px solid #000', borderRadius: '10px', textAlign: 'left', display: 'inline-block', fontSize: '13px' }}>
                          <strong>【お振込先】</strong><br/>三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div id="print-area-individual">
                {Array.from({ length: Math.ceil(sortedList.length / 8) }).map((_, pageIdx) => (
                  <div key={pageIdx} className="individual-page">
                    {sortedList.slice(pageIdx * 8, pageIdx * 8 + 8).map((item, idx) => (
                      <div key={idx} className="ticket-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000' }}>
                          <span style={{ fontSize: '11pt' }}>領収書</span><span style={{ fontSize: '9pt' }}>No.{String(pageIdx * 8 + idx + 1).padStart(3, '0')}</span>
                        </div>
                        <div style={{ textAlign: 'center', margin: '4mm 0' }}>
                          <div style={{ borderBottom: '1px solid #000', minWidth: '60mm', display: 'inline-flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '1mm' }}>
                            <span style={{ fontSize: '9pt', color: '#666', marginRight: '3mm' }}>{item.room}</span>
                            <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>{item.name} 様</span>
                          </div>
                        </div>
                        <div className="gray-bg" style={{ textAlign: 'center', padding: '2mm', fontSize: '16pt', fontWeight: 'bold' }}>¥{item.price.toLocaleString()}</div>
                        <div style={{ borderBottom: '1px solid #000', margin: '1.5mm 0', fontSize: '10pt', display: 'flex' }}><span>但</span><span style={{ flex: 1, textAlign: 'center' }}>{item.menu} 代</span></div>
                        <div style={{ marginTop: 'auto', fontSize: '8.5pt' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc' }}><span>{item.date}</span><span>上記正に領収いたしました。</span></div>
                          <div style={{ fontSize: '7pt', marginTop: '1mm' }}><strong>美容室SnipSnap</strong><br/>〒227-0055横浜市青葉区つつじヶ丘36-22-102<br/>TEL (045) 984-8808</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}