import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function AdminFacilityList_PC({ dbFacilities = [], refreshAllData }) {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // フォーム用State (スマホ版の項目をすべて網羅)
  const [formData, setFormData] = useState({ id: '', name: '', pw: '', address: '', tel: '' });

  // 1. 保存処理（スマホ版 AdminFacilityList のロジックを継承）
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('facilities').upsert(formData);
    
    if (error) {
      alert("保存に失敗しました。IDが重複しているか、通信エラーの可能性があります。");
    } else {
      alert(editingId ? "施設情報を更新しました" : "新しい施設を登録しました");
      resetForm();
      if (refreshAllData) refreshAllData(); // 親コンポーネントのデータを更新
    }
    setLoading(false);
  };

  // 2. 削除処理
  const handleDelete = async (f) => {
    if (!window.confirm(`施設名: ${f.name} (ID: ${f.id}) を削除してもよろしいですか？\n※この施設の予約データ等は残りますが、施設側がログインできなくなります。`)) return;
    
    const { error } = await supabase.from('facilities').delete().eq('id', f.id);
    if (!error) {
      if (refreshAllData) refreshAllData();
    } else {
      alert("削除に失敗しました");
    }
  };

  // 編集モード起動
  const startEdit = (f) => {
    setEditingId(f.id);
    setFormData(f);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // フォームリセット
  const resetForm = () => {
    setEditingId(null);
    setFormData({ id: '', name: '', pw: '', address: '', tel: '' });
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>🏢 全施設名簿マスター管理</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>契約施設のログイン情報（ID/PW）および基本情報の管理を行います</p>
        </div>
      </header>

      <div style={contentWrapper}>
        {/* --- 左側：登録・編集フォーム (固定幅) --- */}
        <aside style={formSideStyle}>
          <h3 style={{marginTop: 0, fontSize: '16px', color: '#1e3a8a'}}>
            {editingId ? '📝 施設情報を編集' : '✨ 新規施設を登録'}
          </h3>
          <form onSubmit={handleSave} style={formStyle}>
            <div style={formGroup}>
              <label style={labelStyle}>施設ID (ログイン用・変更不可)</label>
              <input 
                style={{...inputStyle, backgroundColor: editingId ? '#f1f5f9' : 'white'}} 
                value={formData.id} 
                disabled={!!editingId} 
                onChange={e => setFormData({...formData, id: e.target.value})} 
                required 
                placeholder="例: azumi01" 
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>施設名</label>
              <input 
                style={inputStyle} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
                placeholder="例: あずみ苑" 
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>パスワード</label>
              <input 
                style={inputStyle} 
                value={formData.pw} 
                onChange={e => setFormData({...formData, pw: e.target.value})} 
                required 
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>住所</label>
              <input 
                style={inputStyle} 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="東京都町田市..." 
              />
            </div>

            <div style={formGroup}>
              <label style={labelStyle}>電話番号</label>
              <input 
                style={inputStyle} 
                value={formData.tel} 
                onChange={e => setFormData({...formData, tel: e.target.value})} 
                placeholder="042-xxx-xxxx" 
              />
            </div>

            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
              <button type="submit" disabled={loading} style={submitBtnStyle}>
                {loading ? '処理中...' : (editingId ? '変更を保存' : '施設を追加する')}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={cancelBtnStyle}>
                  キャンセル
                </button>
              )}
            </div>
          </form>
        </aside>

        {/* --- 右側：一覧テーブル (可変幅) --- */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadTrStyle}>
                <th style={thStyle}>施設名</th>
                <th style={thStyle}>ログインID</th>
                <th style={thStyle}>パスワード</th>
                <th style={thStyle}>住所 / 電話番号</th>
                <th style={{...thStyle, textAlign:'center'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {dbFacilities.map(f => (
                <tr key={f.id} style={trStyle}>
                  <td style={{...tdStyle, fontWeight:'bold', color: '#1e293b'}}>{f.name}</td>
                  <td style={tdStyle}><span style={idBadge}>{f.id}</span></td>
                  <td style={tdStyle}>{f.pw}</td>
                  <td style={{...tdStyle, fontSize: '13px', color: '#475569'}}>
                    <div>📍 {f.address || "未登録"}</div>
                    <div style={{marginTop:'4px'}}>📞 {f.tel || "未登録"}</div>
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
          {dbFacilities.length === 0 && (
            <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>
              登録されている施設はありません。左のフォームから登録してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const contentWrapper = { display: 'flex', gap: '20px', flex: 1, minHeight: 0 };

// フォームサイド
const formSideStyle = { width: '320px', minWidth: '320px', backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#64748b' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' };
const submitBtnStyle = { flex: 2, padding: '12px', backgroundColor: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

// テーブルサイド
const tableContainerStyle = { flex: 1, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #e2e8f0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadTrStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 };
const thStyle = { padding: '18px 20px', fontSize: '13px', color: '#64748b', fontWeight: 'bold' };
const trStyle = { borderBottom: '1px solid #f1f5f9', transition: '0.2s' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };

const idBadge = { backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' };
const editBtn = { backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' };
const delBtn = { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' };