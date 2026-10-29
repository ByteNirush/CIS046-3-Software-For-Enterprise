// Purpose: Vite configuration with React plugin and /api development proxy.
// Author: [my name] | External/AI code in this file: none yet

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

