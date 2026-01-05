import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { supabase } from './supabase';

export default function ScheduleNG({ 
  ngDates = [], 
  setNgDates, 
  keepDates = [], 
  bookingList = [], 
  historyList = [], 
  setPage, 
  checkDateSelectable 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const todayStr = new Date().toLocaleDateString('sv-SE'); 

  // --- 🌟 店舗設定用State ---
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [settings, setSettings] = useState({
    closed_days: [1], // デフォルト月曜
    allow_same_day_booking: true
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: lastDate }, (_, i) => i + 1);

  const colorPalette = [
    { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // 青
    { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }, // オレンジ
    { bg: '#dcfce7', text: '#15803d', border: '#86efac' }, // 緑
    { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // 紫
    { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }, // 黄
    { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }, // ピンク
    { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }, // グレー
  ];

  // 🌟 初期読み込み：店舗設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('system_settings').select('*').eq('id', 'main_config').single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  const getFacilityColor = (name) => {
    if (!name) return { bg: '#f8f9fa', text: '#cbd5e1', border: '#e2e8f0' };
    let charSum = 0;
    for (let i = 0; i < name.length; i++) charSum += name.charCodeAt(i);
    const colorIndex = charSum % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // 🌟 店舗設定を保存する
  const saveSettings = async (newSettings) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ id: 'main_config', ...newSettings, updated_at: new Date() });
    
    if (!error) {
      setSettings(newSettings);
      alert("店舗設定を更新しました。全施設のカレンダーに反映されます。");
      setIsSettingOpen(false);
    }
  };

  const toggleNG = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < todayStr) return;
    if (!checkDateSelectable(dateStr)) {
      alert("現在はスケジュール更新期間外、または規定の定休日です。");
      return;
    }

    const isKeep = keepDates.some(kd => kd.date === dateStr);
    const isConfirmed = bookingList.some(b => b.date === dateStr);
    
    if (isConfirmed) {
      alert("この日は既に予約が【確定】しているため、お休みに変更できません。");
      return;
    }
    if (isKeep) {
      alert("この日は施設が【キープ】しているため、お休みに設定できません。");
      return;
    }

    if (ngDates.includes(dateStr)) {
      const { error } = await supabase.from('ng_dates').delete().eq('date', dateStr);
      if (!error) setNgDates(ngDates.filter(d => d !== dateStr));
    } else {
      const { error } = await supabase.from('ng_dates').upsert({ date: dateStr });
      if (!error) setNgDates([...ngDates, dateStr]);
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f0f7f4' }}>
      <Layout>
        <div style={{ width: '100%', textAlign: 'center', paddingBottom: '40px' }}>
          <header style={headerWrapperStyle}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>
              スケジュール(NG日)管理
            </h1>
            {/* 🌟 店舗設定ボタン */}
            <button onClick={() => setIsSettingOpen(true)} style={settingBtnStyle}>
              ⚙️ 店舗設定
            </button>
          </header>

          <div style={calendarCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => changeMonth(-1)} style={navBtnStyle}>◀</button>
              <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '18px' }}>
                {year}年 {month + 1}月
              </div>
              <button onClick={() => changeMonth(1)} style={navBtnStyle}>▶</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                <div key={d} style={{ fontSize: '11px', color: '#bbb', marginBottom: '5px', textAlign: 'center' }}>{d}</div>
              ))}
              {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
              {days.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(year, month, day);
                const dayOfWeek = dateObj.getDay();
                
                const isPastOrToday = dateStr < todayStr;
                const isSelectable = checkDateSelectable(dateStr);
                const isNG = ngDates.includes(dateStr);
                
                // 🌟 システム定休日の判定
                const isSystemClosed = settings.closed_days.includes(dayOfWeek);

                const keepInfo = keepDates.find(kd => kd.date === dateStr);
                const confirmedInfo = bookingList.find(b => b.date === dateStr);
                const pastVisit = historyList.find(h => h.date.replace(/\//g, '-') === dateStr);
                const fName = pastVisit?.facility || confirmedInfo?.facility || keepInfo?.facility;
                const fColors = getFacilityColor(fName);

                return (
                  <div 
                    key={day} 
                    onClick={() => toggleNG(day)} 
                    style={{
                      padding: '4px 0', minHeight: '70px', borderRadius: '10px',
                      backgroundColor: isNG ? '#ef4444' : (isSystemClosed ? '#e2e8f0' : (fName ? fColors.bg : (isPastOrToday ? '#f8f9fa' : (isSelectable ? '#fff' : '#f1f1f1')))),
                      border: isNG ? '1px solid #ef4444' : (confirmedInfo || pastVisit ? `1px solid ${fColors.border}` : (keepInfo ? `2px dashed ${fColors.text}` : '1px solid #e2e8f0')),
                      cursor: (isPastOrToday || !isSelectable || keepInfo || confirmedInfo) ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', opacity: keepInfo ? 0.9 : 1
                    }}
                  >
                    <span style={{ 
                      fontWeight: 'bold', fontSize: '13px',
                      color: isNG ? '#fff' : (isSystemClosed ? '#94a3b8' : (fName ? fColors.text : (isPastOrToday ? '#cbd5e1' : '#1e3a8a')))
                    }}>
                      {day}
                    </span>
                    <div style={dayLabelStyle(isNG || isSystemClosed, fColors, isPastOrToday)}>
                      {isNG ? '×' : (
                        isSystemClosed ? '定休' : (
                          pastVisit ? `✅${pastVisit.facility}` : (
                            confirmedInfo ? confirmedInfo.facility : (
                              keepInfo ? `⏳${keepInfo.facility}` : (
                                !isSelectable ? '不可' : ''
                              )
                            )
                          )
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 凡例 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '20px', padding: '0 10px' }}>
             <div style={legendStyle('#64748b')}>※ 施設ごとに7色で色分け</div>
             <div style={legendStyle('#1e3a8a')}>⏳＝キープ中</div>
             <div style={legendStyle('#ef4444')}>■＝休み</div>
             <div style={legendStyle('#94a3b8')}>グレー＝定休日</div>
          </div>
        </div>
      </Layout>

      {/* 🌟 店舗設定モーダル */}
      {isSettingOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ color: '#1e3a8a', fontSize: '20px', marginBottom: '20px' }}>⚙️ 店舗基本設定</h2>
            
            <div style={settingSectionStyle}>
              <p style={settingLabelStyle}>1. 定休日の設定（毎週）</p>
              <div style={dayGridStyle}>
                {['日','月','火','水','木','金','土'].map((label, idx) => {
                  const isClosed = settings.closed_days.includes(idx);
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        const next = isClosed ? settings.closed_days.filter(d => d !== idx) : [...settings.closed_days, idx];
                        setSettings({...settings, closed_days: next});
                      }}
                      style={dayTileStyle(isClosed)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={settingSectionStyle}>
              <p style={settingLabelStyle}>2. 当日予約の受付</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setSettings({...settings, allow_same_day_booking: true})}
                  style={toggleBtnStyle(settings.allow_same_day_booking)}
                >
                  許可する
                </button>
                <button 
                  onClick={() => setSettings({...settings, allow_same_day_booking: false})}
                  style={toggleBtnStyle(!settings.allow_same_day_booking)}
                >
                  許可しない
                </button>
              </div>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                ※「許可しない」にすると、施設の画面では今日の日付が選択できなくなります。
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => setIsSettingOpen(false)} style={cancelBtnStyle}>キャンセル</button>
              <button onClick={() => saveSettings(settings)} style={saveBtnStyle}>設定を保存する</button>
            </div>
          </div>
        </div>
      )}

      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// 🎨 スタイル設定
const headerWrapperStyle = { marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 0 20px' };
const settingBtnStyle = { backgroundColor: '#fff', border: '1.5px solid #1e3a8a', color: '#1e3a8a', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' };
const calendarCardStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '20px', width: '95%', margin: '0 auto', boxSizing: 'border-box' };
const navBtnStyle = { border: 'none', backgroundColor: '#f1f5f9', color: '#1e3a8a', padding: '10px 14px', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' };
const legendStyle = (color) => ({ fontSize: '11px', color, fontWeight: 'bold' });
const dayLabelStyle = (isSpecial, fColors, isPast) => ({
  fontSize: '9px', marginTop: '4px', fontWeight: 'bold', width: '95%', textAlign: 'center', wordBreak: 'break-all', lineHeight: '1.1',
  color: isSpecial ? '#fff' : (fColors.text || (isPast ? '#cbd5e1' : '#1e3a8a'))
});

// 🌟 モーダルスタイル
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' };
const modalContentStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '25px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' };
const settingSectionStyle = { marginBottom: '25px', textAlign: 'left' };
const settingLabelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#475569', marginBottom: '10px' };
const dayGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' };
const dayTileStyle = (active) => ({
  padding: '10px 0', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? '#1e3a8a' : '#f1f5f9', color: active ? '#fff' : '#475569'
});
const toggleBtnStyle = (active) => ({
  flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? '#10b981' : '#f1f5f9', color: active ? '#fff' : '#475569'
});
const saveBtnStyle = { flex: 2, padding: '15px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px' };
const cancelBtnStyle = { flex: 1, padding: '15px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px' };