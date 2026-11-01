import {createContext,useContext,useState,useRef,useEffect,type ReactNode} from 'react';
import {seed,type State} from '@/lib/proofplan';
import {emptyWorkspace,validateWorkspace} from '@/lib/workspace-data';
export type Role='Buyer'|'Sales engineer'|'Security lead';
const key='proofplan-workspace-v1';
function load(){try{const raw=localStorage.getItem(key);if(raw)return validateWorkspace(JSON.parse(raw));}catch{}return emptyWorkspace();}
type ContextValue={state:State;role:Role;setRole:(r:Role)=>void;notice:string;notify:(message:string)=>void;update:(fn:(s:State)=>void,action:string)=>boolean;reset:()=>void;clear:()=>void;restore:(data:unknown)=>void};
const Context=createContext<ContextValue|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(load),[role,setRole]=useState<Role>('Buyer'),[notice,notify]=useState('');const current=useRef(state);current.current=state;
 useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key!==key||!event.newValue)return;try{const next=validateWorkspace(JSON.parse(event.newValue));current.current=next;setState(next);notify('Workspace updated in another tab.');}catch{notify('Another tab supplied invalid workspace data. Current data was kept.');}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
 function update(fn:(s:State)=>void,action:string){try{const next=structuredClone(current.current);fn(next);next.events.unshift({id:crypto.randomUUID(),action,date:new Date().toISOString()});const valid=validateWorkspace(next);localStorage.setItem(key,JSON.stringify(valid));current.current=valid;setState(valid);notify('Saved in this browser.');return true;}catch(error){notify(error instanceof Error?error.message:'Unable to save. Browser storage may be unavailable or full.');return false;}}
 function reset(){if(!confirm('Replace this browser workspace with the original sample data?'))return;update(s=>Object.assign(s,seed()),'Sample workspace restored.');}
 function clear(){if(confirm('Clear the browser workspace? Export a backup first if needed.'))update(s=>Object.assign(s,emptyWorkspace()),'Started an empty workspace.');}
 function restore(data:unknown){try{const restored=validateWorkspace(data);if(confirm('Replace the browser workspace with this backup?'))update(s=>Object.assign(s,restored),'Workspace restored from backup.');}catch(error){notify(error instanceof Error?error.message:'Invalid backup.');}}
 return <Context.Provider value={{state,role,setRole,notice,notify,update,reset,clear,restore}}>{children}</Context.Provider>;
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error('Workspace provider required');return value;}
