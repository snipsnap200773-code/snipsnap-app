import React, { useMemo } from 'react';

export default function AdminDashboard_PC({ historyList = [], dbFacilities = [] }) {
  // 1. 基本集計データ
  const stats = useMemo(() => {
    const totalSales = historyList.reduce((sum, h) => sum + (h.price || 0), 0);
    const totalVisits = historyList.length;
    const avgPrice = totalVisits > 0 ? Math.round(totalSales / totalVisits) : 0;
    
    // 今月のデータ
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisMonthData = historyList.filter(h => h.date.startsWith(thisMonth));
    const thisMonthSales = thisMonthData.reduce((sum, h) => sum + (h.price || 0), 0);

    return { totalSales, totalVisits, avgPrice, thisMonthSales };
  }, [historyList]);

  // 2. 施設別売上ランキング
  const facilityRanking = useMemo(() => {
    const map = {};
    historyList.forEach(h => {
      map[h.facility] = (map[h.facility] || 0) + (h.price || 0);
    });
    return Object.entries(map)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales);
  }, [historyList]);

  // 3. メニュー別集計
  const menuStats = useMemo(() => {
    const map = {};
    historyList.forEach(h => {
      map[h.menu] = (map[h.menu] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [historyList]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{margin:0}}>📊 売上分析ダッシュボード</h2>
        <p style={{fontSize:'14px', color:'#64748b'}}>全施設の稼働状況と売上パフォーマンスを可視化します</p>
      </header>

      {/* 🌟 ハイライト指標 */}
      <div style={statsGrid}>
        <div style={{...statCard, borderTop:'4px solid #1e3a8a'}}>
          <label style={labelStyle}>累計総売上</label>
          <div style={valueStyle}>¥{stats.totalSales.toLocaleString()}<span style={unitStyle}></span></div>
        </div>
        <div style={{...statCard, borderTop:'4px solid #10b981'}}>
          <label style={labelStyle}>今月の売上</label>
          <div style={valueStyle}>¥{stats.thisMonthSales.toLocaleString()}</div>
        </div>
        <div style={{...statCard, borderTop:'4px solid #f59e0b'}}>
          <label style={labelStyle}>総施術件数</label>
          <div style={valueStyle}>{stats.totalVisits.toLocaleString()}<span style={unitStyle}>件</span></div>
        </div>
        <div style={{...statCard, borderTop:'4px solid #8b5cf6'}}>
          <label style={labelStyle}>顧客単価</label>
          <div style={valueStyle}>¥{stats.avgPrice.toLocaleString()}</div>
        </div>
      </div>

      <div style={chartsGrid}>
        {/* 🌟 施設別売上ランキング */}
        <div style={chartCard}>
          <h3 style={chartTitle}>施設別累計売上</h3>
          <div style={rankList}>
            {facilityRanking.map((f, i) => (
              <div key={i} style={rankItem}>
                <span style={rankBadge}>{i + 1}</span>
                <span style={{flex:1}}>{f.name}</span>
                <span style={rankValue}>¥{f.sales.toLocaleString()}</span>
                <div style={barContainer}>
                  <div style={{...barStyle, width: `${(f.sales / facilityRanking[0].sales) * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 人気メニューランキング */}
        <div style={chartCard}>
          <h3 style={chartTitle}>メニュー別利用頻度</h3>
          <div style={rankList}>
            {menuStats.map((m, i) => (
              <div key={i} style={rankItem}>
                <span style={{flex:1}}>{m.name}</span>
                <span style={rankValue}>{m.count} <small>件</small></span>
                <div style={barContainer}>
                  <div style={{...barStyle, backgroundColor:'#8b5cf6', width: `${(m.count / menuStats[0].count) * 100}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル
const containerStyle = { display: 'flex', flexDirection: 'column', gap: '25px' };
const headerStyle = { marginBottom: '10px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' };
const statCard = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const labelStyle = { fontSize: '14px', color: '#64748b', fontWeight: 'bold' };
const valueStyle = { fontSize: '24px', fontWeight: 'bold', marginTop: '10px', color: '#1e293b' };
const unitStyle = { fontSize: '14px', marginLeft: '5px', fontWeight: 'normal' };

const chartsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' };
const chartCard = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const chartTitle = { margin: '0 0 20px 0', fontSize: '18px', borderLeft: '4px solid #1e3a8a', paddingLeft: '10px' };

const rankList = { display: 'flex', flexDirection: 'column', gap: '15px' };
const rankItem = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' };
const rankBadge = { backgroundColor: '#f1f5f9', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };
const rankValue = { fontWeight: 'bold', color: '#1e3a8a' };
const barContainer = { width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' };
const barStyle = { height: '100%', backgroundColor: '#1e3a8a', borderRadius: '4px' };