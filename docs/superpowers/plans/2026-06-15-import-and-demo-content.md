# 拡張: 公式エクスポート取り込み ＆ デモ賑やかし Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** (A) Instagram公式「情報をダウンロード」のZIP(JSON+画像)を読み込んで昔の本物の投稿をこのアプリに取り込む。(B) ローカル生成のダミーで、リールタブ・他人のフィード投稿・他人のストーリー・検索グリッドを追加し、本物っぽく賑やかに見せる。

**Architecture:** 既存の React + Vite + IndexedDB 構成に追加。デモ用コンテンツは**著作権フリーの生成グラデ画像＋架空ユーザー**で、セッション毎に生成（永続化しない）。投稿に `author` を持たせ、「自分の投稿(=author無し)」と「他人(=author有り)」を区別する。取り込んだ投稿は自分の投稿として `posts` ストアに保存し、グリッド/フィードに昔の投稿として並ぶ。

**Tech Stack:** 追加依存は `jszip`（ブラウザでZIP解凍）のみ。画像生成は Canvas。

---

## 重要な前提・データモデル変更

- **`post.author?`** を追加: `{ username: string, avatarBlob: Blob }`。
  - 自分の投稿（手動作成・取り込み）は `author` 無し → 表示名/アイコンは `profile` を使う。
  - デモの他人投稿は `author` 有り → そのユーザー名/アイコンを使う。
- **プロフィールのグリッド/投稿数** は「`author` 無し」の feed のみ（＝自分のもの）に限定。
- **フィード** は「自分の feed ＋（デモON時）デモ feed」を `createdAt` 降順でまとめて表示。
- **デモのON/OFF** は `demoMode`（boolean, 既定 true）。`localStorage` に保存。OFFで他人系を全部隠す（自分の投稿だけのクリーンなプレビューに戻せる）。
- 著作権配慮: デモのユーザー名は架空、キャプションは汎用のオリジナル短文、画像は生成グラデのみ。実在の投稿・写真・歌詞等は使わない。

---

## Task 1: 依存追加とグラデ画像生成ユーティリティ

**Files:** Create `src/data/gradient.js` / Modify `package.json`

- [ ] **Step 1: jszip を追加**

Run: `npm install jszip`
Expected: package.json の dependencies に `jszip` が入る。

- [ ] **Step 2: gradient.js を作成**

