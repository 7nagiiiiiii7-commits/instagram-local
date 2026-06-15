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
