import React, { useState } from 'react';

export default function AdminMasterUserList_PC({ users, facilityMaster, historyList = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("すべて");
  
  // 🌟 並べ替え状態管理
  const [sortBy, setSortBy] = useState('facility'); // デフォルト：施設順
  const [sortOrder, setSortOrder] = useState('asc');

  // 前回（最後に施術した日）を取得する関数
  const getLastVisitDate = (userName, facilityName) => {
    const userVisits = historyList
      .filter(h => h.name === userName && h.facility === facilityName)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return userVisits.length > 0 ? userVisits[0].date : null;
  };

  // 🌟 ソート切り替え関数
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // フィルタリングと並べ替えの実行
  const filteredAndSortedUsers = users.filter(u => {
    const matchSearch = u.name.includes(searchTerm) || 
                        (u.kana && u.kana.includes(searchTerm)) || 
                        String(u.room).includes(searchTerm);
    const matchFacility = selectedFacility === "すべて" || u.facility === selectedFacility;
    return matchSearch && matchFacility;
  }).sort((a, b) => {
    let valA, valB;
    
    if (sortBy === 'facility') {
      valA = a.facility || ""; valB = b.facility || "";
    } else if (sortBy === 'room') {
      // 階数と部屋番号を組み合わせて数値的に比較
      valA = (a.floor || '') + String(a.room).padStart(5, '0');
      valB = (b.floor || '') + String(b.room).padStart(5, '0');
    } else if (sortBy === 'name') {
      valA = a.kana || a.name || "";
      valB = b.kana || b.name || "";
    }

    const res = valA.localeCompare(valB, 'ja', { numeric: true });
    return sortOrder === 'asc' ? res : -res;
  });

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>👥 利用者名簿マスター (閲覧・ソート)</h2>
          <p style={{fontSize:'13px', color:'#64748b', marginTop:'5px'}}>全施設の情報を「部屋順」「氏名順」などで並べ替えて確認できます</p>
        </div>
        
        <div style={controlsStyle}>
          {/* 検索・絞り込み */}
          <input 
            type="text" 
            placeholder="お名前・部屋番号で検索..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={inputStyle}
          />
          <select 
            value={selectedFacility} 
            onChange={(e) => setSelectedFacility(e.target.value)} 
            style={selectStyle}
          >
            <option value="すべて">すべての施設</option>
            {facilityMaster.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
          </select>
          
          {/* 🌟 並べ替えボタン群 */}
          <div style={sortGroupStyle}>
            <button onClick={() => toggleSort('facility')} style={{...sortBtnStyle, backgroundColor: sortBy==='facility'?'#1e3a8a':'white', color: sortBy==='facility'?'white':'#1e3a8a'}}>
              施設順 {sortBy==='facility' && (sortOrder==='asc'?'▲':'▼')}
            </button>
            <button onClick={() => toggleSort('room')} style={{...sortBtnStyle, backgroundColor: sortBy==='room'?'#1e3a8a':'white', color: sortBy==='room'?'white':'#1e3a8a'}}>
              部屋順 {sortBy==='room' && (sortOrder==='asc'?'▲':'▼')}
            </button>
            <button onClick={() => toggleSort('name')} style={{...sortBtnStyle, backgroundColor: sortBy==='name'?'#1e3a8a':'white', color: sortBy==='name'?'white':'#1e3a8a'}}>
              氏名順 {sortBy==='name' && (sortOrder==='asc'?'▲':'▼')}
            </button>
          </div>

          <div style={countBadge}>{filteredAndSortedUsers.length} 名</div>
        </div>
      </header>

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>施設名</th>
              <th style={thStyle}>階 / 部屋</th>
              <th style={thStyle}>氏名 (カナ)</th>
              <th style={{...thStyle, textAlign:'center'}}>前回施術日</th>
              <th style={thStyle}>備考（アレルギー・好み等）</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map(u => {
              const lastVisit = getLastVisitDate(u.name, u.facility);
              return (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}><span style={facilityBadge}>{u.facility}</span></td>
                  <td style={tdStyle}>{u.floor} / {u.room}号室</td>
                  <td style={tdStyle}>
                    <div style={{fontWeight:'bold', fontSize:'16px'}}>{u.name} 様</div>
                    <div style={{fontSize:'11px', color:'#94a3b8'}}>{u.kana}</div>
                  </td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    <span style={{
                      ...visitBadgeStyle,
                      backgroundColor: lastVisit ? '#f0fdf4' : '#f8fafc',
                      color: lastVisit ? '#166534' : '#94a3b8'
                    }}>
                      {lastVisit ? lastVisit.replace(/-/g, '/') : '実績なし'}
                    </span>
                  </td>
                  <td style={{...tdStyle, fontSize:'13px', color:'#475569', lineHeight:'1.5', maxWidth:'400px'}}>
                    {u.notes || <span style={{color:'#cbd5e1'}}>---</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredAndSortedUsers.length === 0 && (
          <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>該当する利用者は見つかりません</div>
        )}
      </div>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { height: '100%', display: 'flex', flexDirection: 'column' };
const headerStyle = { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' };
const controlsStyle = { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' };
const inputStyle = { padding: '10px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', width: '220px', fontSize:'14px', outline:'none' };
const selectStyle = { padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor:'white', fontSize:'14px', outline:'none', cursor:'pointer' };
const countBadge = { backgroundColor: '#e2e8f0', color:'#1e3a8a', padding: '10px 15px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold' };

const sortGroupStyle = { display: 'flex', gap: '5px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '12px' };
const sortBtnStyle = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };

const tableWrapperStyle = { flex: 1, overflowY: 'auto', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const thStyle = { padding: '18px 20px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight:'700', position: 'sticky', top: 0, zIndex:10 };
const tdStyle = { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '15px', verticalAlign: 'middle' };
const trStyle = { transition: '0.2s', backgroundColor: '#fff' };

const facilityBadge = { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight:'bold' };
const visitBadgeStyle = { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', border: '1px solid currentColor' };