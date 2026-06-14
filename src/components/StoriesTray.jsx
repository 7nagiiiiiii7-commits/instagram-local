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