`src/data/gradient.js`:
```js
// 決定的なシード値から、毎回同じ色のグラデ画像(PNG Blob)を生成する。
export function gradientBlob(seed, w = 600, h = 750) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const h1 = (seed * 47) % 360;
    const h2 = (h1 + 40 + (seed * 13) % 120) % 360;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${h1} 65% 55%)`);
    g.addColorStop(1, `hsl(${h2} 60% 42%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const x = (seed * (i + 3) * 97) % w;
      const y = (seed * (i + 5) * 53) % h;
      const r = 40 + (seed * (i + 1) * 31) % 140;
      ctx.fillStyle = `hsla(${(h2 + i * 35) % 360} 80% 62% / .22)`;
      ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
}
```

- [ ] **Step 3: Commit** `git add -A && git commit -m "feat: add jszip and gradient image generator"`

---

## Task 2: デモ用シードデータ生成

**Files:** Create `src/data/seed.js`

- [ ] **Step 1: seed.js を作成**

`src/data/seed.js`:
```js
import { gradientBlob } from './gradient.js';

const USERS = [
  { username: 'tokyo_walks', name: 'Tokyo Walks' },
  { username: 'minimal.daily', name: 'Minimal Daily' },
  { username: 'aoi.films', name: 'Aoi' },
  { username: 'coffee.notes', name: 'Coffee Notes' },
  { username: 'sora.design', name: 'Sora' },
  { username: 'naoki.eats', name: 'Naoki' },
  { username: 'haru.trip', name: 'Haru' },
  { username: 'studio.kumo', name: 'Studio Kumo' },
];
// 汎用のオリジナル短文（実在キャプションの引用ではない）
const CAPTIONS = [
  '今日の散歩', 'light and shadow', 'おすすめのカフェ', 'weekend',
  '作業の合間に', 'new work', 'おはよう', 'film day', 'best of the week', 'golden hour',
];

let cache = null;

export async function buildSeed() {
  if (cache) return cache;
  const users = [];
  for (let i = 0; i < USERS.length; i++) {
    users.push({ ...USERS[i], avatarBlob: await gradientBlob((i + 1) * 11, 150, 150) });
  }
  const now = Date.now();

  const feed = [];
  for (let i = 0; i < 8; i++) {
    const u = users[i % users.length];
    const count = i % 3 === 0 ? 3 : 1;
    const media = [];
    for (let j = 0; j < count; j++) media.push({ kind: 'image', blob: await gradientBlob(100 + i * 7 + j) });
    feed.push({
      id: `seed-feed-${i}`, type: 'feed',
      author: { username: u.username, avatarBlob: u.avatarBlob },
      media, caption: CAPTIONS[i % CAPTIONS.length],
      likes: 30 + (i * 137) % 4000, createdAt: now - i * 5 * 3600_000,
    });
  }

  const stories = [];
  for (let i = 0; i < 5; i++) {
    const u = users[i];
    stories.push({
      id: `seed-story-${i}`, type: 'story',
      author: { username: u.username, avatarBlob: u.avatarBlob },
      media: [{ kind: 'image', blob: await gradientBlob(300 + i, 540, 960) }],
      caption: '', createdAt: now - i * 1800_000,
    });
  }

  const reels = [];
  for (let i = 0; i < 6; i++) {
    const u = users[(i + 2) % users.length];
    reels.push({
      id: `seed-reel-${i}`,
      author: { username: u.username, avatarBlob: u.avatarBlob },
      blob: await gradientBlob(700 + i * 9, 540, 960),
      caption: CAPTIONS[(i + 3) % CAPTIONS.length],
      likes: 1000 + (i * 911) % 90000, comments: 10 + (i * 51) % 800,
      audio: `original audio · ${u.username}`,
    });
  }

  const explore = [];
  for (let i = 0; i < 18; i++) explore.push({ id: `seed-ex-${i}`, blob: await gradientBlob(900 + i * 3, 400, 400) });

  cache = { users, feed, stories, reels, explore };
  return cache;
}
```

- [ ] **Step 2: Commit** `git add -A && git commit -m "feat: add demo seed data (users/feed/stories/reels/explore)"`

---

## Task 3: Instagram エクスポートZIPのパーサ

**Files:** Create `src/import/igImport.js`

Instagram「情報をダウンロード」のJSON出力は版により構造が揺れるため、**寛容に**パースする。要点:
- ZIP内の `posts_1.json`（`posts_2.json`…）等を**名前で総当たり検索**。場所は `your_instagram_activity/media/` や `content/` など版による。
- 中身は通常「投稿の配列」。各投稿は複数メディアを持ちうる。`media[]` の各要素に `uri`（ZIP内パス）、`creation_timestamp`、`title`。投稿レベルにも `creation_timestamp`/`title` がある場合あり。
- 非ASCII文字列はUTF-8をlatin1で二重エンコードした文字化けになりやすい → 補正する。

- [ ] **Step 1: igImport.js を作成**

`src/import/igImport.js`:
```js
import JSZip from 'jszip';

// Instagramエクスポートの「latin1で読まれたUTF-8」文字化けを補正
function fixEncoding(s) {
  if (typeof s !== 'string' || !/[-ÿ]/.test(s)) return s;
  try { return new TextDecoder('utf-8').decode(Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)); }
  catch { return s; }
}

export async function parseInstagramExport(file, onProgress) {
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files);
  const postFiles = names.filter((n) => /posts_\d+\.json$/i.test(n) || /(^|\/)posts\.json$/i.test(n));

  const items = [];
  for (const name of postFiles) {
    let json;
    try { json = JSON.parse(await zip.files[name].async('string')); } catch { continue; }
    const arr = Array.isArray(json) ? json : (json.posts || json.media || []);
    for (const it of arr) items.push(it);
  }

  const posts = [];
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const mediaArr = Array.isArray(it.media) ? it.media : (it.uri ? [it] : []);
    const media = [];
    for (const m of mediaArr) {
      const uri = m && m.uri;
      if (!uri) continue;
      const entry = zip.file(uri) || zip.file(decodeURIComponent(uri));
      if (!entry) continue;
      const blob = await entry.async('blob');
      const kind = /\.(mp4|mov|webm)$/i.test(uri) ? 'video' : 'image';
      media.push({ kind, blob });
    }
    if (media.length === 0) continue;
    const ts = it.creation_timestamp || (mediaArr[0] && mediaArr[0].creation_timestamp) || 0;
    const title = it.title || (mediaArr[0] && mediaArr[0].title) || '';
    posts.push({
      id: `import-${ts}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'feed', media, caption: fixEncoding(title),
      likes: 0, createdAt: ts ? ts * 1000 : Date.now(),
    });
    if (onProgress) onProgress(idx + 1, items.length);
  }
  posts.sort((a, b) => b.createdAt - a.createdAt);
  return posts;
}
```

- [ ] **Step 2: Commit** `git add -A && git commit -m "feat: add Instagram export ZIP parser"`

---

## Task 4: Store 拡張（seed・demoMode・取り込み）

**Files:** Modify `src/store/StoreProvider.jsx`, `src/db/db.js`

- [ ] **Step 1: db.js に複数追加を実装**

`src/db/db.js` に追記:
```js
export async function addPosts(list) {
  const db = await openDB();
  const tx = db.transaction('posts', 'readwrite');
  const store = tx.objectStore('posts');
  for (const p of list) store.put(p);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **Step 2: StoreProvider に seed/demoMode/importPosts を追加**

`src/store/StoreProvider.jsx` を編集:
- import に追加: `import { buildSeed } from '../data/seed.js';`
- state 追加:
```jsx
  const [seed, setSeed] = useState(null);
  const [demoMode, setDemoModeState] = useState(() => localStorage.getItem('demoMode') !== 'off');
```
- 初期化 useEffect 内（profile/posts 読み込み後）に追加:
```jsx
      buildSeed().then(setSeed);
```
- アクション追加:
```jsx
  const setDemoMode = useCallback((on) => {
    localStorage.setItem('demoMode', on ? 'on' : 'off');
    setDemoModeState(on);
  }, []);

  const importPosts = useCallback(async (list) => {
    await db.addPosts(list);
    setPosts(await db.getPosts());
  }, []);
```
- `value` に追加: `seed, demoMode, setDemoMode, importPosts`

- [ ] **Step 3: Commit** `git add -A && git commit -m "feat: store support for seed, demoMode, bulk import"`

---

## Task 5: PostCard を author 対応に

**Files:** Modify `src/components/PostCard.jsx`

- [ ] **Step 1: author を使うよう変更**

`PostCard.jsx` の冒頭、`const { profile } = useStore();` の直後を次のように変更:
```jsx
  const author = post.author || profile;
  const avatarUrl = useObjectURL(author?.avatarBlob);
```
そして JSX 内で `profile?.username` を使っている2箇所（ヘッダーのユーザー名・キャプション先頭のユーザー名）を **`author?.username`** に置き換える。アイコンの `avatarUrl` は上で author 基準になっているのでそのままでよい。

- [ ] **Step 2: Commit** `git add -A && git commit -m "feat: PostCard uses post.author when present"`

---

## Task 6: フィードにデモ投稿を混ぜる

**Files:** Modify `src/screens/FeedScreen.jsx`

- [ ] **Step 1: 自分＋デモを時系列で統合**

`FeedScreen.jsx` の `const feed = posts.filter((p) => p.type === 'feed');` を次に置き換え:
```jsx
  const { posts, seed, demoMode, setOverlay } = useStore();
  const own = posts.filter((p) => p.type === 'feed');
  const demo = (demoMode && seed) ? seed.feed : [];
  const feed = [...own, ...demo].sort((a, b) => b.createdAt - a.createdAt);
```
（`useStore()` から `seed, demoMode` を受け取るよう分割代入を更新すること。既存の空状態判定 `feed.length === 0` はそのまま使える。）

- [ ] **Step 2: Commit** `git add -A && git commit -m "feat: blend demo posts into feed by time"`

---

## Task 7: ストーリーを「リング（投稿者ごと）」に再構成

**Files:** Modify `src/components/StoriesTray.jsx`, `src/screens/StoryViewer.jsx`, `src/App.jsx`

ストーリーを**投稿者ごとのリング**にまとめる。`overlay` を `{ kind:'story', ringKey }` に変更。

- [ ] **Step 1: StoriesTray を投稿者リング表示に**

`src/components/StoriesTray.jsx` を全置換:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import MediaItem from './MediaItem.jsx';

function Ring({ avatarBlob, label, onClick, own }) {
  const url = useObjectURL(avatarBlob);
  return (
    <button className="story-thumb" onClick={onClick}>
      <span className={'story-ring' + (own ? ' own' : '')}>
        {url ? <img className="story-img" src={url} alt="" /> : <span className="avatar-fallback story-img" />}
        {own && <span className="story-add">+</span>}
      </span>
      <span className="story-name">{label}</span>
    </button>
  );
}

export default function StoriesTray() {
  const { posts, profile, seed, demoMode, setOverlay } = useStore();
  const ownStories = posts.filter((p) => p.type === 'story');
  const demoStories = (demoMode && seed) ? seed.stories : [];

  const openOwn = () => ownStories.length ? setOverlay({ kind: 'story', ringKey: '__me__' }) : setOverlay({ kind: 'composer' });

  return (
    <div className="stories-tray">
      <Ring own avatarBlob={profile?.avatarBlob} label="あなた" onClick={openOwn} />
      {demoStories.map((s) => (
        <Ring key={s.id} avatarBlob={s.author.avatarBlob} label={s.author.username}
          onClick={() => setOverlay({ kind: 'story', ringKey: s.author.username })} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: StoryViewer を ringKey ベースに**

`src/screens/StoryViewer.jsx` を全置換:
```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import MediaItem from '../components/MediaItem.jsx';
import { CloseIcon, HeartIcon, ShareIcon } from '../components/icons.jsx';

const IMAGE_MS = 5000;

export default function StoryViewer() {
  const { posts, profile, seed, demoMode, overlay, setOverlay } = useStore();
  const ringKey = overlay.ringKey;

  // ringKey に対応する投稿者のストーリー列と、表示用の作者情報
  const { items, author } = useMemo(() => {
    if (ringKey === '__me__') {
      return {
        items: posts.filter((p) => p.type === 'story'),
        author: { username: profile?.username, avatarBlob: profile?.avatarBlob },
      };
    }
    const demo = (demoMode && seed) ? seed.stories : [];
    const list = demo.filter((s) => s.author.username === ringKey);
    return { items: list, author: list[0]?.author || { username: ringKey } };
  }, [ringKey, posts, seed, demoMode, profile]);

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const avatarUrl = useObjectURL(author?.avatarBlob);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const current = items[index];

  const next = () => {
    if (index < items.length - 1) { setIndex((i) => i + 1); setProgress(0); }
    else setOverlay(null);
  };
  const prev = () => { if (index > 0) { setIndex((i) => i - 1); setProgress(0); } };

  useEffect(() => { if (!current) setOverlay(null); /* eslint-disable-next-line */ }, [current]);

  useEffect(() => {
    if (!current || current.media[0]?.kind === 'video') return;
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) next(); else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current]);

  if (!current) return null;
  const isVideo = current.media[0]?.kind === 'video';

  return (
    <div className="story-viewer">
      <div className="story-bars">
        {items.map((_, i) => (
          <span key={i} className="story-bar">
            <span className="story-bar-fill" style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} />
          </span>
        ))}
      </div>
      <div className="story-top">
        <span className="avatar sm">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <span className="story-user">{author?.username}</span>
        <button className="story-close" onClick={() => setOverlay(null)}><CloseIcon /></button>
      </div>
      <MediaItem key={current.id} media={current.media[0]} className="story-media"
        videoProps={isVideo ? { onEnded: next, loop: false } : {}} />
      <button className="story-tap left" onClick={prev} aria-label="前へ" />
      <button className="story-tap right" onClick={next} aria-label="次へ" />
      <div className="story-bottom">
        <input className="story-reply" placeholder="メッセージを送信" readOnly />
        <button><HeartIcon /></button>
        <button><ShareIcon /></button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 起動確認＆Commit**

Run: `npm run build`（成功すること）
`git add -A && git commit -m "feat: group stories into per-author rings"`

---

## Task 8: リールタブ

**Files:** Create `src/screens/ReelsScreen.jsx` / Modify `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: ReelsScreen を作成**

`src/screens/ReelsScreen.jsx`:
```jsx
import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { HeartIcon, CommentIcon, ShareIcon, MoreIcon } from '../components/icons.jsx';

function abbr(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + '千' : String(n); }

function Reel({ reel }) {
  const bg = useObjectURL(reel.blob);
  const av = useObjectURL(reel.author.avatarBlob);
  const [liked, setLiked] = useState(false);
  return (
    <div className="reel" style={{ backgroundImage: bg ? `url(${bg})` : undefined }}>
      <div className="reel-shade" />
      <div className="reel-rail">
        <button onClick={() => setLiked((v) => !v)}><HeartIcon filled={liked} /><span>{abbr(reel.likes + (liked ? 1 : 0))}</span></button>
        <button><CommentIcon /><span>{abbr(reel.comments)}</span></button>
        <button><ShareIcon /></button>
        <button><MoreIcon /></button>
      </div>
      <div className="reel-meta">
        <div className="reel-user">
          <span className="avatar sm">{av ? <img src={av} alt="" /> : <span className="avatar-fallback" />}</span>
          <span className="story-user">{reel.author.username}</span>
          <span className="reel-follow">フォロー</span>
        </div>
        <div className="reel-caption">{reel.caption}</div>
        <div className="reel-audio">♪ {reel.audio}</div>
      </div>
    </div>
  );
}

export default function ReelsScreen() {
  const { seed, demoMode } = useStore();
  const reels = (demoMode && seed) ? seed.reels : [];
  if (reels.length === 0) return <div className="empty">デモ表示がOFFです。プロフィールでONにするとリールが流れます。</div>;
  return <div className="reels">{reels.map((r) => <Reel key={r.id} reel={r} />)}</div>;
}
```

- [ ] **Step 2: app.css にリールのスタイルを追記**

```css
.reels { height: 100%; overflow-y: auto; scroll-snap-type: y mandatory; background: #000; }
.reel { position: relative; height: 100%; scroll-snap-align: start; background-size: cover; background-position: center; display: flex; }
.reel-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,.55), transparent 35%); }
.reel-rail { position: absolute; right: 10px; bottom: 90px; display: flex; flex-direction: column; gap: 18px; z-index: 2; }
.reel-rail button { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #fff; font-size: 11px; }
.reel-meta { position: absolute; left: 14px; right: 70px; bottom: 80px; z-index: 2; color: #fff; }
.reel-user { display: flex; align-items: center; gap: 8px; }
.reel-follow { border: 1px solid rgba(255,255,255,.7); border-radius: 6px; padding: 2px 8px; font-size: 12px; }
.reel-caption { margin-top: 8px; font-size: 13px; }
.reel-audio { margin-top: 6px; font-size: 12px; opacity: .9; }
```

- [ ] **Step 3: App.jsx で reels タブを表示**

`src/App.jsx`: import 追加 `import ReelsScreen from './screens/ReelsScreen.jsx';`。タブ分岐に `{tab === 'reels' && <ReelsScreen />}` を追加し、準備中フォールバックの条件から `reels` を除外する。

- [ ] **Step 4: 起動確認＆Commit**

Run: `npm run build`
`git add -A && git commit -m "feat: add reels tab with demo reels"`

---

## Task 9: 検索（Explore）タブ

**Files:** Create `src/screens/ExploreScreen.jsx` / Modify `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: ExploreScreen を作成**

`src/screens/ExploreScreen.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { SearchIcon } from '../components/icons.jsx';

function Cell({ item }) {
  const url = useObjectURL(item.blob);
  return <div className="grid-cell">{url ? <img className="grid-img" src={url} alt="" /> : <span className="avatar-fallback" />}</div>;
}

export default function ExploreScreen() {
  const { seed, demoMode } = useStore();
  const items = (demoMode && seed) ? seed.explore : [];
  return (
    <div>
      <div className="explore-search"><SearchIcon /><span>検索</span></div>
      {items.length === 0
        ? <div className="empty">デモ表示がOFFです。</div>
        : <div className="grid">{items.map((it) => <Cell key={it.id} item={it} />)}</div>}
    </div>
  );
}
```

- [ ] **Step 2: app.css に検索バーのスタイルを追記**

```css
.explore-search { display: flex; align-items: center; gap: 8px; margin: 10px 12px; padding: 9px 12px; background: var(--ig-elevated); border-radius: 10px; color: var(--ig-muted); font-size: 14px; }
```

- [ ] **Step 3: App.jsx で search タブを表示**

`src/App.jsx`: import 追加 `import ExploreScreen from './screens/ExploreScreen.jsx';`。`{tab === 'search' && <ExploreScreen />}` を追加。これで準備中フォールバック（search/reels）は不要になるので、その分岐ブロックを削除する。

- [ ] **Step 4: 起動確認＆Commit**

Run: `npm run build`
`git add -A && git commit -m "feat: add explore (search) tab grid"`

---

## Task 10: プロフィールに「取り込み」と「デモON/OFF」

**Files:** Modify `src/screens/ProfileScreen.jsx`, `src/styles/app.css`

- [ ] **Step 1: グリッドを自分の投稿だけに限定し、取り込み・デモ切替を追加**

`src/screens/ProfileScreen.jsx` を編集:
- `const feed = posts.filter((p) => p.type === 'feed');` を **`const feed = posts.filter((p) => p.type === 'feed' && !p.author);`** に変更（自分のものだけ）。
- `useStore()` から `importPosts, demoMode, setDemoMode` も受け取る。
- import 追加: `import { useState } from 'react'; import { parseInstagramExport } from '../import/igImport.js';`
- 「プロフィールを編集」ボタンの直後に、取り込みUIとデモ切替を追加:
```jsx
      <ImportRow importPosts={importPosts} />
      <button className="profile-edit" onClick={() => setDemoMode(!demoMode)}>
        デモ表示（他人の投稿/リール/検索）: {demoMode ? 'ON' : 'OFF'}
      </button>
```
- ファイル下部に補助コンポーネントを追加:
```jsx
function ImportRow({ importPosts }) {
  const [status, setStatus] = useState('');
  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus('読み込み中…');
    try {
      const posts = await parseInstagramExport(file, (done, total) => setStatus(`取り込み中… ${done}/${total}`));
      if (posts.length === 0) { setStatus('投稿が見つかりませんでした（JSON形式のエクスポートか確認してね）'); return; }
      await importPosts(posts);
      setStatus(`${posts.length}件を取り込みました`);
    } catch (err) {
      setStatus('読み込みに失敗しました: ' + (err?.message || err));
    }
  };
  return (
    <label className="profile-edit import-row">
      <input type="file" accept=".zip,application/zip" onChange={onPick} hidden />
      Instagramの投稿を取り込む（公式エクスポートZIP）
      {status && <span className="import-status">{status}</span>}
    </label>
  );
}
```

- [ ] **Step 2: app.css に取り込み行のスタイルを追記**

```css
.import-row { display: flex; flex-direction: column; gap: 4px; text-align: center; cursor: pointer; }
.import-status { color: var(--ig-muted); font-size: 12px; font-weight: 400; }
```

- [ ] **Step 3: 起動確認＆Commit**

Run: `npm test`（既存5件 green）→ `npm run build`（成功）
`git add -A && git commit -m "feat: profile import button and demo toggle, own-only grid"`

---

## Task 11: 仕上げ・全体確認

- [ ] **Step 1: 最終確認**

Run: `npm test` → 5 passed / `npm run build` → 成功。
`npm run dev` をバックグラウンド起動し、`curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` が 200 を返すこと。確認後 kill。

- [ ] **Step 2: 必要なら微調整して Commit**

---

## 完了条件
- フィードに自分＋他人(デモ)の投稿が時系列で混ざる
- ストーリートレイに他人のリングが並び、タップでその人のストーリーが見られる
- リールタブが縦スクロールで流れる／検索タブにグリッドが出る
- プロフィールのグリッドは「自分の投稿だけ」
- 「Instagramの投稿を取り込む」で公式エクスポートZIPから昔の投稿が取り込め、グリッド/フィードに昔の投稿として並ぶ（日本語キャプションも文字化けしない）
- デモ表示ON/OFFが効く／`npm test` green・`npm run build` 成功
