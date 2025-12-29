import React, { useState } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase'; 

export default function UserList({ users, setUsers, deleteUserFromMaster, setPage, facilityName }) {
  const [newFloor, setNewFloor] = useState('1F');
  const [newRoom, setNewRoom] = useState('');
  const [newName, setNewName] = useState('');
  const [newKana, setNewKana] = useState(''); 
  const [newNotes, setNewNotes] = useState(''); 
  const [isBedCut, setIsBedCut] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortBy, setSortBy] = useState('room');

  const floors = ['1F', '2F', '3F', '4F', '5F'];

  // 🌟【クラウド同期版】ユーザー追加・更新
  const addUser = async () => {
    if (!newRoom || !newName) return;
    
    const userData = {
      floor: newFloor,
      room: newRoom,
      name: newName,
      kana: newKana,
      notes: newNotes,
      isBedCut: isBedCut, // 🌟 true/false で保存
      facility: facilityName
    };

    if (editingId) {
      // 【更新】
      const { error } = await supabase
        .from('members')
        .update(userData)
        .eq('id', editingId);

      if (!error) {
        setUsers(users.map(u => u.id === editingId ? { ...u, ...userData } : u));
        setEditingId(null);
      } else {
        alert('名簿の更新に失敗しました');
      }
    } else {
      // 🌟【新規】ID指定を外して、Supabaseの自動採番（identity）に任せる
      const { data, error } = await supabase
        .from('members')
        .insert([userData]) 
        .select();

      if (!error && data) {
        setUsers([...users, data[0]]);
      } else {
        console.error(error);
        alert('名簿への追加に失敗しました');
      }
    }
    
    // 入力欄をリセット
    setNewRoom(''); setNewName(''); setNewKana(''); setNewNotes(''); setIsBedCut(false);
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setNewFloor(user.floor || '1F');
    setNewRoom(user.room);
    setNewName(user.name);
    setNewKana(user.kana || ''); 
    setNewNotes(user.notes || ''); 
    setIsBedCut(!!user.isBedCut); // 🌟 確実にbooleanに変換
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('この利用者を名簿から削除しますか？')) {
      deleteUserFromMaster(id); 
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === 'room') {
      const valA = (a.floor || '') + a.room;
      const valB = (b.floor || '') + b.room;
      return valA.localeCompare(valB, undefined, { numeric: true });
    } else {
      const valA = a.kana || a.name || "";
      const valB = b.kana || b.name || "";
      return valA.localeCompare(valB, 'ja');
    }
  });

  return (
    <div style={{ width: '100%', backgroundColor: '#f0f7f4', minHeight: '100vh' }}>
      <Layout>
        <div style={{ padding: '24px 20px', paddingBottom: '140px' }}>
          <header style={{ marginBottom: '24px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2d6a4f' }}>あつまれ綺麗にする人</h1>
            <p style={{ fontSize: '13px', color: '#666' }}>{facilityName} 様 名簿管理</p>
          </header>

          <div style={formCardStyle}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>階数</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {floors.map(f => (
                  <button
                    key={f}
                    onClick={() => setNewFloor(f)}
                    style={{
                      ...miniSortBtnStyle,
                      flex: 'none',
                      padding: '8px 16px',
                      backgroundColor: newFloor === f ? '#2d6a4f' : 'white',
                      color: newFloor === f ? 'white' : '#2d6a4f',
                      border: '1px solid #2d6a4f',
                      fontSize: '14px'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>部屋番号</label>
              <input type="text" value={newRoom} onChange={(e) => setNewRoom(e.target.value)} style={inputStyle} placeholder="例: 101" />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>お名前</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} placeholder="例: 大造" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>ふりがな</label>
              <input type="text" value={newKana} onChange={(e) => setNewKana(e.target.value)} style={inputStyle} placeholder="例: だいぞう" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>備考（アレルギー、カットの好み等）</label>
              <textarea 
                value={newNotes} 
                onChange={(e) => setNewNotes(e.target.value)} 
                style={{...inputStyle, height: '80px', paddingTop: '10px', resize: 'none'}} 
                placeholder="例: 短め希望、肌が弱い等"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>ベッドカット</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setIsBedCut(false)} style={{ ...toggleBtnStyle, backgroundColor: !isBedCut ? '#52b69a' : '#e0efea', color: !isBedCut ? 'white' : '#52796f' }}>不要</button>
                <button onClick={() => setIsBedCut(true)} style={{ ...toggleBtnStyle, backgroundColor: isBedCut ? '#52b69a' : '#e0efea', color: isBedCut ? 'white' : '#52796f' }}>必要</button>
              </div>
            </div>

            <button onClick={addUser} style={submitBtnStyle}>
              {editingId ? '変更を保存する' : '名簿に追加する'}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setNewRoom(''); setNewName(''); setNewKana(''); setNewNotes(''); setIsBedCut(false); }} style={cancelEditBtnStyle}>
                キャンセル
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => setSortBy('room')} 
              style={{ ...miniSortBtnStyle, backgroundColor: sortBy === 'room' ? '#2d6a4f' : 'white', color: sortBy === 'room' ? 'white' : '#2d6a4f' }}
            >
              階・部屋順
            </button>
            <button 
              onClick={() => setSortBy('name')} 
              style={{ ...miniSortBtnStyle, backgroundColor: sortBy === 'name' ? '#2d6a4f' : 'white', color: sortBy === 'name' ? 'white' : '#2d6a4f' }}
            >
              名前順
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedUsers.map(user => (
              <div key={user.id} style={userRowStyle}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', color: '#94b0a7', fontWeight: 'bold' }}>
                    {user.floor} {user.room}号室
                  </span>
                  <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#2d6a4f' }}>{user.name} 様</div>
                  <div style={{ fontSize: '11px', color: '#76c893' }}>{user.kana || '　'}</div>
                  
                  {user.notes && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', padding: '6px', backgroundColor: '#f9f9f9', borderRadius: '6px', borderLeft: '3px solid #ccc' }}>
                      📝 {user.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  {user.isBedCut && (
                     <div style={{ fontSize: '10px', backgroundColor: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold' }}>ベッド</div>
                  )}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEdit(user)} style={editBtnStyle}>編集</button>
                    <button onClick={() => handleDelete(user.id)} style={delBtnStyle}>削除</button>
                  </div>
                </div>
              </div>
            ))}
            {sortedUsers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', backgroundColor: 'white', borderRadius: '20px' }}>名簿に登録はありません</div>
            )}
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('menu')}>←</button>
    </div>
  );
}

// デザイン定数は維持
const formCardStyle = { backgroundColor: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '24px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#2d6a4f', display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e0efea', boxSizing: 'border-box', fontSize: '16px', outline: 'none' };
const toggleBtnStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const submitBtnStyle = { width: '100%', backgroundColor: '#52b69a', color: 'white', padding: '18px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(82, 182, 154, 0.3)' };
const cancelEditBtnStyle = { width: '100%', backgroundColor: 'transparent', color: '#999', padding: '10px', marginTop: '10px', border: 'none', fontSize: '14px', cursor: 'pointer' };
const userRowStyle = { backgroundColor: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #e0efea', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const editBtnStyle = { backgroundColor: '#f0f7f4', color: '#52b69a', border: 'none', padding: '10px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const delBtnStyle = { backgroundColor: '#fff0f0', color: '#e53e3e', border: 'none', padding: '10px 14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const miniSortBtnStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #2d6a4f', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };