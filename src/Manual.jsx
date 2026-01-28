import React from 'react';
import { Layout } from './Layout';

export default function Manual({ setPage }) {
  return (
    <div style={{ backgroundColor: '#f9f7f5', minHeight: '100vh', width: '100%' }}>
      <Layout>
        <div style={containerStyle}>
          {/* --- ヘッダー --- */}
          <header style={headerStyle}>
            <h1 style={titleStyle}>SnipSnap<br/>ご利用ガイド</h1>
            <p style={introStyle}>
              施設様の手間を減らし、入居者様により良いサービスを提供するためのガイドです。 
            </p>
          </header>

          {/* --- 1. はじめに --- */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. はじめに</h2>
            <div style={contentBoxStyle}>
              <h3 style={h3Style}>🔑 ログイン画面</h3>
              <p style={urlStyle}>URL: https://snipsnap-app-xi.vercel.app/ </p>
              <p style={pStyle}>お渡しした専用のIDとパスワードでログインしてください。 </p>
            </div>
          </section>

          {/* --- 2. 利用者登録 --- */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>2. 利用者を登録</h2>
            <div style={contentBoxStyle}>
              <h3 style={h3Style}>👥 あつまれ綺麗にする人</h3>
              <p style={pStyle}>「新しく登録」から、部屋番号・お名前・ふりがな等を入力して登録します。 </p>
            </div>
          </section>

          {/* --- 3. 訪問前の準備 --- */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>3. 訪問前の準備</h2>
            <p style={subDescStyle}>まずは「いつ訪問してもらうか」を決めます。 </p>
            
            <div style={prepCardStyle}>
              <h3 style={h3Style}>📅 キープ！この日とった！</h3>
              <p style={pStyle}>カレンダーの空いている日をタップして「キープ」してください。 </p>
              <div style={noteBoxMini}>
                <span style={{fontWeight:'900'}}>💡定期契約の施設様</span><br/>
                既にスケジュールはキープ済みのため、この操作は不要です。 
              </div>
            </div>

            <div style={{...prepCardStyle, marginTop:'15px'}}>
              <h3 style={h3Style}>🖨️ 掲示用名簿をプリント</h3>
              <p style={pStyle}>名簿を印刷して、カット希望者のチェックにご活用ください。 </p>
            </div>
          </section>

          {/* --- 4. 申し込みの流れ --- */}
          <section style={flowSectionStyle}>
            <h2 style={h2Style}>4. 予約確定の流れ</h2>
            <p style={subDescStyle}>実際にカットする方を登録する4ステップです。 </p>
            
            <div style={stepContainer}>
              <div style={stepItem}>
                <span style={stepBadge}>Step 1</span>
                <span style={stepTitle}>予約確定</span>
                <p style={stepText}>リストからお名前とメニューを選びます </p>
              </div>
              <div style={stepItem}>
                <span style={stepBadge}>Step 2</span>
                <span style={stepTitle}>時間の選択</span>
                <p style={stepText}>ご希望の時間帯を選びます </p>
              </div>
              <div style={stepItem}>
                <span style={stepBadge}>Step 3</span>
                <span style={stepTitle}>最終チェック</span>
                <p style={stepText}>間違いがないか確認します </p>
              </div>
              <div style={stepItem}>
                <span style={stepBadge}>Step 4</span>
                <span style={stepTitle}>受付完了</span>
                <p style={stepText}>完了！SnipSnapへ通知されます </p>
              </div>
            </div>
          </section>

          {/* --- 5. 便利な機能 --- */}
          <section style={sectionStyle}>
            <h2 style={h2Style}>5. 便利な機能</h2>
            <div style={contentBoxStyle}>
              <p style={pStyle}>● <b>予約状況・進捗管理:</b> 今何人終わったかリアルタイムで確認。 </p>
              <p style={pStyle}>● <b>過去の訪問記録:</b> 前回の履歴をいつでも確認。 </p>
              <p style={pStyle}>● <b>請求書をプリント:</b> 月ごとの請求書を発行。 </p>
            </div>
          </section>

          {/* --- 安心ポイント --- */}
          <div style={noteBox}>
            <p style={{fontWeight:'900', color:'#b45309', marginBottom:'8px'}}>💡 安心ポイント</p>
            <p style={{fontSize:'14px', fontWeight:'800', color:'#92400e', lineHeight:'1.6'}}>
              操作を間違えてもSnipSnap側で修正できます。まずは安心してお気軽に触ってみてください！ 
            </p>
          </div>

          <p style={footerStyle}>© 2026 SnipSnap System</p>
        </div>
      </Layout>

      {/* 戻るボタン */}
      <button 
        onClick={() => setPage('menu')}
        style={backBtnStyle}
      >
        ← 戻る
      </button>
    </div>
  );
}

// 🎨 モバイル専用スタイル設定
const containerStyle = { padding: '20px', paddingBottom: '100px' };
const headerStyle = { textAlign: 'center', marginBottom: '30px', paddingTop: '10px' };
const titleStyle = { fontSize: '26px', fontWeight: '900', color: '#4a3728', lineHeight: '1.3', marginBottom: '10px' };
const introStyle = { fontSize: '13px', color: '#7a6b5d', lineHeight: '1.6', fontWeight: 'bold' };

const sectionStyle = { marginBottom: '35px' };
const h2Style = { fontSize: '19px', fontWeight: '900', color: '#2d6a4f', borderLeft: '6px solid #2d6a4f', paddingLeft: '12px', marginBottom: '15px' };
const h3Style = { fontSize: '16px', fontWeight: '900', color: '#5d4037', marginBottom: '8px' };
const pStyle = { fontSize: '14px', color: '#475569', lineHeight: '1.6', fontWeight: '600' };
const urlStyle = { fontSize: '12px', color: '#2563eb', marginBottom: '8px', fontWeight: 'bold', wordBreak: 'break-all' };
const subDescStyle = { fontSize: '14px', color: '#4a3728', fontWeight: '800', marginBottom: '15px' };

const contentBoxStyle = { backgroundColor: 'white', padding: '15px', borderRadius: '18px', border: '1px solid #e2d6cc' };
const prepCardStyle = { backgroundColor: '#fdfcfb', padding: '20px', borderRadius: '22px', border: '1px solid #e2d6cc', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' };
const noteBoxMini = { backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px', marginTop: '10px', fontSize: '13px', color: '#1e40af', border: '1px solid #dbeafe' };

const flowSectionStyle = { backgroundColor: '#f0f9f1', padding: '20px', borderRadius: '25px', marginBottom: '35px', border: '1px solid #d1e5de' };
const stepContainer = { display: 'flex', flexDirection: 'column', gap: '15px' };
const stepItem = { backgroundColor: 'white', padding: '15px', borderRadius: '15px', border: '1px solid #cce9d9' };
const stepBadge = { backgroundColor: '#2d6a4f', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', marginRight: '8px' };
const stepTitle = { fontSize: '15px', fontWeight: '900', color: '#1b4332' };
const stepText = { fontSize: '13px', color: '#2d6a4f', marginTop: '5px', fontWeight: 'bold', paddingLeft: '2px' };

const noteBox = { backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '20px', borderRadius: '22px' };
const footerStyle = { textAlign: 'center', color: '#a39081', fontSize: '11px', marginTop: '30px', fontWeight: 'bold' };

const backBtnStyle = {
  position: 'fixed', bottom: '25px', left: '20px', right: '20px',
  padding: '16px', backgroundColor: '#4a3728', color: 'white',
  border: 'none', borderRadius: '18px', fontSize: '16px', fontWeight: '900',
  boxShadow: '0 8px 20px rgba(74, 55, 40, 0.3)', zIndex: 100
};