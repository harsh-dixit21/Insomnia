// Bind the actual server, rather than probing a port and racing another process.
export async function listen(server,{host,port,fallback=false}){
 const requested=port;
 for(let attempt=0;attempt<(fallback?20:1);attempt++){
  try{
   await new Promise((resolve,reject)=>{
    const onError=error=>{server.removeListener('listening',onListening);reject(error);};
    const onListening=()=>{server.removeListener('error',onError);resolve();};
    server.once('error',onError);server.once('listening',onListening);server.listen(port,host);
   });
   return server.address().port;
  }catch(error){if(error.code!=='EADDRINUSE'||!fallback||requested===0||port>=65535)throw error;port++;}
 }
 throw new Error(`No free development port found between ${requested} and ${port-1}.`);
}
