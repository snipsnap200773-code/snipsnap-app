import React, { useState } from 'react';
import { supabase } from '../../supabase';

export default function FacilityUserList_PC({ users, facilityName, refreshAllData }) {
  const [newFloor, setNewFloor] = useState('1F');
  const [newRoom, setNewRoom] = useState('');
  const [newName, setNewName] = useState('');
  const [newKana, setNewKana] = useState(''); 
  const [newNotes, setNewNotes] = useState(''); 
  const [isBedCut, setIsBedCut] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [sortBy, setSortBy] = useState('room');
  const [sortOrder, setSortOrder] = useState('asc');

  const floors = ['1F', '2F', '3F', '4F', '5F'];

  const addUser = async () => {
    if (!newRoom || !newName) return;
    const userData = { floor: newFloor, room: newRoom, name: newName, kana: newKana, notes: newNotes, isBedCut, facility: facilityName };
    if (editingId) {
      const { error } = await supabase.from('members').update(userData).eq('id', editingId);
      if (!error) { setEditingId(null); refreshAllData(); }
    } else {
      const { error } = await supabase.from('members').insert([userData]);
      if (!error) refreshAllData();
    }
    setNewRoom(''); setNewName(''); setNewKana(''); setNewNotes(''); setIsBedCut(false);
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setNewFloor(user.floor || '1F');
    setNewRoom(user.room);
    setNewName(user.name);
    setNewKana(user.kana || ''); 
    setNewNotes(user.notes || ''); 
    setIsBedCut(!!user.isBedCut);
  };

  const handleDelete = async (id) => {
    if (window.confirm('この利用者を名簿から削除しますか？')) {
      const { error } = await supabase.from('members').delete().eq('id', id);
      if (!error) refreshAllData();
    }
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const filteredUsers = users
    .filter(u => u.facility === facilityName)
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'room') {
        valA = (a.floor || '') + a.room;
        valB = (b.floor || '') + b.room;
      } else {
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
          <h2 style={{margin:0, color: '#2d6a4f'}}>👥 あつまれ綺麗にする人（名簿管理）</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>{facilityName} 様 入居者一覧</p>
        </div>
        <div style={sortBtnGroup}>
          <button onClick={() => toggleSort('room')} style={{...sortBtn, backgroundColor: sortBy==='room'?'#2d6a4f':'#fff', color: sortBy==='room'?'#fff':'#2d6a4f'}}>
            部屋順 {sortBy==='room' && (sortOrder==='asc'?'▲':'▼')}
          </button>
          <button onClick={() => toggleSort('name')} style={{...sortBtn, backgroundColor: sortBy==='name'?'#2d6a4f':'#fff', color: sortBy==='name'?'#fff':'#2d6a4f'}}>
            名前順 {sortBy==='name' && (sortOrder==='asc'?'▲':'▼')}
          </button>
        </div>
      </header>

      <div style={contentWrapper}>
        {/* --- 左側：登録・編集フォーム --- */}
        <aside style={formSideStyle}>
          <h3 style={{marginTop: 0, fontSize: '16px', color: '#2d6a4f'}}>
            {editingId ? '📝 情報を変更する' : '✨ 新しく登録する'}
          </h3>
          
          <div style={formGroup}><label style={labelStyle}>階数</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {floors.map(f => (
                <button key={f} onClick={() => setNewFloor(f)} style={{...miniBtnStyle, backgroundColor: newFloor === f ? '#2d6a4f' : 'white', color: newFloor === f ? 'white' : '#2d6a4f'}}>{f}</button>
              ))}
            </div>
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>部屋番号</label>
            <input type="text" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: 101" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>お名前</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: お名前" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>ふりがな</label>
            {/* 🌟 width: '100%' で横幅を統一 */}
            <input type="text" value={newKana} onChange={(e) => setNewKana(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: だいぞう" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>備考</label>
            {/* 🌟 width: '100%' で横幅を統一 */}
            <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{...inputStyle, width: '100%', height: '80px', resize:'none'}} placeholder="カットの好みなど" />
          </div>

          <div style={formGroup}><label style={labelStyle}>ベッドカット</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setIsBedCut(false)} style={{ ...toggleBtn, backgroundColor: !isBedCut ? '#52b69a' : '#eef', color: !isBedCut ? 'white' : '#527' }}>不要</button>
              <button onClick={() => setIsBedCut(true)} style={{ ...toggleBtn, backgroundColor: isBedCut ? '#52b69a' : '#eef', color: isBedCut ? 'white' : '#527' }}>必要</button>
            </div>
          </div>

          <button onClick={addUser} style={submitBtnStyle}>{editingId ? '変更を保存' : '名簿に追加'}</button>
          {editingId && <button onClick={() => { setEditingId(null); setNewRoom(''); setNewName(''); setNewKana(''); setNewNotes(''); setIsBedCut(false); }} style={cancelEditBtnStyle}>キャンセル</button>}
        </aside>

        {/* --- 右側：一覧テーブル --- */}
        <div style={tableContainer}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadTrStyle}>
                <th style={{...thStyle, width: '80px'}}>部屋</th>
                <th style={{...thStyle, width: '220px'}}>お名前</th>
                <th style={thStyle}>備考（スタッフ用メモ）</th>
                <th style={{...thStyle, width: '50px', textAlign:'center'}}>ベッド</th>
                <th style={{...thStyle, width: '150px', textAlign:'center'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={trStyle}>
                  <td style={tdStyle}>{u.floor} {u.room}</td>
                  <td style={tdStyle}>
                    <div style={{fontWeight:'bold', fontSize:'16px'}}>{u.name} 様</div>
                    <div style={{fontSize:'11px', color:'#76c893'}}>{u.kana}</div>
                  </td>
                  <td style={{...tdStyle, color: '#444', lineHeight: '1.4'}}>{u.notes}</td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    {u.isBedCut && <span style={bedBadge}>必要</span>}
                  </td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                      <button onClick={() => startEdit(u)} style={editBtn}>編集</button>
                      <button onClick={() => handleDelete(u.id)} style={delBtn}>削除</button>
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

// 🎨 スタイル設定（変更なし：width: 100% を反映済み）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', width: '100%' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px 30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const contentWrapper = { display: 'flex', gap: '20px', flex: 1, minHeight: 0, width: '100%' };
const sortBtnGroup = { display: 'flex', gap: '10px' };
const sortBtn = { padding: '10px 20px', borderRadius: '10px', border: '1px solid #2d6a4f', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };

const formSideStyle = { width: '320px', minWidth: '320px', backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto' };
const formGroup = { marginBottom: '15px' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#2d6a4f', display: 'block', marginBottom: '5px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' };
const miniBtnStyle = { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #2d6a4f', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const toggleBtn = { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' };
const submitBtnStyle = { width: '100%', backgroundColor: '#2d6a4f', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px' };
const cancelEditBtnStyle = { width: '100%', backgroundColor: 'transparent', color: '#999', padding: '8px', border: 'none', fontSize: '13px', cursor: 'pointer' };

const tableContainer = { flex: 1, backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #e2e8f0', width: '100%' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' }; 
const theadTrStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 };
const thStyle = { padding: '18px 20px', fontSize: '14px', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f1f5f9', transition: '0.2s' };
const tdStyle = { padding: '15px 20px', verticalAlign: 'middle' };

const bedBadge = { backgroundColor: '#fff3cd', color: '#856404', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' };
const editBtn = { backgroundColor: '#f0f7f4', color: '#2d6a4f', border: '1px solid #2d6a4f', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const delBtn = { backgroundColor: '#fff0f0', color: '#e53e3e', border: '1px solid #e53e3e', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };