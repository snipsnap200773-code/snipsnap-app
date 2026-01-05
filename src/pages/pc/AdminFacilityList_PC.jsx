import React, { useState, useEffect } from 'react';
// 🌟 パスを ../../ に修正
import { supabase } from '../../supabase';

// 選択肢の定義
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

export default function AdminFacilityList_PC({ dbFacilities = [], refreshAllData }) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // 🌟 フォーム用State (住所・電話番号・emailを完備)
  const [formData, setFormData] = useState({ 
    id: '', 
    name: '', 
    pw: '', 
    address: '', 
    tel: '', 
    email: '', 
    regular_rules: [] 
  });
  
  const [selDay, setSelDay] = useState(1); 
  const [selWeek, setSelWeek] = useState(1); 
  const [selMonthType, setSelMonthType] = useState(0); // 🌟 追加：月選択State

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
    
    if (!error) {
      alert("施設情報を保存しました");
      if (refreshAllData) await refreshAllData(); 
      resetForm();
    } else {
      console.error("Save Error:", error);
      alert("保存に失敗しました");
    }
    setLoading(false);
  };

  const handleDelete = async (f) => {
    if (!window.confirm(`施設名: ${f.name} を削除してもよろしいですか？`)) return;
    
    setLoading(true);
    const { error } = await supabase.from('facilities').delete().eq('id', f.id);
    if (!error) {
      if (refreshAllData) await refreshAllData(); 
    }
    setLoading(false);
  };

  const startEdit = (f) => {
    setEditingId(f.id);
    setFormData({ 
      ...f, 
      email: f.email || '', 
      address: f.address || '', 
      tel: f.tel || '', 
      regular_rules: f.regular_rules || [] 
    });
    setSelMonthType(0); // 編集開始時はリセット
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', pw: '', address: '', tel: '', email: '', regular_rules: [] });
    setSelMonthType(0);
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>🏢 全施設名簿マスター管理 (PC)</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>ログイン情報、連絡先、定期キープを一括管理します</p>
        </div>
      </header>

      <div style={contentWrapper}>
        {/* 左側：登録・編集フォーム */}
        <aside style={formSideStyle}>
          <h3 style={{marginTop: 0, fontSize: '16px', color: '#1e3a8a'}}>{editingId ? '📝 施設編集' : '✨ 新規施設登録'}</h3>
          <form onSubmit={handleSave} style={formStyle}>
            
            <div style={formGroup}>
              <label style={labelStyle}>基本情報（ID / 名前 / パスワード）</label>
              <input style={{...inputStyle, backgroundColor: editingId ? '#f1f5f9' : '#fff'}} value={formData.id} disabled={!!editingId} onChange={e => setFormData({...formData, id: e.target.value})} required placeholder="ID（半角英数）" />
              <input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="施設名" />
              <input style={inputStyle} value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} required placeholder="パスワード" />
              
              <label style={{...labelStyle, marginTop: '10px'}}>連絡先・通知設定</label>
              <input style={inputStyle} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="通知用メールアドレス" />
              <input style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="住所" />
              <input style={inputStyle} value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} placeholder="電話番号" />
            </div>

            <div style={keepConfigBox}>
              <div style={{fontWeight:'bold', fontSize:'13px', color:'#1e3a8a', marginBottom:'10px'}}>📅 定期キープの設定</div>
              
              {/* 🌟 追加：月の条件タイル */}
              <div style={tinyLabel}>月の条件</div>
              <div style={{...tileGrid, gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '10px'}}>
                {MONTH_TYPES.map(m => (
                  <button key={m.value} type="button" onClick={() => setSelMonthType(m.value)} 
                    style={{...tileBtn, backgroundColor: selMonthType === m.value ? '#1e3a8a' : '#fff', color: selMonthType === m.value ? '#fff' : '#444'}}>
                    {m.label}
                  </button>
                ))}
              </div>

              <div style={twoColInner}>
                <div style={innerCol}>
                  <div style={tinyLabel}>曜日</div>
                  <div style={tileGrid}>
                    {DAYS.map(d => (
                      <button key={d.value} type="button" onClick={() => setSelDay(d.value)} 
                        style={{...tileBtn, backgroundColor: selDay === d.value ? '#1e3a8a' : '#fff', color: selDay === d.value ? '#fff' : '#444'}}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={innerCol}>
                  <div style={tinyLabel}>週</div>
                  <div style={tileGrid}>
                    {WEEKS.map(w => (
                      <button key={w.value} type="button" onClick={() => setSelWeek(w.value)} 
                        style={{...tileBtn, backgroundColor: selWeek === w.value ? '#1e3a8a' : '#fff', color: selWeek === w.value ? '#fff' : '#444'}}>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
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
                {(!formData.regular_rules || formData.regular_rules.length === 0) && <div style={emptyNote}>定期ルールなし</div>}
              </div>
            </div>

            <div style={{display:'flex', gap:'10px'}}>
              <button type="submit" disabled={loading} style={submitBtnStyle}>{loading ? '保存中...' : '情報を保存する'}</button>
              {editingId && <button type="button" onClick={resetForm} style={cancelBtnStyle}>キャンセル</button>}
            </div>
          </form>
        </aside>

        {/* 右側：施設一覧テーブル */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadTrStyle}>
                <th style={thStyle}>施設名 / 住所・電話</th>
                <th style={thStyle}>ログイン・通知先</th>
                <th style={thStyle}>定期キープ</th>
                <th style={{...thStyle, textAlign:'center'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {dbFacilities.map(f => (
                <tr key={f.id} style={trStyle}>
                  <td style={tdStyle}>
                    <div style={{fontWeight:'bold', color: '#1e293b'}}>{f.name}</div>
                    <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>📍 {f.address || '住所未登録'}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>📞 {f.tel || '電話未登録'}</div>
                  </td>
                  <td style={tdTDStyle}>
                    <div style={idLabel}>ID: {f.id} / PW: {f.pw}</div>
                    <div style={{fontSize:'12px', color: f.email ? '#3b82f6' : '#94a3b8', marginTop:'4px'}}>
                      📧 {f.email || 'メール未登録'}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                      {f.regular_rules?.map((r, i) => (
                        <span key={i} style={ruleBadgeSimple}>
                          {r.monthType === 1 ? '奇数 ' : r.monthType === 2 ? '偶数 ' : ''}
                          {WEEKS.find(w => w.value === r.week)?.label}{DAYS.find(d=>d.value===r.day)?.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                      <button onClick={() => startEdit(f)} style={editBtn}>編集</button>
                      <button onClick={() => handleDelete(f)} style={delBtn}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定 (変更なし)
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { backgroundColor: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const contentWrapper = { display: 'flex', gap: '20px', flex: 1, minHeight: 0 };
const formSideStyle = { width: '400px', backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b' };
const keepConfigBox = { backgroundColor: '#f0f4f8', padding: '15px', borderRadius: '12px', border: '1px solid #d1d5db' };
const twoColInner = { display: 'flex', gap: '10px', marginBottom: '10px' };
const innerCol = { flex: 1 };
const tinyLabel = { fontSize: '10px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' };
const tileGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' };
const tileBtn = { padding: '8px 2px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const addConfirmBtn = { width: '100%', padding: '10px', backgroundColor: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', marginTop: '5px' };
const ruleListArea = { marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '40px', maxHeight: '100px', overflowY: 'auto' };
const ruleBadgeItem = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#e0f2f1', color: '#00695c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' };
const ruleDelBtn = { border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' };
const emptyNote = { fontSize: '11px', color: '#94a3b8', width: '100%', textAlign: 'center' };
const tableContainerStyle = { flex: 1, backgroundColor: 'white', borderRadius: '15px', border: '1px solid #e2e8f0', overflowY: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadTrStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 };
const thStyle = { padding: '15px 20px', fontSize: '13px', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };
const tdTDStyle = { padding: '15px 20px', verticalAlign: 'middle' }; //  typo修正用
const ruleBadgeSimple = { backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #e2e8f0' };
const idLabel = { fontSize: '12px', color: '#1e3a8a', fontWeight: 'bold' };
const editBtn = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#fff' };
const delBtn = { padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: '#fff1f2', color: '#e11d48' };
const submitBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle = { padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };