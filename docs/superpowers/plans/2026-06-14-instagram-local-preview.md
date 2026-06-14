# Instagram ローカル投稿プレビューアプリ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** インスタに投稿する前に「フィード投稿／ストーリー／プロフィールグリッド」が投稿後どう見えるかをローカルで確認できる、React製のインスタ風プレビューWebアプリを作る。

**Architecture:** React + Vite のSPA。状態は React Context（`StoreProvider`）に集約し、永続化は IndexedDB（メディアBlob＋メタデータ）。画面遷移は `tab` と `overlay` のUI状態で管理し、ルーターは使わない。データ層だけ Vitest でTDD、UIは起動して目視確認する。

**Tech Stack:** React 18, Vite, プレーンCSS（ダークなインスタ風トークン）, IndexedDB（自前ラッパー）, Vitest + fake-indexeddb。

---

## File Structure

```
instagram-local/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx                 # ReactDOM ルート + StoreProvider
    App.jsx                  # アプリシェル（タブ＋オーバーレイ切替）
    db/db.js                 # IndexedDB CRUD（profile / posts）
    db/db.test.js            # データ層ユニットテスト
    store/StoreProvider.jsx  # Context + 状態 + アクション + ナビ状態
    hooks/useObjectURL.js    # Blob→objectURL（自動revoke）
    components/
      icons.jsx              # インラインSVGアイコン群
      MediaItem.jsx          # 画像/動画の表示
      Carousel.jsx           # カルーセル（スワイプ＋ドット）
      PostCard.jsx           # フィード投稿カード
      StoriesTray.jsx        # ストーリーの横トレイ
      TabBar.jsx             # 下部タブ
      TopBar.jsx             # 上部バー（画面ごと）
    screens/
      FeedScreen.jsx
      ProfileScreen.jsx      # ヘッダー＋3列グリッド
      ProfileEditScreen.jsx
      ComposerScreen.jsx
      PostDetail.jsx
      StoryViewer.jsx
    styles/
      theme.css              # 配色トークン＋ベース
      app.css                # コンポーネント共通クラス
```

各ファイルは単一責務。`App.jsx` は遷移の交通整理のみ、画面の中身は `screens/` に置く。

---

## Task 1: プロジェクトの足場（Vite + React + Vitest）

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `.gitignore`

- [ ] **Step 1: git のローカルユーザーを設定（コミット用）**

```bash
git config user.name "Nagi"
git config user.email "7nagiiiiiii7@gmail.com"
```

- [ ] **Step 2: package.json を作成**

`package.json`:
```json
{
  "name": "instagram-local",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "fake-indexeddb": "^6.0.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 3: vite.config.js を作成**

`vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: index.html と .gitignore を作成**

`index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Instagram Local Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`.gitignore`:
```
node_modules
dist
.DS_Store
```

- [ ] **Step 5: 最小の main.jsx / App.jsx を作成**

`src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

`src/App.jsx`:
```jsx
export default function App() {
  return <div>Instagram Local Preview</div>;
}
```

- [ ] **Step 6: 依存をインストールして起動確認**

Run: `npm install && npm run dev`
Expected: Vite が起動し、表示URL（例 http://localhost:5173）で "Instagram Local Preview" が見える。確認したら Ctrl+C で停止。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Vitest project"
```

---

## Task 2: データ層 `db.js`（IndexedDB）— TDD

**Files:**
- Create: `src/db/db.js`, `src/db/db.test.js`

- [ ] **Step 1: 失敗するテストを書く**

`src/db/db.test.js`:
```js
import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import { getProfile, saveProfile, addPost, getPosts, deletePost, clearAll } from './db.js';

beforeEach(async () => {
  await clearAll();
});

describe('profile', () => {
  it('未保存ならデフォルトプロフィールを返す', async () => {
    const p = await getProfile();
    expect(p.username).toBe('your_username');
    expect(p.avatarBlob).toBeNull();
  });

  it('保存した内容が永続化される', async () => {
    await saveProfile({ username: 'nagi', displayName: 'Nagi', avatarBlob: null, bio: 'hi' });
    const p = await getProfile();
    expect(p.username).toBe('nagi');
    expect(p.bio).toBe('hi');
  });
});

