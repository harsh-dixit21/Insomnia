let csrf='';
import {ApiError,readApiResponse} from './api-response.ts';
export {ApiError} from './api-response.ts';
export const setCsrf=(value:string)=>{csrf=value;};
export async function api<T>(path:string,options:{method?:string;body?:unknown;timeoutMs?:number}={}):Promise<T>{
 let response:Response;
 try{response=await fetch(path,{method:options.method||'GET',credentials:'same-origin',signal:AbortSignal.timeout(options.timeoutMs||30000),headers:{'Content-Type':'application/json','X-Insomnia-Request':'1',...(csrf?{'X-CSRF-Token':csrf}:{})},...(options.body!==undefined?{body:JSON.stringify(options.body)}:{})});}
 catch(error){throw new ApiError(503,error instanceof Error&&error.name==='TimeoutError'?'The sign-in service took too long to respond. Please retry.':'Cannot reach the server. Check the connection and retry.');}
 return readApiResponse<T>(response);
}
export async function downloadFromApi(kind:string,id?:string){
 const response=await fetch(`/api/export?kind=${encodeURIComponent(kind)}${id?'&id='+encodeURIComponent(id):''}`,{credentials:'same-origin',signal:AbortSignal.timeout(30000)});
 if(!response.ok){await readApiResponse(response);throw new ApiError(response.status,'Export failed.');}
 if(/text\/html/i.test(response.headers.get('content-type')||''))throw new ApiError(503,'The export service is not connected on this address. Open the full-stack app and retry.');
 const name=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]||'insomnia-export.md';
 const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
