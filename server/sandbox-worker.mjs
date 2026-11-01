import {parentPort,workerData} from 'node:worker_threads';
import {DatabaseSync,constants as c} from 'node:sqlite';
const db=new DatabaseSync(':memory:');
try{
 db.exec(`CREATE TABLE sales(id INTEGER PRIMARY KEY,region TEXT,revenue REAL,order_date TEXT);
 INSERT INTO sales VALUES(1,'North',1200,'2026-10-01'),(2,'South',800,'2026-10-01'),(3,'North',600,'2026-10-02'),(4,'West',1400,'2026-10-02');
 CREATE TABLE customers(id INTEGER PRIMARY KEY,name TEXT,region TEXT);
 INSERT INTO customers VALUES(1,'Example buyer A','North'),(2,'Example buyer B','South');`);
 db.setAuthorizer((action,arg1,arg2)=>{
  if(action===c.SQLITE_SELECT||action===c.SQLITE_READ)return c.SQLITE_OK;
  if(action===c.SQLITE_FUNCTION&&!['load_extension','readfile','writefile'].includes(String(arg2||arg1).toLowerCase()))return c.SQLITE_OK;
  return c.SQLITE_DENY;
 });
 const start=performance.now(),statement=db.prepare(workerData.sql),rows=[];
 for(const row of statement.iterate()){rows.push(row);if(rows.length>=101)break;}
 parentPort.postMessage({columns:statement.columns().map(c=>c.name),rows:rows.slice(0,100),truncated:rows.length>100,seconds:(performance.now()-start)/1000});
}catch{parentPort.postMessage({error:'Sandbox query rejected or invalid. Use a read-only SELECT on sales or customers.'});}
finally{db.close();}
