export class ApiError extends Error{
 status:number;
 constructor(status:number,message:string){super(message);this.name='ApiError';this.status=status;}
}
export async function readApiResponse<T>(response:Response):Promise<T>{
 const contentType=response.headers.get('content-type')||'';
 if(!/application\/(?:[a-z0-9.+-]*\+)?json\b/i.test(contentType)){
  throw new ApiError(503,'This address is not connected to the sign-in service. Open the full-stack app at http://127.0.0.1:5181/ and retry.');
 }
 let data:unknown;
 try{data=await response.json();}catch{throw new ApiError(502,'The server returned an incomplete response. Please retry.');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new ApiError(502,'The server returned an unexpected response. Please retry.');
 const body=data as Record<string,unknown>;
 if(!response.ok)throw new ApiError(response.status,typeof body.error==='string'?body.error:'The request failed. Please retry.');
 if('error' in body)throw new ApiError(502,typeof body.error==='string'?body.error:'The server could not complete the request.');
 return data as T;
}
