import {lazy,Suspense,useEffect,useState} from 'react';
import {AuthPage} from './components/ui/auth-page';
import {useWorkspace} from './components/workspace/store';
const Dashboard=lazy(()=>import('./components/ui/app-1'));
export default function App(){
 const{user,status}=useWorkspace();
 const [route,setRoute]=useState(location.hash||'#auth');
 useEffect(()=>{const sync=()=>{setRoute(location.hash||'#auth');window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);
 useEffect(()=>{if(user&&route==='#auth')location.hash='dashboard';},[user,route]);
 if(status==='loading')return <div role="status" className="grid min-h-screen place-items-center text-sm">Connecting to your workspace…</div>;
 return <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-sm">Opening Insomnia…</div>}>{!user?<AuthPage/>:<Dashboard/>}</Suspense>;
}
