import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase'; 

export default function AdminFacilityList({ setPage }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  // フォーム用State
  const [formData, setFormData] = useState({ id: '', name: '', pw: '', address: '', tel: '' });

  // 1. 施設一覧の取得
  const fetchFacilities = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('facilities').select('*').order('created_at', { ascending: true });
    if (!error) setFacilities(data);
    setLoading(false);
  };

  useEffect(() => { fetchFacilities(); }, []);

  // 2. 保存処理（新規 or 更新）
  const handleSave = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('facilities').upsert(formData);
    if (error) {
      alert("保存に失敗しました。IDが重複している可能性があります。");
    } else {
      setIsModalOpen(false);
      fetchFacilities();
      setFormData({ id: '', name: '', pw: '', address: '', tel: '' });
    }
  };

  // 3. 削除処理
  const handleDelete = async (id) => {
    if (!window.confirm(`施設ID: ${id} を削除してもよろしいですか？\n※この施設の予約データ等は残りますが、ログインできなくなります。`)) return;
    const { error } = await supabase.from('facilities').delete().eq('id', id);
    if (!error) fetchFacilities();
  };

  // 編集モード起動
  const openEdit = (f) => {
    setFormData(f);
    setEditingData(f);
    setIsModalOpen(true);
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      <Layout>
        <div style={{ padding: '20px', paddingBottom: '100px' }}>
          <header style={{ marginBottom: '25px', textAlign: 'center', position: 'relative' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>全施設名簿マスター</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>契約施設の管理・ログイン情報設定</p>
            <button 
              onClick={() => { setFormData({ id: '', name: '', pw: '', address: '', tel: '' }); setEditingData(null); setIsModalOpen(true); }}
              style={addBtnStyle}
            >
              ＋ 新規施設登録
            </button>
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
                      <button onClick={() => handleDelete(f.id)} style={deleteIconBtnStyle}>削除</button>
                    </div>
                  </div>
                  
                  <div style={infoContentStyle}>
                    <div style={infoItemStyle}>
                      <span style={iconStyle}>📍</span>
                      <span>{f.address || "住所未登録"}</span>
                    </div>
                    <div style={infoItemStyle}>
                      <span style={iconStyle}>📞</span>
                      <span>{f.tel || "電話未登録"}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => window.location.href = `tel:${f.tel}`} style={actionBtnStyle('#3b82f6')}>📞 電話</button>
                    <button onClick={() => alert("LINE連携機能は準備中です")} style={actionBtnStyle('#10b981')}>💬 LINE</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>

      {/* 🌟 登録・編集用モーダル */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{marginTop:0}}>{editingData ? "施設情報の編集" : "新規施設登録"}</h3>
            <form onSubmit={handleSave} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <label style={labelStyle}>施設ID (ログイン用・変更不可)
                <input style={inputStyle} value={formData.id} disabled={!!editingData} onChange={e => setFormData({...formData, id: e.target.value})} required placeholder="例: s1" />
              </label>
              <label style={labelStyle}>施設名
                <input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="例: あずみ苑" />
              </label>
              <label style={labelStyle}>パスワード
                <input style={inputStyle} value={formData.pw} onChange={e => setFormData({...formData, pw: e.target.value})} required />
              </label>
              <label style={labelStyle}>住所
                <input style={inputStyle} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </label>
              <label style={labelStyle}>電話番号
                <input style={inputStyle} value={formData.tel} onChange={e => setFormData({...formData, tel: e.target.value})} />
              </label>
              <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{...modalBtnStyle, backgroundColor:'#e2e8f0', color:'#475569'}}>キャンセル</button>
                <button type="submit" style={{...modalBtnStyle, backgroundColor:'#1e3a8a', color:'white'}}>保存する</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// 🎨 デザイン
const facilityCardStyle = { backgroundColor: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', borderLeft: '10px solid #3b82f6' };
const cardHeaderStyle = { borderBottom: '2px solid #f8fafc', paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const idBadgeStyle = { backgroundColor: '#eff6ff', color: '#3b82f6', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' };
const pwBadgeStyle = { backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold' };
const infoContentStyle = { display: 'flex', flexDirection: 'column', gap: '10px', color: '#475569', fontSize: '14px' };
const infoItemStyle = { display: 'flex', alignItems: 'center', gap: '8px' };
const iconStyle = { fontSize: '16px' };
const actionBtnStyle = (color) => ({ flex: 1, padding: '12px', borderRadius: '14px', border: `1.5px solid ${color}`, backgroundColor: 'white', color: color, fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' });
const addBtnStyle = { position: 'absolute', right: 0, top: 0, backgroundColor: '#1e3a8a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const editIconBtnStyle = { backgroundColor: '#f1f5f9', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' };
const deleteIconBtnStyle = { backgroundColor: '#fff1f2', color: '#e11d48', border: 'none', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748b', fontWeight: 'bold' };
const modalBtnStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };