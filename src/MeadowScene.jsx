import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// The meadow has real depth: displaced terrain, a perspective camera and fireflies.
// A separate screen-space WebGL pass creates the continuous cloud curtain.
export default function MeadowScene({ motion, paused }) {
  const host = useRef(null);
  useEffect(() => {
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { host.current.dataset.fallback = 'true'; return; }
    const node = host.current;
    node.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.autoClear = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
    camera.position.set(0, 3, 13);
    camera.lookAt(0, 2, 0);
    const terrain = new THREE.PlaneGeometry(52, 30, 100, 65);
    terrain.rotateX(-Math.PI / 2);
    const positions = terrain.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      positions.setY(i, Math.sin(x * .14 + z * .12) * 1.1 + Math.cos(x * .23 - z * .18) * .5);
    }
    terrain.computeVertexNormals();
    const groundMaterial = new THREE.MeshStandardMaterial({ color: '#6c7897', transparent: true, opacity: .2, roughness: .85 });
    const ground = new THREE.Mesh(terrain, groundMaterial);
    ground.position.set(0, -5.3, -8);
    scene.add(ground, new THREE.HemisphereLight('#e8d8ff', '#384e4a', 3));
    const dots = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) { dots[i*3] = Math.sin(i * 137.5) * 19; dots[i*3+1] = -2.4 + (Math.sin(i * 51.2) + 1) * 1.6; dots[i*3+2] = -Math.abs(Math.cos(i * 13.7)) * 18; }
    const particles = new THREE.BufferGeometry(); particles.setAttribute('position', new THREE.BufferAttribute(dots, 3));
    const fireflyMaterial = new THREE.PointsMaterial({ color: '#fff1b5', size: .065, transparent: true, opacity: .8, sizeAttenuation: true });
    const fireflies = new THREE.Points(particles, fireflyMaterial); scene.add(fireflies);
    const overlay = new THREE.Scene();
    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    overlayCamera.position.z = 1;
    const uniforms = { uTime: { value: 0 }, uProgress: { value: 0 }, uAspect: { value: 1 } };
    const cloudMaterial = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, uniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: `precision mediump float;
        varying vec2 vUv; uniform float uTime; uniform float uProgress; uniform float uAspect;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
        float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+3.2;a*=.5;}return s;}
        void main(){
          vec2 p=vec2(vUv.x*uAspect,vUv.y);
          float n=fbm(p*3.2+vec2(uTime*.025,-uTime*.018));
          float detail=fbm(p*7.+n+uTime*.008);
          float rise=smoothstep(.06,.48,uProgress)*1.85;
          float depart=smoothstep(.56,.96,uProgress)*2.05;
          float top=rise-depart-.22;
          float edge=vUv.y-top+n*.35+sin(p.x*4.+uTime*.06)*.07;
          float alpha=1.-smoothstep(-.12,.2,edge);
          float entrance=smoothstep(0.,.07,uProgress);
          vec3 shade=mix(vec3(.72,.74,.86),vec3(.969,.96,.965),smoothstep(.15,.75,n+detail*.3));
          gl_FragColor=vec4(shade,alpha*entrance);
        }` });
    const cloudGeometry = new THREE.PlaneGeometry(2, 2); overlay.add(new THREE.Mesh(cloudGeometry, cloudMaterial));
    const resize = () => { renderer.setSize(node.clientWidth, node.clientHeight); camera.aspect=node.clientWidth/node.clientHeight; camera.updateProjectionMatrix(); uniforms.uAspect.value=camera.aspect; };
    const observer = new ResizeObserver(resize); observer.observe(node); resize();
    let frame, clock=0, last=performance.now(), active=true;
    const visibility = () => { active=!document.hidden; last=performance.now(); };
    document.addEventListener('visibilitychange', visibility);
    const pointer = { x:0, y:0 };
    const move = e => { pointer.x=(e.clientX/innerWidth-.5)*.4; pointer.y=(e.clientY/innerHeight-.5)*.2; };
    window.addEventListener('pointermove', move, { passive:true });
    const render = now => {
      frame=requestAnimationFrame(render);
      const dt=Math.min((now-last)/1000,.05); last=now;
      if (!active) return;
      const stopped=motion.current.reduced || paused.current;
      if (!stopped) clock+=dt;
      uniforms.uTime.value=clock; uniforms.uProgress.value=motion.current.reduced ? 0 : motion.current.progress;
      camera.position.x=THREE.MathUtils.lerp(camera.position.x,stopped?0:pointer.x,.04);
      camera.position.z=13-motion.current.progress*2;
      camera.position.y=3+(stopped?0:pointer.y);
      fireflies.position.y=stopped?0:Math.sin(clock*.25)*.16;
      fireflyMaterial.opacity=.55+(stopped?0:Math.sin(clock*1.3)*.2);
      renderer.clear(); renderer.render(scene,camera); renderer.clearDepth(); renderer.render(overlay,overlayCamera);
    };
    frame=requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('pointermove',move); document.removeEventListener('visibilitychange',visibility); terrain.dispose(); groundMaterial.dispose(); particles.dispose(); fireflyMaterial.dispose(); cloudGeometry.dispose(); cloudMaterial.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [motion, paused]);
  return <div ref={host} className="webgl-scene" aria-hidden="true"/>;
}
