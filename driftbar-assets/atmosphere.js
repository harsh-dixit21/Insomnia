(() => {
 const heading=document.querySelector('#interlude-title'),sentence=heading.textContent;
 heading.setAttribute('aria-label',sentence);heading.textContent='';
 sentence.split(' ').forEach(word=>{const span=document.createElement('span');span.className='reading-word';span.textContent=word;span.setAttribute('aria-hidden','true');heading.append(span,document.createTextNode(' '))});
 const media=gsap.matchMedia();
 media.add('(prefers-reduced-motion: no-preference)',()=>{
   let cleanup=()=>{};
   const scope=gsap.context(()=>{
     gsap.to('.cloud',{opacity:i=>[.23,.35,.4][i],duration:3,stagger:.4,ease:'sine.out'});
     const winds=[gsap.to('.cloud--far',{xPercent:12,yPercent:-3,duration:65,repeat:-1,yoyo:true,ease:'sine.inOut'}),gsap.to('.cloud--middle',{xPercent:19,yPercent:-7,duration:48,repeat:-1,yoyo:true,ease:'sine.inOut'}),gsap.to('.cloud--near',{xPercent:-13,yPercent:-6,duration:36,repeat:-1,yoyo:true,ease:'sine.inOut'})];
     ScrollTrigger.create({trigger:'.hero',start:'top bottom',end:'bottom top',onToggle:self=>winds.forEach(w=>self.isActive?w.play():w.pause())});
     const visibility=()=>winds.forEach(w=>document.hidden?w.pause():ScrollTrigger.isInViewport(document.querySelector('.hero'))&&w.play());document.addEventListener('visibilitychange',visibility);
     gsap.to('.cloudscape',{yPercent:-28,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.4}});
     gsap.fromTo('.reading-word',{opacity:.16,y:12},{opacity:1,y:0,stagger:.12,ease:'none',scrollTrigger:{trigger:'#interlude-title',start:'top 82%',end:'bottom 38%',scrub:.6}});
     gsap.fromTo('.interlude-window',{clipPath:'inset(0 24% 0 24% round 48% 48% 0 0)'},{clipPath:'inset(0 0% 0 0% round 0% 0% 0 0)',ease:'none',scrollTrigger:{trigger:'.interlude-window',start:'top 90%',end:'top 22%',scrub:1}});
     gsap.to('.interlude-window img',{yPercent:15,ease:'none',scrollTrigger:{trigger:'.interlude-window',start:'top bottom',end:'bottom top',scrub:1.2}});
     gsap.from('.sound i',{scaleY:.15,stagger:{each:.025,from:'center'},ease:'none',scrollTrigger:{trigger:'.experience',start:'top top',end:'+=65%',scrub:.4}});
     gsap.to('.orbit-lines circle:first-child',{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:'.experience',start:'top top-=170%',end:'bottom bottom',scrub:1}});
     gsap.from('.closing-line>span',{rotationX:-55,yPercent:105,opacity:0,stagger:.15,ease:'power3.out',duration:1.5,scrollTrigger:{trigger:'.closing',start:'top 60%',toggleActions:'play none none reverse'}});
     const listeners=[];
     document.querySelectorAll('.module').forEach(module=>{const toX=gsap.quickTo(module,'rotationX',{duration:.7,ease:'power2.out'});const move=e=>{const r=module.getBoundingClientRect();toX(((e.clientY-r.top)/r.height-.5)*-12)},leave=()=>toX(0);module.addEventListener('pointermove',move);module.addEventListener('pointerleave',leave);listeners.push(()=>{module.removeEventListener('pointermove',move);module.removeEventListener('pointerleave',leave)})});
     cleanup=()=>{document.removeEventListener('visibilitychange',visibility);listeners.forEach(f=>f())};
   });return()=>{cleanup();scope.revert()};
 });document.fonts.ready.then(()=>ScrollTrigger.refresh());
})();
