import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { CloseIcon } from '../components/icons.jsx';
import { parseInstagramExport } from '../import/igImport.js';

// iPhoneのInstagramアプリでデータをエクスポートする手順（公式「情報をダウンロード」）
const STEPS = [
  'Instagramアプリで自分のプロフィールを開き、右上の ≡ →「設定とアクティビティ」',
  '「アカウントセンター」→「あなたの情報とアクセス許可」を開く',
  '「自分の情報をダウンロード」→「ダウンロードまたは転送」',
  'アカウントを選び、「情報の一部」→「投稿」にチェック（または全データでもOK）',
  '形式は「JSON」、期間は「全期間」を選ぶ',
  '「リクエストを送信」。準備できると通知/メールが届く（数分〜最大1日）',
  '届いたZIPをこの端末（iPhone/PC）に保存しておく',
];

export default function ImportScreen() {
  const { importPosts, setOverlay } = useStore();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setStatus('読み込み中…');
    try {
      const posts = await parseInstagramExport(file, (done, total) => setStatus(`取り込み中… ${done}/${total}`));
      if (posts.length === 0) {
        setStatus('投稿が見つかりませんでした。形式が「JSON」のエクスポートか確認してね。');
      } else {
        await importPosts(posts);
        setStatus(`✓ ${posts.length}件の投稿を取り込みました`);
      }
    } catch (err) {
      setStatus('読み込みに失敗しました: ' + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay">
      <header className="topbar">
        <div className="topbar-side"><button onClick={() => setOverlay(null)}><CloseIcon /></button></div>
        <div className="topbar-title">投稿を取り込む</div>
        <div className="topbar-side" />
      </header>
      <div className="composer-body import-guide">
        <p className="import-lead">
          本物のインスタの投稿を取り込むには、まず Instagram で自分のデータを書き出します。
          iPhoneでの手順：
        </p>
        <ol className="import-steps">
          {STEPS.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <div className="import-note">⚠️ 形式は必ず「JSON」を選ぶこと。HTMLだと取り込めません。</div>
        <div className="import-note muted">
          アプリのバージョンで文言が少し違うことがあります。「アカウントセンター」→「情報をダウンロード」を目印に。
          ログインや自動取得はしていません（公式エクスポート経由なので安全）。
        </div>

        <label className={'share-cta' + (busy ? ' disabled' : '')}>
          <input type="file" accept=".zip,application/zip" onChange={onPick} hidden disabled={busy} />
          書き出したZIPファイルを選択
        </label>
        {status && <div className="import-status big">{status}</div>}
      </div>
    </div>
  );
}
