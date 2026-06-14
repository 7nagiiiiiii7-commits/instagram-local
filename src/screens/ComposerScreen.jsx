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
