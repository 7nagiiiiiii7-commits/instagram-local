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
