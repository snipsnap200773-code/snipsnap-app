import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function AdminScheduleNG_PC({ 
  ngDates = [], 
  setNgDates, 
  keepDates = [], 
  bookingList = [], 
  historyList = [],
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

  // 🌟 施設ごとのカラーパレット
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
    return colorPalette[charSum % colorPalette.length];
  };

  // 🌟 店舗設定を保存する
  const saveSettings = async (newSettings) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ id: 'main_config', ...newSettings, updated_at: new Date() });
    
    if (!error) {
      setSettings(newSettings);
      alert("店舗設定を更新しました。");
      setIsSettingOpen(false);
      // App.jsx側のrefreshAllDataを呼び出す仕組みが必要ですが、
      // ここではローカルの再描画で対応します。
    }
  };

  // 🌟【クラウド同期】NG日の切り替え
  const toggleNG = async (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();
    
    // ガードレール
    if (dateStr < todayStr) return;

    // システム定休日の場合はアラートを出してブロック
    if (settings.closed_days.includes(dayOfWeek)) {
      alert("この曜日はシステム設定で「定休日」に指定されています。設定を変更する場合は右上の設定ボタンからお願いします。");
      return;
    }

    if (checkDateSelectable && !checkDateSelectable(dateStr)) {
      alert("規定の定休日、または選択不可な期間です。");
      return;
    }

    const isKeep = keepDates.some(kd => kd.date === dateStr);
    const isConfirmed = bookingList.some(b => b.date === dateStr);
    
    if (isConfirmed) {
      alert("この日は既に予約が【確定】しているため、休みに変更できません。");
      return;
    }
    if (isKeep) {
      alert("この日は施設が【キープ】しているため、休みに設定できません。");
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
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={{margin:0, color: '#1e3a8a'}}>📅 予約受付(NG日)管理</h2>
          <p style={{fontSize:'14px', color:'#64748b'}}>日付をクリックして「美容室の休み(×)」を切り替えます</p>
        </div>
        <div style={{display:'flex', gap: '20px', alignItems: 'center'}}>
          <button onClick={() => setIsSettingOpen(true)} style={pcSettingBtnStyle}>
            ⚙️ 店舗基本設定
          </button>
          <div style={navGroup}>
            <button onClick={() => changeMonth(-1)} style={iconBtnStyle}>◀</button>
            <span style={monthLabel}>{year}年 {month + 1}月</span>
            <button onClick={() => changeMonth(1)} style={iconBtnStyle}>▶</button>
          </div>
        </div>
      </header>

      <div style={calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map(w => (
          <div key={w} style={weekHeaderStyle}>{w}</div>
        ))}
        {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} style={emptyDayStyle}></div>)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(year, month, day);
          const dayOfWeek = dateObj.getDay();

          const isPast = dateStr < todayStr;
          const isNG = ngDates.includes(dateStr);
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
                ...dayStyle,
                backgroundColor: isNG ? '#fee2e2' : (isSystemClosed ? '#f1f5f9' : (fName ? fColors.bg : (isPast ? '#f8fafc' : 'white'))),
                cursor: (isPast || keepInfo || confirmedInfo || isSystemClosed) ? 'default' : 'pointer',
                opacity: isPast ? 0.6 : 1,
                border: isNG ? '2px solid #ef4444' : (isSystemClosed ? '1px solid #cbd5e1' : (confirmedInfo ? `1px solid ${fColors.border}` : '1px solid #e2e8f0')),
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <span style={{fontWeight:'bold', color: isNG ? '#ef4444' : (isSystemClosed ? '#94a3b8' : '#1e293b')}}>{day}</span>
                {isNG && <span style={{color:'#ef4444', fontWeight:'bold', fontSize:'18px'}}>×</span>}
                {isSystemClosed && !isNG && <span style={{fontSize:'11px', color:'#94a3b8', fontWeight:'bold'}}>定休</span>}
              </div>
              
              <div style={infoContainer}>
                {fName && (
                  <div style={{...badgeStyle, color: fColors.text, backgroundColor: 'rgba(255,255,255,0.7)', border: `1px solid ${fColors.border}`}}>
                    {confirmedInfo ? '✅' : (keepInfo ? '⏳' : '')} {fName}
                  </div>
                )}
                {!fName && !isNG && !isPast && !isSystemClosed && <div style={{fontSize:'10px', color:'#cbd5e1'}}>受付中</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={footerRow}>
        <div style={legendStyle}>
          <div style={legendItem}><span style={{...dot, backgroundColor:'#ef4444'}}></span> 休み(NG)</div>
          <div style={legendItem}><span style={{...dot, backgroundColor:'#f1f5f9', border:'1px solid #cbd5e1'}}></span> 毎週の定休日</div>
          <div style={legendItem}><span style={{...dot, backgroundColor:'#3b82f6'}}></span> 施設予約あり</div>
          <div style={legendItem}><span style={{...dot, backgroundColor:'#f8fafc', border:'1px solid #ddd'}}></span> 過去</div>
        </div>
        <div style={currentSettingStatus}>
          当日予約：{settings.allow_same_day_booking ? '🟢 許可' : '🔴 停止中'}
        </div>
      </div>

      {/* 🌟 店舗設定モーダル (PC版) */}
      {isSettingOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ⚙️ 店舗基本設定
            </h3>
            
            <section style={modalSection}>
              <h4 style={modalSubTitle}>1. 定休日の設定（毎週）</h4>
              <p style={modalDesc}>チェックを入れた曜日は、全施設のカレンダーで自動的に「定休日」になります。</p>
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
            </section>

            <section style={modalSection}>
              <h4 style={modalSubTitle}>2. 当日予約の受付</h4>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => setSettings({...settings, allow_same_day_booking: true})}
                  style={toggleBtnStyle(settings.allow_same_day_booking, '#10b981')}
                >
                  当日の予約を許可する
                </button>
                <button 
                  onClick={() => setSettings({...settings, allow_same_day_booking: false})}
                  style={toggleBtnStyle(!settings.allow_same_day_booking, '#ef4444')}
                >
                  当日は受け付けない
                </button>
              </div>
            </section>

            <div style={modalFooter}>
              <button onClick={() => setIsSettingOpen(false)} style={pcCancelBtn}>キャンセル</button>
              <button onClick={() => saveSettings(settings)} style={pcSaveBtn}>設定を保存して反映する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🎨 スタイル設定
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px 25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const navGroup = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBtnStyle = { padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontWeight: 'bold' };
const monthLabel = { fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a', minWidth: '120px', textAlign: 'center' };
const pcSettingBtnStyle = { padding: '10px 20px', backgroundColor: '#f8fafc', border: '1px solid #1e3a8a', color: '#1e3a8a', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' };

const calendarGrid = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, backgroundColor: '#f1f5f9', gap: '2px', border: '2px solid #f1f5f9', borderRadius: '15px', overflow: 'hidden' };
const weekHeaderStyle = { backgroundColor: '#f8fafc', padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '14px', borderBottom: '1px solid #e2e8f0' };
const dayStyle = { padding: '12px', minHeight: '110px', display: 'flex', flexDirection: 'column', transition: '0.2s', backgroundColor: 'white' };
const emptyDayStyle = { backgroundColor: '#f8fafc' };
const infoContainer = { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' };
const badgeStyle = { fontSize: '11px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

const footerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' };
const legendStyle = { display: 'flex', gap: '25px' };
const legendItem = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', fontWeight: '500' };
const dot = { width: '12px', height: '12px', borderRadius: '50%' };
const currentSettingStatus = { fontSize: '13px', fontWeight: 'bold', color: '#475569', backgroundColor: '#fff', padding: '8px 15px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };

// 🌟 モーダルスタイル (PC)
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '20px', width: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' };
const modalSection = { marginBottom: '30px' };
const modalSubTitle = { margin: '0 0 10px 0', fontSize: '16px', color: '#334155' };
const modalDesc = { fontSize: '13px', color: '#64748b', marginBottom: '15px' };
const dayGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' };
const dayTileStyle = (active) => ({
  padding: '12px 0', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? '#1e3a8a' : '#f1f5f9', color: active ? '#fff' : '#475569', transition: '0.2s'
});
const toggleBtnStyle = (active, activeColor) => ({
  flex: 1, padding: '15px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  backgroundColor: active ? activeColor : '#f1f5f9', color: active ? '#fff' : '#475569', transition: '0.2s'
});
const modalFooter = { display: 'flex', gap: '15px', marginTop: '10px' };
const pcSaveBtn = { flex: 2, padding: '15px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };
const pcCancelBtn = { flex: 1, padding: '15px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' };