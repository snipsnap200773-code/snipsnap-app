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
          <h2 style={{margin:0, color: '#4a3728', fontSize: '28px'}}>👥 あつまれ綺麗にする人</h2>
          <p style={{fontSize:'16px', color:'#7a6b5d', marginTop: '6px', fontWeight: '500'}}>{facilityName} 様 入居者名簿</p>
        </div>
        <div style={sortBtnGroup}>
          <button onClick={() => toggleSort('room')} style={{...sortBtn, backgroundColor: sortBy==='room'?'#4a3728':'#fff', color: sortBy==='room'?'#fff':'#4a3728', borderColor: '#4a3728'}}>
            部屋順 {sortBy==='room' && (sortOrder==='asc'?'▲':'▼')}
          </button>
          <button onClick={() => toggleSort('name')} style={{...sortBtn, backgroundColor: sortBy==='name'?'#4a3728':'#fff', color: sortBy==='name'?'#fff':'#4a3728', borderColor: '#4a3728'}}>
            名前順 {sortBy==='name' && (sortOrder==='asc'?'▲':'▼')}
          </button>
        </div>
      </header>

      <div style={contentWrapper}>
        {/* --- 左側：登録・編集フォーム --- */}
        <aside style={formSideStyle}>
          <h3 style={{marginTop: 0, fontSize: '20px', color: '#5d4037', borderBottom: '2px solid #e0d6cc', paddingBottom: '12px', fontWeight: '800'}}>
            {editingId ? '📝 情報を変更' : '✨ 新しく登録'}
          </h3>
          
          <div style={formGroup}><label style={labelStyle}>階数</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {floors.map(f => (
                <button key={f} onClick={() => setNewFloor(f)} style={{...miniBtnStyle, backgroundColor: newFloor === f ? '#4a3728' : 'white', color: newFloor === f ? 'white' : '#4a3728', borderColor: '#4a3728'}}>{f}</button>
              ))}
            </div>
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>部屋番号</label>
            <input type="text" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: 101" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>お名前</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: 山田 花子" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>ふりがな</label>
            <input type="text" value={newKana} onChange={(e) => setNewKana(e.target.value)} style={{...inputStyle, width:'100%'}} placeholder="例: やまだ はなこ" />
          </div>

          <div style={formGroup}>
            <label style={labelStyle}>備考</label>
            <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} style={{...inputStyle, width: '100%', height: '100px', resize:'none'}} placeholder="カットの好み、注意点など" />
          </div>

          <div style={formGroup}><label style={labelStyle}>ベッドカット</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsBedCut(false)} style={{ ...toggleBtn, backgroundColor: !isBedCut ? '#2d6a4f' : '#f1f5f2', color: !isBedCut ? 'white' : '#2d6a4f', border: '2px solid #2d6a4f' }}>不要</button>
              <button onClick={() => setIsBedCut(true)} style={{ ...toggleBtn, backgroundColor: isBedCut ? '#2d6a4f' : '#f1f5f2', color: isBedCut ? 'white' : '#2d6a4f', border: '2px solid #2d6a4f' }}>必要</button>
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
                <th style={{...thStyle, width: '100px'}}>部屋</th>
                <th style={{...thStyle, width: '250px'}}>お名前</th>
                <th style={thStyle}>備考（スタッフ用メモ）</th>
                <th style={{...thStyle, width: '90px', textAlign:'center'}}>ベッド</th>
                <th style={{...thStyle, width: '160px', textAlign:'center'}}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={trStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f3f0'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{...tdStyle, fontWeight: '800', color: '#4a3728', fontSize: '18px'}}>{u.floor} {u.room}</td>
                  <td style={tdStyle}>
                    <div style={{fontWeight:'800', fontSize:'22px', color: '#2d1e14'}}>{u.name} 様</div>
                    <div style={{fontSize:'14px', color:'#8b5e3c', fontWeight: '600', marginTop: '2px'}}>{u.kana}</div>
                  </td>
                  <td style={{...tdStyle, color: '#5a4a3a', fontSize: '16px', lineHeight: '1.6'}}>{u.notes}</td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    {u.isBedCut && <span style={bedBadge}>必要</span>}
                  </td>
                  <td style={{...tdStyle, textAlign:'center'}}>
                    <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
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

// 🎨 スタイル設定（全体的にサイズアップ）
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', width: '100%', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '26px 35px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(74, 55, 40, 0.08)' };
const contentWrapper = { display: 'flex', gap: '25px', flex: 1, minHeight: 0, width: '100%' };
const sortBtnGroup = { display: 'flex', gap: '15px' };
const sortBtn = { padding: '12px 25px', borderRadius: '15px', border: '2px solid', fontWeight: '800', cursor: 'pointer', transition: '0.3s', fontSize: '16px' };

const formSideStyle = { width: '380px', minWidth: '380px', backgroundColor: 'white', padding: '35px', borderRadius: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #e0d6cc' };
const formGroup = { marginBottom: '25px' };
const labelStyle = { fontSize: '16px', fontWeight: '800', color: '#5d4037', display: 'block', marginBottom: '10px' };
const inputStyle = { padding: '16px', borderRadius: '15px', border: '2px solid #e0d6cc', outline: 'none', fontSize: '18px', boxSizing: 'border-box', transition: '0.2s', backgroundColor: '#faf9f8' };
const miniBtnStyle = { flex: 1, padding: '12px 0', borderRadius: '12px', border: '2px solid', fontSize: '15px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' };
const toggleBtn = { flex: 1, padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '800', cursor: 'pointer', transition: '0.2s' };
const submitBtnStyle = { width: '100%', backgroundColor: '#4a3728', color: 'white', padding: '18px', borderRadius: '20px', fontWeight: '800', border: 'none', cursor: 'pointer', marginTop: '12px', fontSize: '18px', boxShadow: '0 4px 10px rgba(74, 55, 40, 0.2)' };
const cancelEditBtnStyle = { width: '100%', backgroundColor: 'transparent', color: '#94a3b8', padding: '15px', border: 'none', fontSize: '16px', cursor: 'pointer', textDecoration: 'underline' };

const tableContainer = { flex: 1, backgroundColor: 'white', borderRadius: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflowY: 'auto', border: '1px solid #e0d6cc', width: '100%' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' }; 
const theadTrStyle = { backgroundColor: '#f9f7f5', borderBottom: '3px solid #e0d6cc', position: 'sticky', top: 0, zIndex: 1 };
const thStyle = { padding: '22px', fontSize: '17px', color: '#5d4037', fontWeight: '800' };
const trStyle = { borderBottom: '1px solid #f2ede9', transition: '0.2s' };
const tdStyle = { padding: '22px', verticalAlign: 'middle' };

const bedBadge = { backgroundColor: '#e8f5e9', color: '#2d6a4f', padding: '8px 15px', borderRadius: '10px', fontSize: '15px', fontWeight: '800', border: '2px solid #c8e6c9' };
const editBtn = { backgroundColor: '#f9f7f5', color: '#4a3728', border: '2px solid #a39081', padding: '12px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', transition: '0.2s' };
const delBtn = { backgroundColor: '#fff5f5', color: '#c62828', border: '2px solid #ef9a9a', padding: '12px 20px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px', transition: '0.2s' };