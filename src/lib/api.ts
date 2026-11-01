let csrf='';
export const setCsrf=(value:string)=>{csrf=value;};
export class ApiError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export async function api<T>(path:string,options:{method?:string;body?:unknown}={}):Promise<T>{
 const response=await fetch(path,{method:options.method||'GET',credentials:'same-origin',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json','X-Insomnia-Request':'1',...(csrf?{'X-CSRF-Token':csrf}:{})},...(options.body!==undefined?{body:JSON.stringify(options.body)}:{})});
 const data=await response.json().catch(()=>({error:'The API did not return valid JSON. Start the full-stack server with npm run dev.'}));
 if(!response.ok)throw new ApiError(response.status,data.error||'The request failed.');return data;
}
export async function downloadFromApi(kind:string,id?:string){
 const response=await fetch(`/api/export?kind=${encodeURIComponent(kind)}${id?'&id='+encodeURIComponent(id):''}`,{credentials:'same-origin',signal:AbortSignal.timeout(30000)});
 if(!response.ok){const body=await response.json();throw new ApiError(response.status,body.error||'Export failed.');}
 const name=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]||'insomnia-export.md';
 const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
