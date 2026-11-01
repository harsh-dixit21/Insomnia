import {lazy,Suspense,useEffect,useState} from 'react';
import {AuthPage} from './components/ui/auth-page';
const Dashboard=lazy(()=>import('./components/ui/app-1'));
export default function App(){
 const [route,setRoute]=useState(location.hash||'#auth');
 useEffect(()=>{const sync=()=>{setRoute(location.hash||'#auth');window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);
 return <Suspense fallback={<div role="status" className="grid min-h-screen place-items-center text-sm">Opening ProofPlan…</div>}>{route==='#auth'?<AuthPage/>:<Dashboard/>}</Suspense>;
}
