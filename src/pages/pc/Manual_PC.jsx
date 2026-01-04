import React from 'react';

export default function Manual_PC() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>美容室SnipSnap 施設様用システム ご利用ガイド</h1>
      
      <div style={cardStyle}>
        <p style={introStyle}>
          このシステムは、施設様の手間を減らし、入居者様により良いサービスを提供するために作られました。<br/>
          操作で分からないことがあれば、いつでもこのガイドを確認してください。
        </p>

        {/* --- 1. ログイン --- */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>1. はじめに</h2>
          <div style={flexRow}>
            <div style={descStyle}>
              <h3 style={h3Style}>🔑 ログイン画面</h3>
              <p style={pStyle}>お渡しした専用のIDとパスワードでログインしてください。施設様専用の管理画面が開きます。</p>
            </div>
          </div>
        </section>

        {/* --- 2. 準備セクション --- */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>2. 訪問前の準備（お日にちの確保と、ご希望者の集計）</h2>
          <p style={{marginBottom: '30px', color: '#7a6b5d', fontSize: '18px', fontWeight: '800'}}>まずは「いつ訪問するか」を決め、入居者様へのお知らせを準備します。</p>
          
          <div style={{ display: 'flex', gap: '30px' }}>
            {/* 左側：日の確保 */}
            <div style={prepBoxStyle}>
              <h3 style={{ color: '#4a3728', fontSize: '22px', marginBottom: '15px', fontWeight: '900' }}>📅 訪問予定日の確保</h3>
              <p style={prepTextStyle}>
                カレンダーの空いている日をクリックして「キープ（仮押さえ）」してください。
              </p>
              <div style={noteBoxMini}>
                <p style={{ fontWeight: '900', fontSize: '15px', color: '#1e3a8a', marginBottom: '5px' }}>💡 定期契約の施設様</p>
                <p style={{ fontSize: '15px', lineHeight: '1.6' }}>既にスケジュールはキープ済みですので、この操作は不要です。</p>
              </div>
              <div style={smallImagePlaceholder}>【カレンダー画面の画像】</div>
            </div>

            {/* 右側：名簿プリント */}
            <div style={prepBoxStyle}>
              <h3 style={{ color: '#4a3728', fontSize: '22px', marginBottom: '15px', fontWeight: '900' }}>🖨️ 掲示用名簿をプリント</h3>
              <p style={prepTextStyle}>
                名簿を印刷して、カット希望者のリストアップ（チェック）にご活用ください。<br/>
                使い方は施設様に合わせて<b>ご自由に</b>どうぞ！
              </p>
              <div style={smallImagePlaceholder}>【名簿プリントの画像】</div>
            </div>
          </div>
        </section>

        {/* --- 3. 申し込みの流れ --- */}
        <section style={flowSectionStyle}>
          <h2 style={{...h2Style, borderLeftColor: '#4a3728'}}>3. 申し込みの流れ（かんたん4ステップ）</h2>
          <p style={{marginBottom: '30px', fontSize: '18px', fontWeight: '800', color: '#4a3728'}}>
            確保した日付に対して、実際にカットする方を登録する手順です。
          </p>
          
          <div style={flowGrid}>
            <div style={stepItem}>
              <div style={stepBadge}>Step 1</div>
              <h4 style={stepTitle}>予約確定</h4>
              <p style={stepDesc}>リストからお名前を<br/>選びます</p>
            </div>
            <div style={arrow}>➔</div>
            <div style={stepItem}>
              <div style={stepBadge}>Step 2</div>
              <h4 style={stepTitle}>時間の選択</h4>
              <p style={stepDesc}>ご希望の時間帯を<br/>選びます</p>
            </div>
            <div style={arrow}>➔</div>
            <div style={stepItem}>
              <div style={stepBadge}>Step 3</div>
              <h4 style={stepTitle}>最終チェック</h4>
              <p style={stepDesc}>間違いがないか<br/>確認します</p>
            </div>
            <div style={arrow}>➔</div>
            <div style={stepItem}>
              <div style={stepBadge}>Step 4</div>
              <h4 style={stepTitle}>受付完了</h4>
              <p style={stepDesc}>完了！SnipSnapへ<br/>通知されます</p>
            </div>
          </div>
        </section>

        {/* --- 4. 便利な機能 --- */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>4. 便利な機能</h2>
          <div style={flexRow}>
            <div style={descStyle}>
              <h3 style={h3Style}>📊 予約状況・進捗管理</h3>
              <p style={pStyle}>当日の「いま何人終わったか」をリアルタイムで確認いただけます。</p>
              <h3 style={h3Style}>📜 過去の訪問記録</h3>
              <p style={pStyle}>「前回いつ切ったかな？」といった履歴をいつでも確認できます。</p>
              <h3 style={h3Style}>📄 請求書をプリント</h3>
              <p style={pStyle}>月ごとの請求書をいつでも発行・保存・印刷できます。</p>
            </div>
            <div style={imagePlaceholder}>【進捗管理や請求書の画像】</div>
          </div>
        </section>

        <div style={noteBox}>
          <p style={{fontWeight: '900', color: '#b45309', marginBottom: '10px', fontSize: '18px'}}>💡 安心ポイント</p>
          <p style={{lineHeight: '1.8', fontSize: '16px', fontWeight: '800', color: '#92400e'}}>操作を間違えてもSnipSnap側で修正できます。まずは安心してお気軽に触ってみてください！</p>
        </div>
      </div>
    </div>
  );
}

// 🎨 スタイル設定（文字特大・アンティーク調）
const containerStyle = { padding: '40px', backgroundColor: '#f9f7f5', minHeight: '100%', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif' };
const titleStyle = { textAlign: 'center', color: '#4a3728', fontSize: '32px', fontWeight: '900', marginBottom: '40px', borderBottom: '5px solid #4a3728', paddingBottom: '15px', letterSpacing: '0.05em' };
const cardStyle = { maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white', padding: '60px', borderRadius: '40px', boxShadow: '0 20px 50px rgba(74, 55, 40, 0.1)', border: '1px solid #e2d6cc' };
const introStyle = { fontSize: '18px', color: '#7a6b5d', textAlign: 'center', marginBottom: '50px', lineHeight: '2', fontWeight: '800' };

const sectionStyle = { marginBottom: '60px', borderBottom: '2px solid #f2ede9', paddingBottom: '40px' };
const h2Style = { color: '#4a3728', borderLeft: '8px solid #2d6a4f', paddingLeft: '20px', marginBottom: '30px', fontSize: '24px', fontWeight: '900' };
const h3Style = { fontSize: '20px', fontWeight: '900', color: '#5d4037', marginTop: '20px', marginBottom: '10px' };
const pStyle = { fontSize: '16px', color: '#475569', lineHeight: '1.8', fontWeight: '500' };

const flexRow = { display: 'flex', gap: '40px', alignItems: 'center' };
const descStyle = { flex: 1.2 };

// 🌟 準備セクション用のスタイル
const prepBoxStyle = { flex: 1, backgroundColor: '#fdfcfb', padding: '35px', borderRadius: '25px', border: '1px solid #e2d6cc', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const prepTextStyle = { fontSize: '16px', lineHeight: '1.8', color: '#5d4037', marginBottom: '20px', fontWeight: '700' };
const smallImagePlaceholder = { width: '100%', height: '180px', backgroundColor: '#faf9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', color: '#cbd5e0', border: '2px dashed #e2d6cc', fontSize: '14px', fontWeight: 'bold' };

const imagePlaceholder = { flex: 1, height: '280px', backgroundColor: '#faf9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '20px', color: '#cbd5e0', border: '2px dashed #e2d6cc', fontWeight: 'bold' };

// 🌟 ステップフローのスタイル
const flowSectionStyle = { backgroundColor: '#f0f9f1', padding: '45px', borderRadius: '35px', marginBottom: '60px', border: '1px solid #d1e5de' };
const flowGrid = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' };
const stepItem = { textAlign: 'center', flex: 1 };
const stepBadge = { backgroundColor: '#2d6a4f', color: 'white', padding: '6px 18px', borderRadius: '20px', fontSize: '14px', fontWeight: '900', marginBottom: '15px', display: 'inline-block' };
const stepTitle = { fontSize: '18px', fontWeight: '900', color: '#1b4332', marginBottom: '10px' };
const stepDesc = { fontSize: '14px', color: '#2d6a4f', lineHeight: '1.6', fontWeight: '800' };
const arrow = { fontSize: '28px', color: '#cbd5e0', fontWeight: '900' };

const noteBox = { backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '30px', borderRadius: '20px', marginTop: '30px' };
const noteBoxMini = { backgroundColor: '#eff6ff', padding: '20px', borderRadius: '15px', marginTop: '10px', marginBottom: '25px', fontSize: '15px', border: '1px solid #dbeafe', color: '#1e40af' };