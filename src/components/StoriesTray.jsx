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
