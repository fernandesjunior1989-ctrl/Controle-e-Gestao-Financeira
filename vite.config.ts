import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist');
        const indexPath = path.join(outDir, 'index.html');
        const redirectPath = path.join(outDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, redirectPath);
        }
      }
    }
  ],
  base: process.env.NODE_ENV === 'production' ? '/<Controle-Gestao-e-Financeira>/' : '/',
});