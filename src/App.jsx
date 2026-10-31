import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import TechText from './TechText';
const MeadowScene = lazy(() => import('./MeadowScene'));
gsap.registerPlugin(ScrollTrigger, useGSAP);

const VIDEO='https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/4d01c727-d9c5-47c8-a778-35a451ffd39f.mp4';
const POSTER='https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261014_121838_c97d0940-f430-4304-8573-4f47ee44f447.png';
const Arrow=()=> <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg>;

export default function App(){
  const root=useRef(null), video=useRef(null), dialog=useRef(null);
  const motion=useRef({progress:0,reduced:false}), paused=useRef(false);
  const [isPaused,setPaused]=useState(false), [reduced,setReduced]=useState(false), [workload,setWorkload]=useState('Reporting'), [generated,setGenerated]=useState(false);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{ motion.current.reduced=media.matches; setReduced(media.matches); };
    update(); media.addEventListener('change',update);
    return ()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{ paused.current=isPaused; if(isPaused||reduced) video.current?.pause(); else video.current?.play().catch(()=>{}); },[isPaused,reduced]);
  useGSAP(()=>{
    const mm=gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)',()=>{
      gsap.from('.hero-one .entrance',{y:24,opacity:0,duration:.9,stagger:.08,ease:'power3.out'});
      const timeline=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.journey',start:'top top',end:'bottom bottom',scrub:.45,invalidateOnRefresh:true}});
      timeline.to(motion.current,{progress:1,duration:1},0)
        .to('.hero-one',{y:-75,autoAlpha:0,duration:.2},.13)
        .to('.landscape',{scale:1.12,yPercent:-5,duration:1},0)
        .fromTo('.hero-two',{autoAlpha:0,y:55},{autoAlpha:1,y:0,duration:.2},.59)
        .to('.glass-wordmark',{yPercent:25,opacity:0,duration:.25},.14)
        .fromTo('.second-wordmark',{yPercent:30,opacity:0},{yPercent:0,opacity:1,duration:.24},.64)
        .to('.scene-count-one',{autoAlpha:0,duration:.1},.43)
        .to('.scene-count-two',{autoAlpha:1,duration:.1},.56);
      return ()=>{motion.current.progress=0;};
    });
    document.fonts.ready.then(()=>ScrollTrigger.refresh());
    return ()=>mm.revert();
  },{scope:root});
  const goSecond=()=>{ const journey=root.current.querySelector('.journey'); window.scrollTo({top:reduced?root.current.querySelector('.hero-two').offsetTop:journey.offsetTop+(journey.offsetHeight-innerHeight)*.91,behavior:reduced?'instant':'smooth'}); };
  const openPlan=()=>{setGenerated(false);dialog.current.showModal();};
  const download=()=>{
    const content=`# Example IOMETE evaluation plan\n\nWorkload: ${workload}\nStatus: Proposed tests, not measured results.\n\n| Test | Acceptance criterion | Evidence |\n| --- | --- | --- |\n| Report correctness | Reconcile against buyer-approved source results | Unknown until tested |\n| Critical report latency | Buyer must supply target and concurrency | Unknown until measured |\n| Infrastructure readiness | Confirm Kubernetes, object storage, and PostgreSQL | https://iomete.com/resources/deployment/on-prem/install |\n\nOwner and test dataset must be agreed before evaluation.\n`;
    const url=URL.createObjectURL(new Blob([content],{type:'text/markdown'})); const a=document.createElement('a');a.href=url;a.download='proofplan-example.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div ref={root} className={reduced?'app reduced':'app'}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header><a className="brand" href="#main" aria-label="ProofPlan home"><span className="brand-mark"><i/><i/><i/></span>ProofPlan<span className="byline">for IOMETE</span></a><nav aria-label="Main navigation"><button onClick={goSecond}>The approach</button><a href="https://iomete.com/resources" target="_blank" rel="noreferrer">Explore IOMETE <span>↗</span></a></nav><button className="header-cta" onClick={openPlan}>Find your starting point <Arrow/></button></header>
    <main id="main">
      <div className="journey"><div className="sticky-stage">
        <div className="landscape" aria-hidden="true"><video ref={video} src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="metadata"/><div className="paper-haze"/></div>
        <section className="hero hero-one" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow entrance">A clearer path to your data lakehouse</p><h1 id="hero-title" className="entrance"><span className="sr-only">Clarity before commitment.</span><span aria-hidden="true">Clarity before</span><span className="tech-heading" aria-hidden="true"><TechText text="commitment." fontSize={124} fontWeight={500} align="left" color="#343743" accentColor="#626a88" reveal={reduced?'off':'letter'} intro="none" sweep={!isPaused&&!reduced} specks={12} clickKick={!reduced} draggable={!reduced} labels={false}/></span></h1><p className="intro entrance">Big platform decisions deserve a clear view.<br/>Turn your IOMETE questions into a plan built on proof.</p><div className="actions entrance"><button className="primary" onClick={openPlan}>Map your evaluation <Arrow/></button><button className="text-button" onClick={goSecond}>See the approach <span>↘</span></button></div></div>
          <p className="side-note">Your infrastructure.<br/>Your questions.<br/>A way forward.</p>
        </section>
        <p className="glass-wordmark" aria-hidden="true">ProofPlan</p>
        <section className="hero hero-two" aria-labelledby="second-title"><div className="hero-copy"><p className="eyebrow">From uncertainty to a shared plan</p><h2 id="second-title">A better decision.<br/><span>Built on proof.</span></h2><p className="intro">Know what fits. See what’s missing.<br/>Agree on what to test before you make the move.</p><button className="primary" onClick={openPlan}>Build an example plan <Arrow/></button></div><div className="proof-note"><span className="note-caption">A question becomes a test</span><p>“Will our critical<br/>reports stay fast?”</p><div className="note-answer"><span>Proposed test</span><strong>Benchmark your workload.</strong><small>Your data. Your target. Measured results.</small></div><a href="https://iomete.com/resources/blog/oracle-to-spark-migration" target="_blank" rel="noreferrer">Why workload-level proof matters ↗</a></div></section>
        <p className="second-wordmark" aria-hidden="true">Move with clarity.</p>
        <Suspense fallback={null}><MeadowScene motion={motion} paused={paused}/></Suspense>
        <div className="bottom-fog" aria-hidden="true"/>
        <div className="scene-bottom"><button className="scroll-cue" onClick={goSecond}><span className="scroll-icon">↓</span><span>Scroll into clarity</span></button><div className="scene-count"><span className="scene-count-one">1 / 2 &nbsp; The possibility</span><span className="scene-count-two">2 / 2 &nbsp; The proof</span></div><button className="motion-control" aria-label={isPaused?'Resume ambient motion':'Pause ambient motion'} aria-pressed={isPaused} onClick={()=>setPaused(!isPaused)}>{isPaused?'▶':'Ⅱ'} <span>{isPaused?'Resume motion':'Pause motion'}</span></button></div>
      </div></div>
      <footer><a className="brand" href="#main">ProofPlan</a><p>An independent hackCBS concept for the IOMETE track.</p><a href="https://github.com/harsh-dixit21/Insomnia/blob/main/IOMETE_PROOFPLAN.md" target="_blank" rel="noreferrer">Read the proposal ↗</a></footer>
    </main>
    <dialog ref={dialog} onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><button className="close" aria-label="Close example plan" onClick={()=>dialog.current.close()}>×</button><p className="eyebrow">Your first step</p><h2>A question.<br/>Then a plan.</h2><p>Explore a small example of an IOMETE evaluation. Acceptance targets and owners need your team's input.</p><label htmlFor="workload">What are you evaluating?</label><select id="workload" value={workload} onChange={e=>{setWorkload(e.target.value);setGenerated(false);}}><option>Reporting</option><option>Batch analytics</option><option>Data platform consolidation</option></select>{!generated?<button className="primary" onClick={()=>setGenerated(true)}>Create example <Arrow/></button>:<div className="plan-result" role="status"><h3>{workload}: proposed evaluation</h3><ul><li>Reconcile results with your existing system.</li><li>Set latency and concurrency targets.</li><li>Confirm Kubernetes, storage, and PostgreSQL readiness.</li></ul><p>Performance and infrastructure fit remain unverified.</p><button className="primary" onClick={download}>Download Markdown <Arrow/></button></div>}</dialog>
  </div>;
}
