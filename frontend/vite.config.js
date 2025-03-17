import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 3000, // Combines your build settings
        outDir: 'dist',             // Combines your build settings
    },
    
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
