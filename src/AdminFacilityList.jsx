import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase'; 

const DAYS = [
  { label: "月", value: 1 }, { label: "火", value: 2 }, { label: "水", value: 3 },
  { label: "木", value: 4 }, { label: "金", value: 5 }, { label: "土", value: 6 }, { label: "日", value: 0 }
];
const WEEKS = [
  { label: "第1週", value: 1 }, { label: "第2週", value: 2 }, { label: "第3週", value: 3 },
  { label: "第4週", value: 4 }, { label: "最終週", value: -1 }, { label: "最後から2番目", value: -2 }
];
// 🌟 追加：月の条件
const MONTH_TYPES = [
  { label: "毎月", value: 0 }, { label: "奇数月", value: 1 }, { label: "偶数月", value: 2 }
];

export default function AdminFacilityList({ setPage, refreshAllData }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({ 
    id: '', name: '', pw: '', email: '', address: '', tel: '', regular_rules: [] 
  });

  const [selDay, setSelDay] = useState(1);
  const [selWeek, setSelWeek] = useState(1);
  const [selMonthType, setSelMonthType] = useState(0); // 🌟 デフォルトは毎月

  const fetchFacilities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('facilities').select('*').order('created_at', { ascending: true });
    if (!error) setFacilities(data);
    setLoading(false);
  };

  useEffect(() => { fetchFacilities(); }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const addRule = () => {
    // 🌟 月タイプも含めて重複チェック
    const exists = formData.regular_rules?.some(r => r.day === selDay && r.week === selWeek && r.monthType === selMonthType);
    if (exists) return;
    const newRule = { day: selDay, week: selWeek, monthType: selMonthType, time: '09:00' };
    setFormData({ ...formData, regular_rules: [...(formData.regular_rules || []), newRule] });
  };

  const removeRule = (idx) => {
    const newRules = formData.regular_rules.filter((_, i) => i !== idx);
    setFormData({ ...formData, regular_rules: newRules });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('facilities').upsert(formData);
    if (error) {
      alert("保存に失敗しました。IDが重複している可能性があります。");
    } else {
      setIsModalOpen(false);
      if (refreshAllData) await refreshAllData(); 
      fetchFacilities();
      resetForm();
    }
    setLoading(false);
  };

  const handleDelete = async (f) => {
    if (!window.confirm(`施設名: ${f.name} を削除してもよろしいですか？`)) return;
    const { error } = await supabase.from('facilities').delete().eq('id', f.id);
    if (!error) {
      if (refreshAllData) await refreshAllData();
      fetchFacilities();
    }
  };

  const openEdit = (f) => {
    setEditingId(f.id);
    setFormData({ 
      ...f, 
      email: f.email || '', 
      address: f.address || '', 
      tel: f.tel || '', 
      regular_rules: f.regular_rules || [] 
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', pw: '', email: '', address: '', tel: '', regular_rules: [] });
    setSelMonthType(0);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <header style={{ marginBottom: '25px', textAlign: 'center', position: 'relative' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>全施設名簿マスター</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>契約施設の管理・通知設定</p>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} style={addBtnStyle}>＋ 新規登録</button>
          </header>

          {loading ? <p style={{textAlign:'center'}}>読込中...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {facilities.map((f) => (
                <div key={f.id} style={facilityCardStyle}>
                  <div style={cardHeaderStyle}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{f.name}</h2>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                        <span style={idBadgeStyle}>ID: {f.id}</span>
                        <span style={pwBadgeStyle}>PW: {f.pw}</span>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                      <button onClick={() => openEdit(f)} style={editIconBtnStyle}>編集</button>
                      <button onClick={() => handleDelete(f)} style={deleteIconBtnStyle}>削除</button>
                    </div>
                  </div>

                  <div style={{marginBottom:'15px'}}>
                    <div style={{fontSize:'11px', color:'#64748b', fontWeight:'bold', marginBottom:'4px'}}>定期キープ：</div>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                      {f.regular_rules?.map((r, i) => (
                        <span key={i} style={ruleBadgeSimple}>
                          {/* 🌟 月条件の表示を追加 */}
                          {r.monthType === 1 ? '奇数月 ' : r.monthType === 2 ? '偶数月 ' : ''}
                          {WEEKS.find(w => w.value === r.week)?.label}{DAYS.find(d=>d.value===r.day)?.label}曜
                        </span>
                      ))}
                      {(!f.regular_rules || f.regular_rules.length === 0) && <span style={{fontSize:'12px', color:'#cbd5e1'}}>設定なし</span>}
                    </div>
                  </div>
                  
                  <div style={infoContentStyle}>
                    <div style={infoItemStyle}>✉️ <span style={{color: '#3b82f6'}}>{f.email || "メールアドレス未登録"}</span></div>
                    <div style={infoItemStyle}>📍 <span>{f.address || "住所未登録"}</span></div>
                    <div style={infoItemStyle}>📞 <span>{f.tel || "電話未登録"}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>

      {isModalOpen && (
        <div style={modalOverlayStyle} onClick={handleOverlayClick}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginTop:0, color:'#1e3a8a', marginBottom:'15px'}}>{editingId ? "施設情報の編集" : "新規施設登録"}</h3>
            <form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', height: '100%', overflow:'hidden'}}>
              
              <div style={modalScrollArea}>
                <div style={{display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'20px'}}>
                  <label style={labelStyle}>施設ID
                    <input style={{...inputStyle, backgroundColor: editingId ? '#f1f5f9' : '#fff'}} value={formData.id} disabled={!!editingId} onChange={e => setFormData({...formData, id: e.target.value})} required placeholder="例: s1" />
                  </label>
                  <label style={labelStyle}>施設名
                    <input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="例: あおバの里" />
                  </label>
                  <label style={labelStyle}>パスワード
                    <input style={inputStyle} value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} required />
                  </label>
                  <label style={labelStyle}>通知用メールアドレス
                    <input style={inputStyle} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="example@gmail.com" />
                  </label>
                  <label style={labelStyle}>住所
                    <input style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="東京都町田市..." />
                  </label>
                  <label style={labelStyle}>電話番号
                    <input style={inputStyle} value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} placeholder="03-1234-5678" />
                  </label>

                  {/* 定期キープ設定エリア */}
                  <div style={keepConfigBox}>
                    <div style={{fontWeight:'bold', fontSize:'13px', color:'#1e3a8a', marginBottom:'8px'}}>📅 定期キープの設定</div>
                    
                    {/* 🌟 追加：月条件のタイル選択 */}
                    <div style={tinyLabel}>月の条件</div>
                    <div style={tileGrid}>
                      {MONTH_TYPES.map(m => (
                        <button key={m.value} type="button" onClick={() => setSelMonthType(m.value)} 
                          style={{...tileBtn, backgroundColor: selMonthType === m.value ? '#1e3a8a' : '#fff', color: selMonthType === m.value ? '#fff' : '#444'}}>
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <div style={{...tinyLabel, marginTop:'10px'}}>曜日を選択</div>
                    <div style={tileGrid}>
                      {DAYS.map(d => (
                        <button key={d.value} type="button" onClick={() => setSelDay(d.value)} 
                          style={{...tileBtn, backgroundColor: selDay === d.value ? '#1e3a8a' : '#fff', color: selDay === d.value ? '#fff' : '#444'}}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div style={{...tinyLabel, marginTop:'10px'}}>週を選択</div>
                    <div style={tileGrid}>
                      {WEEKS.map(w => (
                        <button key={w.value} type="button" onClick={() => setSelWeek(w.value)} 
                          style={{...tileBtn, backgroundColor: selWeek === w.value ? '#1e3a8a' : '#fff', color: selWeek === w.value ? '#fff' : '#444'}}>
                          {w.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={addRule} style={addConfirmBtn}>この組み合わせを追加 ➔</button>
                    
                    <div style={ruleListArea}>
                      {formData.regular_rules?.map((r, i) => (
                        <div key={i} style={ruleBadgeItem}>
                          <span>
                            {r.monthType === 1 ? '奇数 ' : r.monthType === 2 ? '偶数 ' : ''}
                            {WEEKS.find(w=>w.value===r.week)?.label}{DAYS.find(d=>d.value===r.day)?.label}曜
                          </span>
                          <button type="button" onClick={() => removeRule(i)} style={ruleDelBtn}>✕</button>
                        </div>
                      ))}
                      {(!formData.regular_rules || formData.regular_rules.length === 0) && <div style={emptyNote}>ルールなし</div>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={() => {setIsModalOpen(false); resetForm();}} style={{...modalBtnStyle, backgroundColor:'#e2e8f0', color:'#475569'}}>キャンセル</button>
                <button type="submit" style={{...modalBtnStyle, backgroundColor:'#1e3a8a', color:'white'}}>{loading ? '保存中...' : '保存する'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// デザインスタイル (既存のものを維持)
const facilityCardStyle = { backgroundColor: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: '10px solid #3b82f6' };
const cardHeaderStyle = { borderBottom: '2px solid #f8fafc', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const idBadgeStyle = { backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' };
const pwBadgeStyle = { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '11px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' };
const ruleBadgeSimple = { backgroundColor: '#e0f2f1', color: '#00695c', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' };
const infoContentStyle = { display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569', fontSize: '13px' };
const infoItemStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const addBtnStyle = { position: 'absolute', right: 0, top: 0, backgroundColor: '#1e3a8a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const editIconBtnStyle = { backgroundColor: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' };
const deleteIconBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '24px', width: '92%', maxWidth: '400px', maxHeight: '85vh', display:'flex', flexDirection:'column' };
const modalScrollArea = { flex: 1, overflowY: 'auto', paddingRight: '5px' };
const modalFooterStyle = { display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' };

const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginTop:'5px' };
const modalBtnStyle = { flex: 1, padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' };
const keepConfigBox = { backgroundColor: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1.5px solid #e2e8f0', marginTop: '10px' };
const tinyLabel = { fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '6px' };
const tileGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' };
const tileBtn = { padding: '10px 2px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const addConfirmBtn = { width: '100%', padding: '12px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '12px' };

const ruleListArea = { marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '40px', maxHeight: '100px', overflowY: 'auto' };
const ruleBadgeItem = { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e0f2f1', color: '#00695c', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' };
const ruleDelBtn = { border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' };
const emptyNote = { fontSize: '12px', color: '#94a3b8', width: '100%', textAlign: 'center' };