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
