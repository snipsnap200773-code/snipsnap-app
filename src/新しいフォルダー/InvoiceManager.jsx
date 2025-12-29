import React, { useState } from 'react';
import { Layout } from './Layout';

export default function InvoiceManager({ historyList = [], setPage }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedFacility, setSelectedFacility] = useState("");
  const [isIndividualMode, setIsIndividualMode] = useState(false);

  const facilities = Array.from(new Set(historyList.map(h => h.facility))).filter(Boolean);
  const filteredList = historyList.filter(h => {
    const monthMatch = h.date.startsWith(selectedMonth.replace(/-/g, '/'));
    const facilityMatch = selectedFacility ? h.facility === selectedFacility : true;
    return monthMatch && facilityMatch;
  });

  const sortedList = [...filteredList].sort((a, b) => a.date.localeCompare(b.date));
  const totalAmount = sortedList.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const getDayName = (dateStr) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[new Date(dateStr.replace(/\//g, '-')).getDay()];
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#fff', paddingBottom: '100px' }}>
      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 0mm !important; /* ブラウザの既定余白をゼロに */
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 210mm !important; 
            overflow: visible !important; 
          }
          #root { display: block !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }

          /* 📄 A4全体明細：位置ズレと余白の修正 */
          .full-list-page {
            width: 210mm;
            height: 297mm;
            /* 🌟 上下左右の余白を均一（15mm）に設定 */
            padding: 0mm 60mm 20mm 10mm !important; 
            box-sizing: border-box;
            page-break-after: always;
            background: white !important;
            display: block !important;
            /* 🌟 右ズレ防止：左上の原点を固定 */
            position: relative !important;
          }
          
          .full-list-content {
            width: 180mm; /* 210mm - 15mm*2 */
            margin: 0 auto !important;
          }

          .stripe-row:nth-child(even) { 
            background-color: #f1f5f9 !important; 
            -webkit-print-color-adjust: exact; 
          }

          /* ✂️ 8分割モード（三土手さんの完璧な設定を死守） */
          .individual-print-overlay {
            position: absolute !important; top: 0 !important; left: 0 !important;
            width: 210mm !important; background: white !important; z-index: 9999999 !important;
          }
          .individual-page {
            display: flex; flex-wrap: wrap;
            width: 210mm; height: 297mm;
            page-break-after: always;
            align-content: flex-start;
          }
          .ticket-box {
            width: 105mm !important; height: 74.25mm !important;
            border: none !important; box-sizing: border-box;
            padding: 4mm 6mm 4mm 6mm; 
            display: flex; flex-direction: column;
            overflow: hidden;
          }
          .gray-bg { background-color: #eeeeee !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <Layout>
        <div className={isIndividualMode ? "individual-print-overlay" : ""} style={{ padding: isIndividualMode ? 0 : '20px', maxWidth: isIndividualMode ? 'none' : '850px', margin: isIndividualMode ? 0 : '0 auto' }}>
          
          <div className="no-print" style={filterBoxStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>対象月</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>施設絞り込み</label>
              <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)} style={inputStyle}>
                <option value="">全ての施設</option>
                {facilities.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => { setIsIndividualMode(false); setTimeout(() => window.print(), 100); }} style={printBtnStyle}>📄 A4全体明細を印刷</button>
            <button onClick={() => { setIsIndividualMode(true); setTimeout(() => window.print(), 100); }} style={{ ...printBtnStyle, backgroundColor: '#ed32ea' }}>✂️ 個別請求書(8分割)を発行</button>
          </div>

          {!isIndividualMode ? (
            /* --- 📄 A4全体明細 --- */
            <div id="full-list-container">
              {Array.from({ length: Math.ceil(sortedList.length / 24) }).map((_, pageIdx) => (
                <div key={pageIdx} className="full-list-page">
                  <div className="full-list-content">
                    {/* 🌟 1枚目のみヘッダーを表示 */}
                    {pageIdx === 0 ? (
                      <header style={{ marginBottom: '10px', borderBottom: '2px solid #333', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>請求明細書</h1>
                          <p style={{ fontSize: '18px', margin: '5px 0' }}>{selectedFacility} 御中</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px' }}>
                          <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>美容室SnipSnap</p>
                          <p style={{ margin: 0 }}>〒227-0055 横浜市青葉区つつじヶ丘36-22-102</p>
                          <p style={{ margin: 0 }}>TEL (045) 984-8808</p>
                        </div>
                      </header>
                    ) : (
                      /* 🌟 2枚目以降はヘッダーなしで上詰め（最小限の余白） */
                      <div style={{ height: '20mm' }}></div> 
                    )}

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '16px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #333', borderBottom: '1px solid #333' }}>
                          <th style={{ padding: '8px 5px', textAlign: 'left' }}>No.</th>
                          <th style={{ padding: '8px 5px', textAlign: 'left' }}>日付</th>
                          <th style={{ padding: '8px 5px', textAlign: 'left' }}>部屋</th>
                          <th style={{ padding: '8px 5px', textAlign: 'left' }}>名前</th>
                          <th style={{ padding: '8px 5px', textAlign: 'left' }}>メニュー</th>
                          <th style={{ padding: '8px 5px', textAlign: 'right' }}>金額</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedList.slice(pageIdx * 26, pageIdx * 26 + 26).map((item, idx) => (
                          <tr key={idx} className="stripe-row" style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px 5px' }}>{pageIdx * 26 + idx + 1}</td>
                            <td style={{ padding: '8px 5px' }}>{item.date.split('/')[2]}日({getDayName(item.date)})</td>
                            <td style={{ padding: '8px 5px' }}>{item.room}</td>
                            <td style={{ padding: '8px 5px', fontWeight: 'bold' }}>{item.name} 様</td>
                            <td style={{ padding: '8px 5px' }}>{item.menu}</td>
                            <td style={{ padding: '8px 5px', textAlign: 'right' }}>¥{item.price.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* 🌟 最後のページのみ合計と振込先を表示 */}
                    {pageIdx === Math.ceil(sortedList.length / 26) - 1 && (
                      <div style={{ marginTop: '10mm', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '24px' }}>ご請求合計：¥{totalAmount.toLocaleString()} (税込)</div>
                        <div style={{ marginTop: '10px', padding: '12px', border: '1px solid #333', borderRadius: '10px', fontSize: '13px', lineHeight: '1.6', textAlign: 'left', display: 'inline-block' }}>
                          <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>【お振込先】</p>
                          三菱UFJ銀行 中山支店 / 普通 ３５３８２１３ / ミドテ ダイゾウ
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* --- ✂️ 個別請求書（1ミリも変えていません） --- */
            <div id="individual-tickets">
              {Array.from({ length: Math.ceil(sortedList.length / 8) }).map((_, pageIdx) => (
                <div key={pageIdx} className="individual-page">
                  {sortedList.slice(pageIdx * 8, pageIdx * 8 + 8).map((item, idx) => (
                    <div key={idx} className="ticket-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '11pt', borderBottom: '1px solid #000' }}>領収書</div>
                        <div style={{ fontSize: '9pt', borderBottom: '1px solid #000', width: '25mm', textAlign: 'left' }}>
                          No.{String(pageIdx * 8 + idx + 1).padStart(3, '0')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', margin: '3mm 0' }}>
                        <div style={{ fontSize: '14pt', fontWeight: 'bold', borderBottom: '1px solid #000', display: 'inline-block', minWidth: '60mm', paddingBottom: '1mm' }}>
                          {item.name} 様
                        </div>
                      </div>
                      <div className="gray-bg" style={{ backgroundColor: '#eeeeee', textAlign: 'center', padding: '2mm', margin: '1mm 0', fontSize: '16pt', fontWeight: 'bold', letterSpacing: '2px', border: '0.1mm solid #ccc' }}>
                        ¥{item.price.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', borderBottom: '1px solid #000', margin: '1.5mm 0', fontSize: '10pt' }}>
                        <div style={{ width: '10mm' }}>但</div>
                        <div style={{ flex: 1, textAlign: 'center' }}>{item.menu} 代</div>
                      </div>
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5pt', borderBottom: '1px solid #ccc', paddingBottom: '0.5mm' }}>
                          <div>{item.date.split('/')[0]}年{item.date.split('/')[1]}月{item.date.split('/')[2]}日</div>
                          <div>上記正に領収いたしました。</div>
                        </div>
                        <div style={{ fontSize: '7pt', marginTop: '.5mm', lineHeight: '1.3' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>美容室SnipSnap</div>
                          <div>〒227-0055横浜市青葉区つつじヶ丘36-22-102</div>
                          <div>TEL (045) 984-8808</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          <button className="no-print floating-back-btn" onClick={() => setPage('admin-top')} style={{ left: '20px', bottom: '20px' }}>←</button>
        </div>
      </Layout>
    </div>
  );
}

const filterBoxStyle = { display: 'flex', gap: '10px', backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '12px', marginBottom: '30px' };
const labelStyle = { display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' };
const printBtnStyle = { flex: 1, padding: '15px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };