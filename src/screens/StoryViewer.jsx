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
    if (!current) setOverlay(null); // 表示するストーリーが無ければ閉じる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

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

  if (!current) return null;
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
