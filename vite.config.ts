import { defineConfig,loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,new URL('.',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),'INSOMNIA_');
 // Preserve the browser's Host and Origin through the local proxy so session
 // cookies and the backend's CSRF origin check continue to use the same origin.
 const proxy={'/api':{target:`http://127.0.0.1:${env.INSOMNIA_PORT||5181}`,changeOrigin:false}};
 return {plugins:[react(),tailwindcss()],server:{proxy,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.data/**','**/.reference/**','**/server/**','**/*.sqlite','**/*.sqlite-*']}},preview:{proxy},resolve:{alias:{'@':new URL('./src',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')}},build:{rollupOptions:{input:{landing:'index.html',portal:'portal/index.html'}}}};
});
