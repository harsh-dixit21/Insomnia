import {createContext,useContext,useState,useRef,type ReactNode} from 'react';
import {seed,type State} from '@/lib/proofplan';
export type Role='Buyer'|'Sales engineer'|'Security lead';
const key='proofplan-workspace-v1';
function load(){try{const state=JSON.parse(localStorage.getItem(key)||'null');if(state?.version===1&&Array.isArray(state.evaluations)&&Array.isArray(state.tests)&&Array.isArray(state.workloads)&&Array.isArray(state.events)&&state.settings)return state as State;}catch{}return seed();}
type ContextValue={state:State;role:Role;setRole:(r:Role)=>void;notice:string;notify:(message:string)=>void;update:(fn:(s:State)=>void,action:string)=>boolean;reset:()=>void};
const Context=createContext<ContextValue|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){
 const [state,setState]=useState<State>(load),[role,setRole]=useState<Role>('Buyer'),[notice,notify]=useState('');const current=useRef(state);current.current=state;
 function update(fn:(s:State)=>void,action:string){try{const next=structuredClone(current.current);fn(next);next.events.unshift({id:crypto.randomUUID(),action,date:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(next));current.current=next;setState(next);notify('Saved in this browser.');return true;}catch{notify('Unable to save. Browser storage may be unavailable or full.');return false;}}
 function reset(){if(!confirm('Replace this browser workspace with the original sample data?'))return;update(s=>Object.assign(s,seed()),'Sample workspace restored.');}
 return <Context.Provider value={{state,role,setRole,notice,notify,update,reset}}>{children}</Context.Provider>;
}
export function useWorkspace(){const value=useContext(Context);if(!value)throw new Error('Workspace provider required');return value;}
