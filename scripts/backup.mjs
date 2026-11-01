import {DatabaseSync,backup} from 'node:sqlite';import {resolve,dirname} from 'node:path';import {mkdir} from 'node:fs/promises';
const source=resolve(process.env.INSOMNIA_DB||'.data/insomnia.sqlite'),destination=resolve(process.argv[2]||`.data/backups/insomnia-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`);
if(source===destination)throw new Error('Backup destination must differ from the database.');
await mkdir(dirname(destination),{recursive:true});const db=new DatabaseSync(source,{readOnly:true});
try{await backup(db,destination);const check=new DatabaseSync(destination,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Backup integrity check failed.');}finally{check.close();}console.log(`Verified backup: ${destination}`);}finally{db.close();}
