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
