import { useState } from 'react';
import { useStore } from '../store/StoreProvider.jsx';
import { useObjectURL } from '../hooks/useObjectURL.js';
import TopBar from '../components/TopBar.jsx';
import MediaItem from '../components/MediaItem.jsx';
import { CarouselIcon, VideoMarkIcon } from '../components/icons.jsx';
import { parseInstagramExport } from '../import/igImport.js';

function GridCell({ post, onClick }) {
  return (
    <button className="grid-cell" onClick={onClick}>
      <MediaItem media={post.media[0]} className="grid-img" />
      {post.media.length > 1 && <span className="grid-badge"><CarouselIcon /></span>}
      {post.media.length === 1 && post.media[0].kind === 'video' && <span className="grid-badge"><VideoMarkIcon /></span>}
    </button>
  );
}

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

export default function ProfileScreen() {
  const { profile, posts, setOverlay, importPosts, demoMode, setDemoMode } = useStore();
  const avatarUrl = useObjectURL(profile?.avatarBlob);
  const feed = posts.filter((p) => p.type === 'feed' && !p.author);

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
      <ImportRow importPosts={importPosts} />
      <button className="profile-edit" onClick={() => setDemoMode(!demoMode)}>
        デモ表示（他人の投稿/リール/検索）: {demoMode ? 'ON' : 'OFF'}
      </button>

      <div className="grid">
        {feed.map((p) => (
          <GridCell key={p.id} post={p} onClick={() => setOverlay({ kind: 'postDetail', id: p.id })} />
        ))}
      </div>
    </div>
  );
}
