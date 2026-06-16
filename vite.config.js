import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages のプロジェクトページ用に、本番ビルドだけ base を /instagram-local/ にする。
// dev サーバはルート(/)のままなのでローカル開発は今まで通り。
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/instagram-local/' : '/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
}));
