import React, { useState } from 'react';
import { Layout } from './Layout';

// 🌟 bookingList を受け取れるように引数を追加
export default function AdminDashboard({ historyList = [], bookingList = [], setPage }) {
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().substring(0, 7));

  // 1. 指定月のデータを抽出
  const monthlyData = historyList.filter(h => h.date.startsWith(targetMonth.replace(/-/g, '/')));
  
  // 🌟 クラウドの予約データから今月の予定＆欠席データを抽出
  const monthlyBookings = bookingList.filter(b => b.date.startsWith(targetMonth));
  const totalPlannedPeople = monthlyBookings.reduce((sum, b) => sum + (b.members?.length || 0), 0);
  const totalCancelPeople = monthlyBookings.reduce((sum, b) => 
    sum + (b.members?.filter(m => m.status === 'cancel').length || 0), 0
  );

  // 2. 基本集計
  const totalSales = monthlyData.reduce((sum, h) => sum + (Number(h.price) || 0), 0);
  const totalPeople = monthlyData.length; // 実際に施術した人数
  const averageSpend = totalPeople > 0 ? Math.round(totalSales / totalPeople) : 0;
  
  // 🌟 欠席率の計算
  const cancelRate = totalPlannedPeople > 0 ? Math.round((totalCancelPeople / totalPlannedPeople) * 100) : 0;

  // 3. 施設別売上集計
  const salesByFacility = monthlyData.reduce((acc, h) => {
    const name = h.facility || "不明";
    acc[name] = (acc[name] || 0) + (Number(h.price) || 0);
    return acc;
  }, {});

  // 4. メニュー別人気ランキング
  const menuStats = monthlyData.reduce((acc, h) => {
    const menu = h.menu || "未設定";
    acc[menu] = (acc[menu] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', paddingBottom: '100px', width: '100%' }}>
      <Layout>
        <div style={{ padding: '20px' }}>
          <header style={{ textAlign: 'center', marginBottom: '20px', paddingTop: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: 0 }}>売上分析ボード</h1>
            <input 
              type="month" 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(e.target.value)}
              style={monthInputStyle}
            />
          </header>

          {/* 💰 メイン数字カード */}
          <div style={topStatsGrid}>
            <div style={statCard('#1e3a8a')}>
              <div style={statLabel}>月間売上</div>
              <div style={statValue}>¥{totalSales.toLocaleString()}</div>
            </div>
            <div style={statCard('#10b981')}>
              <div style={statLabel}>施術人数</div>
              <div style={statValue}>{totalPeople}名</div>
            </div>
            <div style={statCard('#64748b')}>
              <div style={statLabel}>客単価平均</div>
              <div style={statValue}>¥{averageSpend.toLocaleString()}</div>
            </div>
            {/* 🌟 欠席率カード（新設） */}
            <div style={statCard(cancelRate > 15 ? '#e11d48' : '#f59e0b')}>
              <div style={statLabel}>欠席率 ({totalCancelPeople}名)</div>
              <div style={statValue}>{cancelRate}%</div>
            </div>
          </div>

          {/* 🏢 施設別ランキング */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>施設別売上シェア</h3>
            {Object.entries(salesByFacility).sort((a,b) => b[1] - a[1]).map(([name, price]) => (
              <div key={name} style={barRow}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 'bold' }}>¥{price.toLocaleString()}</span>
                </div>
                <div style={barBg}>
                  <div style={{...barFill('#3b82f6'), width: `${(price / (totalSales || 1)) * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>

          {/* ✂️ メニュー分布 */}
          <div style={sectionCard}>
            <h3 style={sectionTitle}>メニュー別利用数</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(menuStats).sort((a,b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} style={menuBadgeStyle}>
                  {name}: <span style={{ fontWeight: 'bold' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
      <button className="floating-back-btn" onClick={() => setPage('admin-top')}>←</button>
    </div>
  );
}

// 🎨 デザイン（変更なし）
const monthInputStyle = { marginTop: '10px', padding: '8px 15px', borderRadius: '12px', border: 'none', backgroundColor: 'white', color: '#1e3a8a', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const topStatsGrid = { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' };
const statCard = (color) => ({ backgroundColor: color, color: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' });
const statLabel = { fontSize: '11px', opacity: 0.8 };
const statValue = { fontSize: '20px', fontWeight: 'bold', marginTop: '5px' };
const sectionCard = { backgroundColor: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' };
const sectionTitle = { fontSize: '15px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', margin: 0 };
const barRow = { marginBottom: '12px' };
const barBg = { width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' };
const barFill = (color) => ({ height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.5s ease-out' });
const menuBadgeStyle = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', color: '#475569' };