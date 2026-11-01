import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()], server:{fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.data/**','**/.reference/**','**/server/**','**/*.sqlite','**/*.sqlite-*']}}, resolve: { alias: { '@': new URL('./src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1') } }, build: {rollupOptions: {input: {landing:'index.html',portal:'portal/index.html'}}} });