describe('posts', () => {
  it('投稿を追加して一覧で取得できる', async () => {
    await addPost({ id: '1', type: 'feed', media: [], caption: 'a', likes: 0, createdAt: 100 });
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].caption).toBe('a');
  });

  it('新しい順で並ぶ', async () => {
    await addPost({ id: 'old', type: 'feed', media: [], caption: '', likes: 0, createdAt: 100 });
    await addPost({ id: 'new', type: 'feed', media: [], caption: '', likes: 0, createdAt: 200 });
    const posts = await getPosts();
    expect(posts[0].id).toBe('new');
  });

  it('投稿を削除できる', async () => {
    await addPost({ id: 'x', type: 'feed', media: [], caption: '', likes: 0, createdAt: 1 });
    await deletePost('x');
    const posts = await getPosts();
    expect(posts).toHaveLength(0);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npm test`
Expected: FAIL（`./db.js` が無い / 関数未定義）。

- [ ] **Step 3: db.js を実装**

`src/db/db.js`:
```js
const DB_NAME = 'instagram-local';
const DB_VERSION = 1;

const DEFAULT_PROFILE = {
  username: 'your_username',
  displayName: 'Your Name',
  avatarBlob: null,
  bio: '',
};

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }
      if (!db.objectStoreNames.contains('posts')) {
        db.createObjectStore('posts', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function store(db, name, mode) {
  return db.transaction(name, mode).objectStore(name);
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getProfile() {
  const db = await openDB();
  const result = await reqToPromise(store(db, 'profile', 'readonly').get('me'));
  return result ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(profile) {
  const db = await openDB();
  await reqToPromise(store(db, 'profile', 'readwrite').put(profile, 'me'));
  return profile;
}

export async function addPost(post) {
  const db = await openDB();
  await reqToPromise(store(db, 'posts', 'readwrite').put(post));
  return post;
}

export async function getPosts() {
  const db = await openDB();
  const all = await reqToPromise(store(db, 'posts', 'readonly').getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deletePost(id) {
  const db = await openDB();
  await reqToPromise(store(db, 'posts', 'readwrite').delete(id));
}

export async function clearAll() {
  const db = await openDB();
  const tx = db.transaction(['profile', 'posts'], 'readwrite');
  tx.objectStore('profile').clear();
  tx.objectStore('posts').clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `npm test`
Expected: PASS（5テスト全て green）。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add IndexedDB data layer for profile and posts"
```

---

## Task 3: Store（Context・状態・ナビ）

**Files:**
- Create: `src/store/StoreProvider.jsx`
- Modify: `src/main.jsx`

- [ ] **Step 1: StoreProvider を作成**

`src/store/StoreProvider.jsx`:
```jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as db from '../db/db.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ready, setReady] = useState(false);

  // ナビゲーション状態
  const [tab, setTab] = useState('home'); // 'home' | 'search' | 'create' | 'reels' | 'profile'
  const [overlay, setOverlay] = useState(null);
  // overlay: null | { kind:'story', startId } | { kind:'composer' }
  //        | { kind:'postDetail', id } | { kind:'editProfile' }

  useEffect(() => {
    (async () => {
      setProfile(await db.getProfile());
      setPosts(await db.getPosts());
      setReady(true);
    })();
  }, []);

  const addPost = useCallback(async (post) => {
    await db.addPost(post);
    setPosts(await db.getPosts());
  }, []);

  const removePost = useCallback(async (id) => {
    await db.deletePost(id);
    setPosts(await db.getPosts());
  }, []);

  const updateProfile = useCallback(async (next) => {
    await db.saveProfile(next);
    setProfile(next);
  }, []);

  const value = {
    profile, posts, ready,
    tab, setTab,
    overlay, setOverlay,
    addPost, removePost, updateProfile,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
```

- [ ] **Step 2: main.jsx で Provider を巻く**

`src/main.jsx` を以下に置き換え:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { StoreProvider } from './store/StoreProvider.jsx';
import './styles/theme.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
```

- [ ] **Step 3: 空のスタイルを用意（次タスクで埋める）**

`src/styles/theme.css`（空ファイルで可、内容は Task 4）と `src/styles/app.css`（空ファイルで可）を作成する。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add StoreProvider with state and navigation"
```

---

## Task 4: テーマ・アイコン・メディア表示の土台

**Files:**
- Create: `src/styles/theme.css`, `src/components/icons.jsx`, `src/hooks/useObjectURL.js`, `src/components/MediaItem.jsx`

- [ ] **Step 1: theme.css にダークなトークンとベースを書く**

`src/styles/theme.css`:
```css
:root {
  --ig-bg: #000000;
  --ig-surface: #121212;
  --ig-elevated: #1c1c1e;
  --ig-text: #f5f5f5;
  --ig-muted: #a8a8a8;
  --ig-border: #262626;
  --ig-accent: #0095f6;
  --ig-like: #ed4956;
  --ig-app-width: 430px;
}

* { box-sizing: border-box; }

html, body, #root {
  margin: 0;
  height: 100%;
  background: #0a0a0a;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Hiragino Sans", "Noto Sans JP", sans-serif;
  color: var(--ig-text);
  -webkit-font-smoothing: antialiased;
}

button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

img, video { display: block; }
```

- [ ] **Step 2: icons.jsx を作成（必要なSVGをまとめる）**

`src/components/icons.jsx`:
```jsx
const S = ({ children, size = 24, fill = 'none', stroke = 'currentColor', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const HeartIcon = ({ filled, ...p }) => (
  <S fill={filled ? 'var(--ig-like)' : 'none'} stroke={filled ? 'var(--ig-like)' : 'currentColor'} {...p}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </S>
);
export const CommentIcon = (p) => (
  <S {...p}><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-6A8.5 8.5 0 1 1 21 11.5z" /></S>
);
export const ShareIcon = (p) => (
  <S {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></S>
);
export const BookmarkIcon = (p) => (
  <S {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></S>
);
export const HomeIcon = ({ active, ...p }) => (
  <S fill={active ? 'currentColor' : 'none'} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></S>
);
export const SearchIcon = (p) => (
  <S {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
);
export const PlusIcon = (p) => (
  <S {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></S>
);
export const ReelsIcon = ({ active, ...p }) => (
  <S fill={active ? 'currentColor' : 'none'} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" /><path d="m10 8 5 4-5 4z" fill={active ? '#000' : 'currentColor'} stroke="none" />
  </S>
);
export const BackIcon = (p) => (<S {...p}><path d="M15 18 9 12l6-6" /></S>);
export const CloseIcon = (p) => (<S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>);
export const MoreIcon = (p) => (
  <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></S>
);
export const CarouselIcon = (p) => (
  <S size={18} {...p}><rect x="8" y="3" width="13" height="13" rx="2" /><path d="M3 8v11a2 2 0 0 0 2 2h11" /></S>
);
export const VideoMarkIcon = (p) => (
  <S size={18} fill="currentColor" stroke="none" {...p}><path d="M8 5v14l11-7z" /></S>
);
```

- [ ] **Step 3: useObjectURL フックを作成**

`src/hooks/useObjectURL.js`:
```js
import { useEffect, useState } from 'react';

export function useObjectURL(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}
```

- [ ] **Step 4: MediaItem を作成**

`src/components/MediaItem.jsx`:
```jsx
import { useObjectURL } from '../hooks/useObjectURL.js';

export default function MediaItem({ media, className, videoProps = {} }) {
  const url = useObjectURL(media?.blob);
  if (!url) return <div className={className} style={{ background: '#222' }} />;
  if (media.kind === 'video') {
    return <video className={className} src={url} muted loop playsInline autoPlay {...videoProps} />;
  }
  return <img className={className} src={url} alt="" />;
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add theme tokens, icons, object URL hook, MediaItem"
```

---

## Task 5: アプリシェル（上部バー・下部タブ・画面切替の骨組み）

**Files:**
- Create: `src/components/TabBar.jsx`, `src/components/TopBar.jsx`
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: TopBar を作成**

`src/components/TopBar.jsx`:
```jsx
export default function TopBar({ left, title, right }) {
  return (
    <header className="topbar">
      <div className="topbar-side">{left}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-right">{right}</div>
    </header>
  );
}
```

- [ ] **Step 2: TabBar を作成**

`src/components/TabBar.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { HomeIcon, SearchIcon, PlusIcon, ReelsIcon } from './icons.jsx';

export default function TabBar() {
  const { tab, setTab, setOverlay, profile } = useStore();
  const avatarUrl = useObjectURL(profile?.avatarBlob);
  return (
    <nav className="tabbar">
      <button onClick={() => setTab('home')}><HomeIcon active={tab === 'home'} /></button>
      <button onClick={() => setTab('search')}><SearchIcon /></button>
      <button onClick={() => setOverlay({ kind: 'composer' })}><PlusIcon /></button>
      <button onClick={() => setTab('reels')}><ReelsIcon active={tab === 'reels'} /></button>
      <button onClick={() => setTab('profile')} className="tabbar-avatar-btn">
        <span className={'tabbar-avatar' + (tab === 'profile' ? ' active' : '')}>
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}
        </span>
      </button>
    </nav>
  );
}
```

- [ ] **Step 3: App.jsx で画面切替の骨組みを作る（中身は仮）**

`src/App.jsx` を以下に置き換え:
```jsx
import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';

export default function App() {
  const { ready, tab } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <div style={{ padding: 16 }}>現在のタブ: {tab}</div>
        )}
      </div>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 4: app.css にシェル/バーのスタイルを書く**

`src/styles/app.css` に追記:
```css
.app-frame {
  position: relative;
  width: 100%;
  max-width: var(--ig-app-width);
  margin: 0 auto;
  height: 100dvh;
  background: var(--ig-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-screen { flex: 1; overflow-y: auto; overflow-x: hidden; }
.loading { display: grid; place-items: center; height: 100%; color: var(--ig-muted); }

.topbar {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
  height: 50px; padding: 0 14px;
  background: var(--ig-bg); border-bottom: 1px solid var(--ig-border);
}
.topbar-side { display: flex; align-items: center; gap: 18px; min-width: 40px; }
.topbar-right { justify-content: flex-end; }
.topbar-title { font-weight: 700; font-size: 16px; }

.tabbar {
  display: flex; align-items: center; justify-content: space-around;
  height: 50px; background: var(--ig-bg); border-top: 1px solid var(--ig-border);
}
.tabbar button { display: grid; place-items: center; width: 48px; height: 48px; }
.tabbar-avatar { display: block; width: 26px; height: 26px; border-radius: 50%; overflow: hidden; border: 1px solid transparent; }
.tabbar-avatar.active { border-color: var(--ig-text); }
.tabbar-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-fallback { display: block; width: 100%; height: 100%; background: linear-gradient(135deg,#555,#999); }
```

- [ ] **Step 5: 起動確認**

Run: `npm run dev`
Expected: 中央に端末幅の黒い枠、下にタブバー、本文に「現在のタブ: home」。タブを押すと文字が変わる。＋を押しても今は何も起きない（次タスク以降）。確認後 Ctrl+C。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell with top bar and bottom tab bar"
```

---

## Task 6: Carousel と PostCard

**Files:**
- Create: `src/components/Carousel.jsx`, `src/components/PostCard.jsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Carousel を作成（横スクロール＋ドット）**

`src/components/Carousel.jsx`:
```jsx
import { useRef, useState } from 'react';
import MediaItem from './MediaItem.jsx';

export default function Carousel({ media }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  return (
    <div className="carousel">
      <div className="carousel-track" ref={ref} onScroll={onScroll}>
        {media.map((m, i) => (
          <div className="carousel-slide" key={i}>
            <MediaItem media={m} className="post-media" />
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          <div className="carousel-counter">{index + 1}/{media.length}</div>
          <div className="carousel-dots">
            {media.map((_, i) => (
              <span key={i} className={'dot' + (i === index ? ' active' : '')} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: PostCard を作成**

`src/components/PostCard.jsx`:
```jsx
import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import Carousel from './Carousel.jsx';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MoreIcon } from './icons.jsx';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}秒前`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export default function PostCard({ post }) {
  const { profile } = useStore();
  const avatarUrl = useObjectURL(profile?.avatarBlob);
  const [liked, setLiked] = useState(false);
  const likeCount = (post.likes || 0) + (liked ? 1 : 0);

  return (
    <article className="postcard">
      <div className="postcard-head">
        <span className="avatar sm">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <span className="postcard-user">{profile?.username}</span>
        <button className="postcard-more"><MoreIcon /></button>
      </div>

      <div className="postcard-media" onDoubleClick={() => setLiked(true)}>
        <Carousel media={post.media} />
      </div>

      <div className="postcard-actions">
        <div className="left">
          <button onClick={() => setLiked((v) => !v)}><HeartIcon filled={liked} /></button>
          <button><CommentIcon /></button>
          <button><ShareIcon /></button>
        </div>
        <button className="right"><BookmarkIcon /></button>
      </div>

      {likeCount > 0 && <div className="postcard-likes">いいね！{likeCount.toLocaleString()}件</div>}
      {post.caption && (
        <div className="postcard-caption">
          <span className="postcard-user">{profile?.username}</span> {post.caption}
        </div>
      )}
      <div className="postcard-time">{timeAgo(post.createdAt)}</div>
    </article>
  );
}
```

- [ ] **Step 3: app.css に投稿カード/カルーセルのスタイルを追記**

```css
.avatar { display: inline-block; border-radius: 50%; overflow: hidden; background: #333; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar.sm { width: 32px; height: 32px; }

.postcard { border-bottom: 1px solid var(--ig-border); padding-bottom: 4px; }
.postcard-head { display: flex; align-items: center; gap: 10px; padding: 8px 12px; }
.postcard-user { font-weight: 600; font-size: 13px; }
.postcard-more { margin-left: auto; }

.carousel { position: relative; }
.carousel-track {
  display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.carousel-track::-webkit-scrollbar { display: none; }
.carousel-slide { flex: 0 0 100%; scroll-snap-align: center; }
.post-media { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; background: #111; }
.carousel-counter {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0,0,0,.6); color:#fff; font-size: 12px;
  padding: 2px 8px; border-radius: 12px;
}
.carousel-dots { position: absolute; bottom: 10px; left: 0; right: 0; display: flex; justify-content: center; gap: 4px; }
.carousel-dots .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.4); }
.carousel-dots .dot.active { background: var(--ig-accent); }

.postcard-actions { display: flex; align-items: center; padding: 8px 12px; }
.postcard-actions .left { display: flex; gap: 14px; }
.postcard-actions .right { margin-left: auto; }
.postcard-likes { padding: 0 12px; font-weight: 600; font-size: 13px; }
.postcard-caption { padding: 4px 12px 0; font-size: 13px; line-height: 1.4; }
.postcard-time { padding: 4px 12px 0; color: var(--ig-muted); font-size: 11px; text-transform: uppercase; }
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Carousel and PostCard components"
```

---

## Task 7: StoriesTray と FeedScreen

**Files:**
- Create: `src/components/StoriesTray.jsx`, `src/screens/FeedScreen.jsx`
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: StoriesTray を作成**

`src/components/StoriesTray.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import MediaItem from './MediaItem.jsx';

function StoryThumb({ post, onClick }) {
  return (
    <button className="story-thumb" onClick={onClick}>
      <span className="story-ring">
        <MediaItem media={post.media[0]} className="story-img" />
      </span>
      <span className="story-name">ストーリー</span>
    </button>
  );
}

export default function StoriesTray() {
  const { posts, profile, setOverlay } = useStore();
  const stories = posts.filter((p) => p.type === 'story');
  const avatarUrl = useObjectURL(profile?.avatarBlob);

  return (
    <div className="stories-tray">
      <button className="story-thumb" onClick={() => setOverlay({ kind: 'composer' })}>
        <span className="story-ring own">
          {avatarUrl ? <img className="story-img" src={avatarUrl} alt="" /> : <span className="avatar-fallback story-img" />}
          <span className="story-add">+</span>
        </span>
        <span className="story-name">あなた</span>
      </button>
      {stories.map((s) => (
        <StoryThumb key={s.id} post={s} onClick={() => setOverlay({ kind: 'story', startId: s.id })} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: FeedScreen を作成**

`src/screens/FeedScreen.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import TopBar from '../components/TopBar.jsx';
import StoriesTray from '../components/StoriesTray.jsx';
import PostCard from '../components/PostCard.jsx';
import { HeartIcon, ShareIcon } from '../components/icons.jsx';

export default function FeedScreen() {
  const { posts, setOverlay } = useStore();
  const feed = posts.filter((p) => p.type === 'feed');

  return (
    <div>
      <TopBar
        title={<span className="logo">Instagram</span>}
        right={<>
          <button onClick={() => setOverlay({ kind: 'composer' })}><HeartIcon /></button>
          <button onClick={() => setOverlay({ kind: 'composer' })}><ShareIcon /></button>
        </>}
      />
      <StoriesTray />
      {feed.length === 0 ? (
        <div className="empty">まだ投稿がありません。＋から投稿してみよう。</div>
      ) : (
        feed.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
```

- [ ] **Step 3: App.jsx でタブに応じて画面を出す**

`src/App.jsx` を以下に置き換え:
```jsx
import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';
import FeedScreen from './screens/FeedScreen.jsx';

export default function App() {
  const { ready, tab } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <>
            {tab === 'home' && <FeedScreen />}
            {tab !== 'home' && <div className="empty">この画面は準備中（{tab}）</div>}
          </>
        )}
      </div>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 4: app.css にストーリートレイ等を追記**

```css
.logo { font-family: "Snell Roundhand", "Brush Script MT", cursive; font-size: 24px; font-weight: 600; }
.empty { padding: 40px 20px; text-align: center; color: var(--ig-muted); font-size: 14px; }

.stories-tray { display: flex; gap: 14px; padding: 12px; overflow-x: auto; border-bottom: 1px solid var(--ig-border); scrollbar-width: none; }
.stories-tray::-webkit-scrollbar { display: none; }
.story-thumb { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 0 0 auto; width: 66px; }
.story-ring { position: relative; width: 62px; height: 62px; border-radius: 50%; padding: 2px;
  background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); display: grid; place-items: center; }
.story-ring.own { background: var(--ig-border); }
.story-img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--ig-bg); }
.story-add { position: absolute; right: -2px; bottom: -2px; width: 20px; height: 20px; border-radius: 50%;
  background: var(--ig-accent); color: #fff; display: grid; place-items: center; font-size: 15px; border: 2px solid var(--ig-bg); }
.story-name { font-size: 11px; color: var(--ig-text); max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

- [ ] **Step 5: 起動確認**

Run: `npm run dev`
Expected: ホームに Instagram ロゴ風タイトル、ストーリートレイ（「あなた」＋）、空メッセージが出る。確認後 Ctrl+C。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add stories tray and feed screen"
```

---

## Task 8: 投稿作成（Composer）

**Files:**
- Create: `src/screens/ComposerScreen.jsx`
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: ComposerScreen を作成**

`src/screens/ComposerScreen.jsx`:
```jsx
import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { CloseIcon } from '../components/icons.jsx';

function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
}

function Thumb({ media, onRemove }) {
  const url = useObjectURL(media.blob);
  return (
    <div className="composer-thumb">
      {media.kind === 'video'
        ? <video src={url} muted />
        : <img src={url} alt="" />}
      <button className="composer-thumb-x" onClick={onRemove}><CloseIcon size={14} /></button>
    </div>
  );
}

export default function ComposerScreen() {
  const { addPost, setOverlay, setTab } = useStore();
  const [type, setType] = useState('feed'); // 'feed' | 'story'
  const [media, setMedia] = useState([]);
  const [caption, setCaption] = useState('');
  const [likes, setLikes] = useState('');

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const added = files.map((f) => ({ kind: f.type.startsWith('video') ? 'video' : 'image', blob: f }));
    setMedia((prev) => (type === 'story' ? added.slice(0, 1) : [...prev, ...added]));
    e.target.value = '';
  };

  const removeAt = (i) => setMedia((prev) => prev.filter((_, j) => j !== i));

  const share = async () => {
    if (media.length === 0) return;
    await addPost({
      id: uid(),
      type,
      media: type === 'story' ? media.slice(0, 1) : media,
      caption: type === 'feed' ? caption : '',
      likes: Number(likes) || 0,
      createdAt: Date.now(),
    });
    setOverlay(null);
    setTab(type === 'story' ? 'home' : 'home');
  };

  return (
    <div className="overlay sheet">
      <TopBarLite onClose={() => setOverlay(null)} onShare={share} canShare={media.length > 0} />
      <div className="composer-body">
        <div className="seg">
          <button className={type === 'feed' ? 'on' : ''} onClick={() => { setType('feed'); }}>フィード投稿</button>
          <button className={type === 'story' ? 'on' : ''} onClick={() => { setType('story'); setMedia((m) => m.slice(0, 1)); }}>ストーリー</button>
        </div>

        <label className="composer-drop">
          <input type="file" accept="image/*,video/*" multiple={type === 'feed'} onChange={onFiles} hidden />
          {media.length === 0 ? <span>写真・動画を選択{type === 'feed' ? '（複数可）' : ''}</span> : <span>追加で選ぶ</span>}
        </label>

        {media.length > 0 && (
          <div className="composer-thumbs">
            {media.map((m, i) => <Thumb key={i} media={m} onRemove={() => removeAt(i)} />)}
          </div>
        )}

        {type === 'feed' && (
          <>
            <textarea className="composer-input" placeholder="キャプションを入力…" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <input className="composer-likes" type="number" placeholder="いいね数（任意）" value={likes} onChange={(e) => setLikes(e.target.value)} />
          </>
        )}
      </div>
    </div>
  );
}

function TopBarLite({ onClose, onShare, canShare }) {
  return (
    <header className="topbar">
      <div className="topbar-side"><button onClick={onClose}><CloseIcon /></button></div>
      <div className="topbar-title">新規投稿</div>
      <div className="topbar-side topbar-right">
        <button className={'share-btn' + (canShare ? '' : ' disabled')} disabled={!canShare} onClick={onShare}>シェア</button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: App.jsx にオーバーレイ表示を追加**

`src/App.jsx` を以下に置き換え:
```jsx
import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';
import FeedScreen from './screens/FeedScreen.jsx';
import ComposerScreen from './screens/ComposerScreen.jsx';

export default function App() {
  const { ready, tab, overlay } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <>
            {tab === 'home' && <FeedScreen />}
            {tab !== 'home' && <div className="empty">この画面は準備中（{tab}）</div>}
          </>
        )}
      </div>
      <TabBar />
      {overlay?.kind === 'composer' && <ComposerScreen />}
    </div>
  );
}
```

- [ ] **Step 3: app.css にコンポーザー/オーバーレイのスタイルを追記**

```css
.overlay { position: absolute; inset: 0; z-index: 20; background: var(--ig-bg); display: flex; flex-direction: column; }
.composer-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
.seg { display: flex; background: var(--ig-elevated); border-radius: 10px; padding: 3px; }
.seg button { flex: 1; padding: 8px; border-radius: 8px; color: var(--ig-muted); font-weight: 600; font-size: 13px; }
.seg button.on { background: #2c2c2e; color: var(--ig-text); }
.composer-drop { display: grid; place-items: center; height: 120px; border: 1px dashed var(--ig-border); border-radius: 12px; color: var(--ig-muted); font-size: 14px; }
.composer-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
.composer-thumb { position: relative; width: 84px; height: 105px; border-radius: 8px; overflow: hidden; background: #111; }
.composer-thumb img, .composer-thumb video { width: 100%; height: 100%; object-fit: cover; }
.composer-thumb-x { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,.6); border-radius: 50%; width: 22px; height: 22px; display: grid; place-items: center; }
.composer-input { width: 100%; min-height: 80px; background: transparent; border: 1px solid var(--ig-border); border-radius: 10px; color: var(--ig-text); padding: 10px; resize: vertical; }
.composer-likes { width: 100%; background: transparent; border: 1px solid var(--ig-border); border-radius: 10px; color: var(--ig-text); padding: 10px; }
.share-btn { color: var(--ig-accent); font-weight: 700; }
.share-btn.disabled { opacity: .4; }
```

- [ ] **Step 4: 起動確認（投稿フロー）**

Run: `npm run dev`
手順: ＋を押す → 「フィード投稿」で画像を選ぶ → キャプション入力 → シェア → ホームのフィードに投稿が出る。ストーリーでも同様に試し、トレイにサムネが増えることを確認。確認後 Ctrl+C。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add post composer for feed and story"
```

---

## Task 9: プロフィール画面（ヘッダー＋グリッド）と投稿詳細

**Files:**
- Create: `src/screens/ProfileScreen.jsx`, `src/screens/PostDetail.jsx`
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: ProfileScreen を作成**

`src/screens/ProfileScreen.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import TopBar from '../components/TopBar.jsx';
import MediaItem from '../components/MediaItem.jsx';
import { CarouselIcon, VideoMarkIcon } from '../components/icons.jsx';

function GridCell({ post, onClick }) {
  return (
    <button className="grid-cell" onClick={onClick}>
      <MediaItem media={post.media[0]} className="grid-img" />
      {post.media.length > 1 && <span className="grid-badge"><CarouselIcon /></span>}
      {post.media.length === 1 && post.media[0].kind === 'video' && <span className="grid-badge"><VideoMarkIcon /></span>}
    </button>
  );
}

export default function ProfileScreen() {
  const { profile, posts, setOverlay } = useStore();
  const avatarUrl = useObjectURL(profile?.avatarBlob);
  const feed = posts.filter((p) => p.type === 'feed');

  return (
    <div>
      <TopBar title={<span style={{ fontWeight: 700 }}>{profile?.username}</span>} />
      <div className="profile-head">
        <span className="avatar lg">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <div className="profile-stats">
          <div><b>{feed.length}</b><span>投稿</span></div>
          <div><b>0</b><span>フォロワー</span></div>
          <div><b>0</b><span>フォロー中</span></div>
        </div>
      </div>
      <div className="profile-bio">
        <div className="profile-name">{profile?.displayName}</div>
        {profile?.bio && <div className="profile-bio-text">{profile.bio}</div>}
      </div>
      <button className="profile-edit" onClick={() => setOverlay({ kind: 'editProfile' })}>プロフィールを編集</button>

      <div className="grid">
        {feed.map((p) => (
          <GridCell key={p.id} post={p} onClick={() => setOverlay({ kind: 'postDetail', id: p.id })} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: PostDetail を作成**

`src/screens/PostDetail.jsx`:
```jsx
import { useStore } from '../store/StoreProvider.jsx';
import PostCard from '../components/PostCard.jsx';
import { BackIcon } from '../components/icons.jsx';

export default function PostDetail({ id }) {
  const { posts, setOverlay } = useStore();
  const post = posts.find((p) => p.id === id);
  return (
    <div className="overlay">
      <header className="topbar">
        <div className="topbar-side"><button onClick={() => setOverlay(null)}><BackIcon /></button></div>
        <div className="topbar-title">投稿</div>
        <div className="topbar-side" />
      </header>
      <div className="app-screen">
        {post ? <PostCard post={post} /> : <div className="empty">投稿が見つかりません</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: App.jsx にプロフィールタブと2つのオーバーレイを追加**

`src/App.jsx` を以下に置き換え:
```jsx
import { useStore } from './store/StoreProvider.jsx';
import TabBar from './components/TabBar.jsx';
import FeedScreen from './screens/FeedScreen.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import ComposerScreen from './screens/ComposerScreen.jsx';
import PostDetail from './screens/PostDetail.jsx';

export default function App() {
  const { ready, tab, overlay } = useStore();
  return (
    <div className="app-frame">
      <div className="app-screen">
        {!ready ? <div className="loading">…</div> : (
          <>
            {tab === 'home' && <FeedScreen />}
            {tab === 'profile' && <ProfileScreen />}
            {tab !== 'home' && tab !== 'profile' && <div className="empty">この画面は準備中（{tab}）</div>}
          </>
        )}
      </div>
      <TabBar />
      {overlay?.kind === 'composer' && <ComposerScreen />}
      {overlay?.kind === 'postDetail' && <PostDetail id={overlay.id} />}
    </div>
  );
}
```

- [ ] **Step 4: app.css にプロフィール/グリッドのスタイルを追記**

```css
.avatar.lg { width: 84px; height: 84px; }
.profile-head { display: flex; align-items: center; gap: 24px; padding: 16px; }
.profile-stats { display: flex; gap: 22px; flex: 1; justify-content: space-around; }
.profile-stats div { display: flex; flex-direction: column; align-items: center; font-size: 13px; }
.profile-stats b { font-size: 16px; }
.profile-stats span { color: var(--ig-muted); }
.profile-bio { padding: 0 16px; }
.profile-name { font-weight: 600; font-size: 14px; }
.profile-bio-text { font-size: 13px; color: var(--ig-text); white-space: pre-wrap; }
.profile-edit { display: block; width: calc(100% - 32px); margin: 14px 16px; padding: 8px; background: var(--ig-elevated); border-radius: 8px; font-weight: 600; font-size: 13px; }

.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.grid-cell { position: relative; aspect-ratio: 1; background: #111; }
.grid-img { width: 100%; height: 100%; object-fit: cover; }
.grid-badge { position: absolute; top: 6px; right: 6px; color: #fff; filter: drop-shadow(0 1px 2px rgba(0,0,0,.6)); }
```

- [ ] **Step 5: 起動確認**

Run: `npm run dev`
プロフィールタブを開く → 投稿数とグリッドが出る → グリッドをタップで投稿詳細が開き、戻れる。確認後 Ctrl+C。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add profile screen with grid and post detail"
```

---

## Task 10: プロフィール編集

**Files:**
- Create: `src/screens/ProfileEditScreen.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: ProfileEditScreen を作成**

`src/screens/ProfileEditScreen.jsx`:
```jsx
import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import { CloseIcon } from '../components/icons.jsx';

export default function ProfileEditScreen() {
  const { profile, updateProfile, setOverlay } = useStore();
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarBlob, setAvatarBlob] = useState(profile.avatarBlob);
  const avatarUrl = useObjectURL(avatarBlob);

  const onAvatar = (e) => {
    const f = e.target.files?.[0];
    if (f) setAvatarBlob(f);
    e.target.value = '';
  };

  const save = async () => {
    await updateProfile({ username: username.trim() || 'your_username', displayName, bio, avatarBlob });
    setOverlay(null);
  };

  return (
    <div className="overlay">
      <header className="topbar">
        <div className="topbar-side"><button onClick={() => setOverlay(null)}><CloseIcon /></button></div>
        <div className="topbar-title">プロフィールを編集</div>
        <div className="topbar-side topbar-right"><button className="share-btn" onClick={save}>完了</button></div>
      </header>
      <div className="composer-body">
        <label className="edit-avatar">
          <input type="file" accept="image/*" onChange={onAvatar} hidden />
          <span className="avatar lg">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
          <span className="edit-avatar-link">写真を変更</span>
        </label>
        <Field label="ユーザーネーム" value={username} onChange={setUsername} />
        <Field label="名前" value={displayName} onChange={setDisplayName} />
        <Field label="自己紹介" value={bio} onChange={setBio} textarea />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
```

- [ ] **Step 2: App.jsx に editProfile オーバーレイを追加**

`src/App.jsx` の import に追加:
```jsx
import ProfileEditScreen from './screens/ProfileEditScreen.jsx';
```
`</TabBar>` の下のオーバーレイ群に追加:
```jsx
      {overlay?.kind === 'editProfile' && <ProfileEditScreen />}
```

- [ ] **Step 3: app.css に編集フォームのスタイルを追記**

```css
.edit-avatar { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.edit-avatar-link { color: var(--ig-accent); font-weight: 600; font-size: 13px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { color: var(--ig-muted); font-size: 12px; }
.field input, .field textarea { background: transparent; border: none; border-bottom: 1px solid var(--ig-border); color: var(--ig-text); padding: 8px 0; font-size: 15px; }
.field textarea { min-height: 60px; resize: vertical; }
```

- [ ] **Step 4: 起動確認**

Run: `npm run dev`
プロフィール → 「プロフィールを編集」→ ユーザー名・名前・bio・アイコンを変えて「完了」→ プロフィールと投稿カードのユーザー名/アイコンに反映され、リロードしても保持される。確認後 Ctrl+C。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add profile editing"
```

---

## Task 11: ストーリービューア（全画面・自動送り）

**Files:**
- Create: `src/screens/StoryViewer.jsx`
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: StoryViewer を作成**

`src/screens/StoryViewer.jsx`:
```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import MediaItem from '../components/MediaItem.jsx';
import { CloseIcon, HeartIcon, ShareIcon } from '../components/icons.jsx';

const IMAGE_MS = 5000;

export default function StoryViewer() {
  const { posts, profile, overlay, setOverlay } = useStore();
  const stories = useMemo(() => posts.filter((p) => p.type === 'story'), [posts]);
  const startIndex = Math.max(0, stories.findIndex((s) => s.id === overlay.startId));
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const avatarUrl = useObjectURL(profile?.avatarBlob);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  const current = stories[index];

  const next = () => {
    if (index < stories.length - 1) { setIndex((i) => i + 1); setProgress(0); }
    else setOverlay(null);
  };
  const prev = () => {
    if (index > 0) { setIndex((i) => i - 1); setProgress(0); }
  };

  useEffect(() => {
    if (!current || current.media[0]?.kind === 'video') return; // 動画は onEnded で送る
    startRef.current = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / IMAGE_MS);
      setProgress(p);
      if (p >= 1) next();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current]);

  if (!current) { setOverlay(null); return null; }
  const isVideo = current.media[0]?.kind === 'video';

  return (
    <div className="story-viewer">
      <div className="story-bars">
        {stories.map((_, i) => (
          <span key={i} className="story-bar">
            <span className="story-bar-fill" style={{ width: i < index ? '100%' : i === index ? `${progress * 100}%` : '0%' }} />
          </span>
        ))}
      </div>
      <div className="story-top">
        <span className="avatar sm">{avatarUrl ? <img src={avatarUrl} alt="" /> : <span className="avatar-fallback" />}</span>
        <span className="story-user">{profile?.username}</span>
        <button className="story-close" onClick={() => setOverlay(null)}><CloseIcon /></button>
      </div>

      <MediaItem
        key={current.id}
        media={current.media[0]}
        className="story-media"
        videoProps={isVideo ? { onEnded: next, loop: false } : {}}
      />

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

- [ ] **Step 2: App.jsx に story オーバーレイを追加**

`src/App.jsx` の import に追加:
```jsx
import StoryViewer from './screens/StoryViewer.jsx';
```
オーバーレイ群に追加:
```jsx
      {overlay?.kind === 'story' && <StoryViewer />}
```

- [ ] **Step 3: app.css にストーリービューアのスタイルを追記**

```css
.story-viewer { position: absolute; inset: 0; z-index: 30; background: #000; display: flex; flex-direction: column; }
.story-bars { display: flex; gap: 4px; padding: 10px 8px 4px; }
.story-bar { flex: 1; height: 2.5px; background: rgba(255,255,255,.3); border-radius: 2px; overflow: hidden; }
.story-bar-fill { display: block; height: 100%; background: #fff; }
.story-top { display: flex; align-items: center; gap: 10px; padding: 6px 12px; position: relative; z-index: 2; }
.story-user { font-weight: 600; font-size: 13px; }
.story-close { margin-left: auto; }
.story-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; z-index: 0; }
.story-tap { position: absolute; top: 60px; bottom: 70px; width: 35%; z-index: 1; }
.story-tap.left { left: 0; }
.story-tap.right { right: 0; }
.story-bottom { margin-top: auto; display: flex; align-items: center; gap: 12px; padding: 14px 12px; position: relative; z-index: 2; }
.story-reply { flex: 1; background: transparent; border: 1px solid rgba(255,255,255,.5); border-radius: 22px; color: #fff; padding: 10px 14px; }
```

- [ ] **Step 4: 起動確認**

Run: `npm run dev`
ストーリーを投稿 → トレイのサムネをタップ → 全画面で進行バーが進み、画像は5秒/動画は尺で自動送り、左右タップで前後、×で閉じる。確認後 Ctrl+C。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add full-screen story viewer with auto-advance"
```

---

## Task 12: 仕上げ（プレースホルダタブの体裁・全体目視）

**Files:**
- Modify: `src/App.jsx`, `src/styles/app.css`

- [ ] **Step 1: 準備中タブ（検索/リール）を簡素な体裁にする**

`src/App.jsx` の準備中の行を以下に差し替え:
```jsx
            {tab !== 'home' && tab !== 'profile' && (
              <div className="placeholder-tab">
                <div className="empty">「{tab === 'search' ? '検索' : 'リール'}」はこのプレビューでは未対応です。<br/>ホーム・プロフィール・＋投稿・ストーリーをお試しください。</div>
              </div>
            )}
```

- [ ] **Step 2: app.css に微調整を追記**

```css
.placeholder-tab { display: grid; place-items: center; height: 100%; }
```

- [ ] **Step 3: テストと一連フローの最終確認**

Run: `npm test`
Expected: PASS（データ層テスト全て green）。

Run: `npm run dev`
確認チェックリスト（全部 OK か目視）:
- プロフィール編集でユーザー名/アイコンを設定 → 各所に反映
- フィード投稿（1枚／カルーセル複数／動画）→ ホームに表示、カルーセルはスワイプ＋ドット
- 同じ投稿がプロフィールのグリッドに出る（カルーセル/動画バッジ付き）→ タップで詳細
- ストーリー投稿 → トレイ → 全画面ビューア（自動送り・左右タップ・閉じる）
- いいねボタンのトグル＋ダブルタップ
- リロードしても投稿・プロフィールが残る（IndexedDB 永続化）

確認後 Ctrl+C。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: tidy placeholder tabs and finalize preview app"
```

---

## 完了条件（Definition of Done）

- `npm test` が green（データ層）
- `npm run dev` で上記チェックリストが全て手元で再現できる
- フィード/ストーリー/プロフィールグリッドの「投稿後の見え方」がインスタ風に確認できる
- すべてローカル完結（外部通信なし）、リロードで状態保持
