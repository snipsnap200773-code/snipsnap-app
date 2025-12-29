import React, { useState } from 'react';

export default function PrintUserList({ users, historyList, keepDates = [], facilityName, setPage }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  const pagedData = [];
  Object.keys(floorGroups).sort().forEach(floor => {
    const floorUsers = [...floorGroups[floor]].sort((a,b)=>a.room.toString().localeCompare(b.room.toString(), undefined, {numeric:true}));
    for (let i = 0; i < floorUsers.length; i += 12) {
      pagedData.push({ 
        floor, 
        members: floorUsers.slice(i, i + 12), 
        isFirstPageOfFloor: i === 0 
      });
    }
  });

  const getLastDate = (name) => {
    const visits = historyList.filter(h => h.name === name && h.facility === facilityName).sort((a, b) => b.date.localeCompare(a.date));
    return visits.length > 0 ? visits[0].date.split('/').slice(1).join('/') : 'ー';
  };

  return (
    <div className="print-standalone-root">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0 !important; }
          html, body, #root, .print-standalone-root {
            margin: 0 !important; padding: 0 !important;
            width: 297mm !important; height: auto !important;
            background: white !important; display: block !important;
          }
          .no-print { display: none !important; }
          .modal-overlay { background: none !important; position: static !important; padding: 0 !important; }
          .modal-content { box-shadow: none !important; padding: 0 !important; width: 297mm !important; margin: 0 !important; }
          
          .sheet-page {
            width: 297mm; height: 210mm; 
            padding: 8mm 15mm !important;
            box-sizing: border-box; 
            position: relative; 
            overflow: hidden !important;
          }
          .stripe-bg { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
        }

        .screen-ui { padding: 60px 20px; max-width: 600px; margin: 0 auto; text-align: center; font-family: sans-serif; }
        .control-card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; z-index: 10000;
          padding: 20px; overflow-y: auto;
        }
        .preview-header {
          position: sticky; top: 0; width: 270mm; background: #1e293b; padding: 15px;
          display: flex; gap: 20px; justify-content: center; z-index: 10001; border-radius: 12px 12px 0 0;
        }
        .btn-action { padding: 12px 25px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; color: white; }
      `}</style>

      <div className="no-print screen-ui">
        <div className="control-card">
          <h2 style={{color: '#1e293b'}}>あつまれ綺麗にしたい人 出力</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', margin: '30px 0' }}>
            <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() - 1, 1))}>◀</button>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>{year}年 {month}月度</span>
            <button style={circleBtnStyle} onClick={() => setViewDate(new Date(year, viewDate.getMonth() + 1, 1))}>▶</button>
          </div>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button style={backBtnStyle} onClick={() => setPage('menu')}>← 戻る</button>
            <button style={previewBtnStyle} onClick={() => setIsPreviewOpen(true)}>📑 プレビューを表示</button>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="preview-header no-print" onClick={e => e.stopPropagation()}>
            <button className="btn-action" style={{background: '#64748b'}} onClick={() => setIsPreviewOpen(false)}>✕ 閉じる</button>
            <button className="btn-action" style={{background: '#22c55e'}} onClick={() => window.print()}>🖨️ 印刷する</button>
          </div>

          <div className="modal-content" onClick={e => e.stopPropagation()} style={{background: 'white'}}>
            {pagedData.map((page, pIdx) => (
              <div 
                key={pIdx} 
                className="sheet-page"
                style={{
                  // 🌟 最後のページ (pIdx === pagedData.length - 1) でなければ改ページする
                  pageBreakAfter: pIdx === pagedData.length - 1 ? 'auto' : 'always'
                }}
              >
                {page.isFirstPageOfFloor ? (
                  <header style={headerStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <h1 style={{ margin: 0, fontSize: '24px' }}>美容室SnipSnap あつまれ綺麗にしたい人</h1>
                      <span style={{ fontSize: '20px' }}>フロア：<b style={{ fontSize: '36px' }}>{page.floor}</b></span>
                    </div>
                    <div style={dateLineStyle}>訪問予定日：{dateListString}</div>
                  </header>
                ) : (
                  <header style={{ marginBottom: '10px', height: '15mm', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid #ccc' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>フロア：{page.floor} (続き)</span>
                  </header>
                )}

                <table style={tableStyle}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', height: '11mm' }}>
                      <th style={{ ...thStyle, width: '12mm' }}>□</th>
                      <th style={{ ...thStyle, width: '18mm' }}>部屋</th>
                      <th style={{ ...thStyle, width: '55mm' }}>お名前</th>
                      <th style={{ ...thStyle, width: '70mm' }}>メニュー</th>
                      <th style={{ ...thStyle, width: '22mm' }}>前回</th>
                      <th style={thStyle}>備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.members.map((u, idx) => (
                      <tr key={u.id} className={idx % 2 === 1 ? 'stripe-bg' : ''} style={{ height: '13mm' }}>
                        <td style={tdStyle}></td>
                        <td style={tdStyle}>{u.room}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '20px', fontSize: '18px' }}>{u.name} 様</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '15px' }}>
                            <span>▢カット</span><span>▢カラー</span><span>▢パーマ</span>
                          </div>
                        </td>
                        <td style={tdStyle}>{getLastDate(u.name)}</td>
                        <td style={tdStyle}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
<footer className="no-print" style={footerStyle}>
  {facilityName} 様 / 印刷日: {new Date().toLocaleDateString('ja-JP')}
</footer>              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const backBtnStyle = { padding: '12px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white', fontWeight: 'bold' };
const previewBtnStyle = { padding: '12px 32px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const circleBtnStyle = { width: '50px', height: '50px', borderRadius: '50%', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontSize: '20px' };
const headerStyle = { marginBottom: '10px', borderBottom: '3.5px solid #000', paddingBottom: '8px' };
const dateLineStyle = { fontSize: '20px', marginTop: '10px', fontWeight: 'bold' };
const tableStyle = { border: '2.5px solid #000', width: '100%', borderCollapse: 'collapse' };
const thStyle = { border: '1px solid #000', padding: '8px 4px', fontSize: '15px', textAlign: 'center' };
const tdStyle = { border: '1px solid #000', padding: '0 4px', textAlign: 'center' };
const footerStyle = { position: 'absolute', bottom: '10mm', right: '15mm', fontSize: '12px', color: '#666' };