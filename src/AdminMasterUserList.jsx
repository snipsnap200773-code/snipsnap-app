import React, { useState } from 'react';
import { Layout } from './Layout';

// 🌟 bookingList を受け取れるように引数を追加
export default function AdminMasterUserList({ users, setUsers, setPage, facilityMaster, historyList = [], bookingList = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFacility, setFilterFacility] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter(u => {
    const userFacility = u.facility || "未設定";
    const matchesFacility = filterFacility ? userFacility === filterFacility : true;
    const matchesSearch = 
      u.name.includes(searchQuery) || 
      (u.kana && u.kana.includes(searchQuery));
      
    return matchesFacility && matchesSearch;
  });

  // 直近の施術日とメニューを取得
  const getLastVisit = (userName, facilityName) => {
    const visits = historyList
      .filter(h => h.name === userName && h.facility === facilityName)
      .sort((a, b) => b.date.localeCompare(a.date));
    return visits.length > 0 ? visits[0] : null;
  };

  // 🌟 過去の欠席回数を取得
  const getCancelCount = (userName, facilityName) => {
    return bookingList.filter(b => 
      b.facility === facilityName && 
      (b.members || []).some(m => m.name === userName && m.status === 'cancel')
    ).length;
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', width: '100%' }}>
      <Layout>
        <div style={{ padding: '20px 0', paddingBottom: '120px' }}>
          <header style={{ marginBottom: '30px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>全利用者マスター</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', fontWeight: 'bold' }}>
              全施設の入居者情報の施術履歴・備考を確認できます
            </p>
          </header>

          <div style={searchBoxStyle}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={labelStyle}>施設で絞り込む</label>
                <select 
                  value={filterFacility} 
                  onChange={(e) => setFilterFacility(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">全ての施設を表示</option>
                  {facilityMaster.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={labelStyle}>名前・ふりがなで検索</label>
                <input 
                  type="text" 
                  placeholder="例: 三土手" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '15px', fontSize: '15px', color: '#1e3a8a', fontWeight: 'bold', paddingLeft: '10px' }}>
            📊 該当者: {filteredUsers.length} 名
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '15px' 
          }}>
            {filteredUsers.map(u => {
              const lastVisit = getLastVisit(u.name, u.facility);
              return (
                <div key={u.id} style={userCardStyle} onClick={() => setSelectedUser(u)}>
                  <div style={{ flex: 1 }}>
                    <div style={facilityBadgeStyle}>{u.facility || "未設定"}</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', marginTop: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', marginRight: '10px', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                        {u.room}
                      </span>
                      {u.name} 様
                    </div>
                    {lastVisit && (
                      <div style={{ fontSize: '11px', color: '#059669', marginTop: '8px', fontWeight: 'bold' }}>
                        🗓 前回: {lastVisit.date} ({lastVisit.menu})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} style={detailBtnStyle}>詳細確認</button>
                  </div>
                </div>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div style={{ ...emptyCardStyle, gridColumn: '1 / -1' }}>
                該当する利用者は見つかりませんでした
              </div>
            )}
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>

      {/* 詳細ポップアップ */}
      {selectedUser && (() => {
        const lastVisit = getLastVisit(selectedUser.name, selectedUser.facility);
        const cancelCount = getCancelCount(selectedUser.name, selectedUser.facility);
        
        return (
          <div style={modalOverlayStyle} onClick={() => setSelectedUser(null)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '22px' }}>利用者詳細カルテ</h2>
                <button onClick={() => setSelectedUser(null)} style={closeXStyle}>×</button>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>氏名</span>
                  <span style={infoValueStyle}>{selectedUser.name} 様 ({selectedUser.kana || "ー"})</span>
                </div>
                <div style={infoRowStyle}>
                  <span style={infoLabelStyle}>施設 / 居室</span>
                  <span style={infoValueStyle}>{selectedUser.facility} / {selectedUser.room}号室</span>
                </div>
                
                <hr style={hrStyle} />

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={sectionTitleStyle}>🗓 直近の施術状況</h4>
                    {lastVisit ? (
                      <div style={lastVisitCardStyle}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{lastVisit.date}</div>
                        <div style={{ color: '#059669', marginTop: '4px' }}>{lastVisit.menu}</div>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', fontSize: '13px', padding: '10px' }}>履歴なし</div>
                    )}
                  </div>
                  
                  {/* 🌟 欠席回数表示（新設） */}
                  <div style={{ width: '100px' }}>
                    <h4 style={{ ...sectionTitleStyle, borderLeftColor: '#e11d48' }}>🚩 欠席</h4>
                    <div style={{ ...lastVisitCardStyle, backgroundColor: '#fff1f2', borderColor: '#fecdd3', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e11d48' }}>{cancelCount} <span style={{fontSize:'12px'}}>回</span></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={sectionTitleStyle}>📝 備考・施術メモ</h4>
                  <div style={notesAreaStyle}>
                    {selectedUser.notes ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{selectedUser.notes}</div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>備考はありません</span>
                    )}
                  </div>
                </div>
              </div>

              <button onClick={() => setSelectedUser(null)} style={modalCloseBtnStyle}>閉じる</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// 🎨 デザイン定数（既存維持）
const searchBoxStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '28px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', marginBottom: '25px', border: '1px solid #e2e8f0' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#1e3a8a', display: 'block', marginBottom: '10px', marginLeft: '4px' };
const inputStyle = { width: '100%', padding: '15px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#f8fafc', color: '#1e293b', outline: 'none', fontWeight: 'bold' };
const userCardStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '12px solid #cbd5e1', transition: '0.2s', border: '1px solid #f1f5f9', cursor: 'pointer' };
const facilityBadgeStyle = { display: 'inline-block', backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '11px', padding: '4px 14px', borderRadius: '20px', fontWeight: 'bold', letterSpacing: '0.5px' };
const detailBtnStyle = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' };
const emptyCardStyle = { textAlign: 'center', padding: '80px 20px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '32px', fontWeight: 'bold', border: '2px dashed #e2e8f0' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' };
const modalContentStyle = { backgroundColor: 'white', width: '90%', maxWidth: '500px', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' };
const modalHeaderStyle = { padding: '20px 25px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeXStyle = { background: 'none', border: 'none', fontSize: '32px', color: '#94a3b8', cursor: 'pointer' };
const sectionTitleStyle = { fontSize: '14px', color: '#1e3a8a', marginBottom: '10px', fontWeight: 'bold', borderLeft: '4px solid #1e3a8a', paddingLeft: '8px' };
const lastVisitCardStyle = { backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '16px', border: '1px solid #dcfce7', fontSize: '14px' };
const notesAreaStyle = { backgroundColor: '#f8fafc', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '100px', fontSize: '14px', color: '#1e293b', lineHeight: '1.6' };
const infoRowStyle = { marginBottom: '12px', display: 'flex', flexDirection: 'column' };
const infoLabelStyle = { fontSize: '12px', color: '#64748b', marginBottom: '4px' };
const infoValueStyle = { fontSize: '16px', fontWeight: 'bold', color: '#1e293b' };
const hrStyle = { border: 'none', borderTop: '1px solid #f1f5f9', margin: '20px 0' };
const modalCloseBtnStyle = { width: '100%', padding: '20px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };