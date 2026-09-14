import * as T from 'three';
import {segmentTransform,solveTwoBone,vec} from '../rig/ik';
import {handPaths} from '../rig/hand';
import {characters,characterFrame,type Appearance,type CharacterId,type PerformancePose} from './script';

// Original procedural character models. Shared IK and hand paths are from the
// researched MIT rig; character appearance and performance are authored here.
export function createCharacterScene(host:HTMLElement){
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','人物表演三维画面，可用下方播放、时间轴和对照按钮观看。');host.appendChild(renderer.domElement);
  const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
  const keep=<G extends T.BufferGeometry>(g:G)=>{geometries.push(g);return g;};
  const sphere=keep(new T.SphereGeometry(1,24,18)),cube=keep(new T.BoxGeometry(1,1,1)),cylinder=keep(new T.CylinderGeometry(1,1,1,12));
  const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:1});materials.push(m);return m;};
  const paper=mat('#fffaf0'),ink=mat('#444b46'),wood=mat('#c1ad8b'),floor=mat('#e9e5d9'),wall=mat('#e6e4da');
  function mesh(parent:T.Object3D,g:T.BufferGeometry,m:T.Material){const o=new T.Mesh(g,m);parent.add(o);o.castShadow=true;o.receiveShadow=true;return o;}
  function box(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const o=mesh(parent,cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);return o;}
  function ball(parent:T.Object3D,x:number,y:number,z:number,r:number,m:T.Material){const o=mesh(parent,sphere,m);o.position.set(x,y,z);o.scale.setScalar(r);return o;}
  function move(o:T.Mesh,a:T.Vector3,b:T.Vector3){const tr=segmentTransform(a,b);o.position.copy(tr.position);o.quaternion.copy(tr.rotation);o.scale.y=tr.length;}
  function rod(parent:T.Object3D,a:number[],b:number[],r:number,m:T.Material){const o=mesh(parent,cylinder,m);o.scale.set(r,1,r);move(o,vec(a),vec(b));return o;}
  function chair(parent:T.Object3D,x:number){const g=new T.Group();parent.add(g);g.position.x=x;box(g,0,.555,0,.59,.065,.56,wood);for(const dx of [-.24,.24])for(const dz of [-.2,.2])rod(g,[dx,.02,dz],[dx,.56,dz],.023,wood);for(const dx of [-.24,.24])rod(g,[dx,.55,-.23],[dx,1.17,-.23],.023,wood);box(g,0,1.09,-.23,.54,.13,.045,wood);return g;}
  function actor(parent:T.Object3D,appearance:Appearance,guest=false){
    const root=new T.Group();parent.add(root);const m=mat(appearance.color),hairMat=mat(appearance.hair);
    const head=new T.Group();root.add(head);const outlineMat=new T.MeshBasicMaterial({color:appearance.color,side:T.BackSide});materials.push(outlineMat);
    const outline=ball(head,0,0,0,.232,outlineMat);outline.castShadow=false;const face=ball(head,0,0,0,.222,paper);
    const eyes=[-.075,.075].map(x=>ball(head,x,.02,.22,.013,ink));eyes.forEach(e=>e.scale.y=1.4*.013);
    for(const x of [-.075,.075])rod(head,[x-.026,.077,.215],[x+.025,.077,.215],.005,ink);
    const mouth=[rod(head,[-.043,-.07,.213],[0,-.08,.222],.0045,ink),rod(head,[0,-.08,.222],[.043,-.07,.213],.0045,ink)];
    const identity=new T.Group();head.add(identity);
    const cap=mesh(identity,keep(new T.SphereGeometry(.236,24,16,0,Math.PI*2,0,appearance.style==='receding'?.7:1.23)),hairMat);
    if(appearance.style==='bob'){
      const back=ball(identity,0,-.025,-.105,.23,hairMat);back.scale.set(.239,.25,.16);
      for(const x of [-.204,.204]){const lobe=ball(identity,x,-.027,-.055,.07,hairMat);lobe.scale.set(.045,.135,.11);}
      cap.rotation.z=-.2;
    }
    if(appearance.style==='crop'){cap.scale.y=1.08;cap.rotation.z=-.14;for(const x of [-.207,.207]){const lobe=ball(identity,x,.061,-.045,.042,hairMat);lobe.scale.y=.07;}}
    if(appearance.style==='curls')for(let i=0;i<11;i++){const a=(i/10)*Math.PI;ball(identity,Math.cos(a)*.23,Math.sin(a)*.21+.045,-.006,.068,hairMat);}
    if(appearance.style==='receding'){cap.position.z=-.09;for(const x of [-.215,.215])ball(identity,x,.016,-.07,.055,hairMat);}
    if(appearance.glasses){for(const x of [-.08,.08]){const o=mesh(identity,keep(new T.TorusGeometry(.063,.007,8,28)),ink);o.position.set(x,.017,.235);}rod(identity,[-.019,.023,.238],[.019,.023,.238],.006,ink);}
    const torso=new T.Group();root.add(torso);const garment=new T.Group();torso.add(garment);
    const coatGeo=keep(new T.CylinderGeometry(appearance.shoulder,appearance.coat==='cardigan'?.28:.21,.5,8));
    const coat=mesh(garment,coatGeo,m);coat.scale.z=.55;
    box(garment,0,.02,.119,.018,.45,.014,paper);
    for(const x of [-.052,.052])rod(garment,[x,.23,.12],[0,.10,.145],.012,paper);
    if(appearance.coat!=='vest')for(const x of [-1,1]){const sleeve=ball(garment,x*appearance.shoulder,.17,0,.075,m);sleeve.scale.y=.12;}
    const bag=new T.Group();garment.add(bag);bag.visible=appearance.bag;
    rod(bag,[-.19,.23,.14],[.2,-.26,.16],.014,wood);box(bag,.22,-.2,.17,.24,.20,.09,wood);box(bag,.22,-.17,.224,.22,.02,.01,paper);
    const spine=rod(root,[0,.9,0],[0,1.5,0],.019,m),shoulders=rod(root,[-.21,1.5,0],[.21,1.5,0],.019,m),neck=rod(root,[0,1.5,0],[0,1.66,0],.018,m);
    const limbs=Array.from({length:8},()=>rod(root,[0,0,0],[0,1,0],.020,m));
    const handMaterials:T.LineBasicMaterial[]=[];
    const hands=[new T.Group(),new T.Group()];hands.forEach((h,i)=>{root.add(h);const p=handPaths(.19,i?'right':'left');for(const path of [p.stem,...p.fingers]){const g=keep(new T.BufferGeometry().setFromPoints(path));const lm=new T.LineBasicMaterial({color:appearance.color});materials.push(lm);handMaterials.push(lm);h.add(new T.Line(g,lm));}});
    const shoes=[-1,1].map(()=>{const o=ball(root,0,0,0,.05,m);o.scale.set(.10,.04,.085);return o;});
    return {root,update(p:PerformancePose,simple:boolean){
      identity.visible=!simple&&!guest;garment.visible=!simple&&!guest;spine.visible=simple||guest;
      const color=simple&&!guest?'#5b645c':appearance.color;m.color.set(color);outlineMat.color.set(color);handMaterials.forEach(h=>h.color.set(color));
      outline.visible=true;face.visible=true;root.position.set(p.x,0,.42*(1-p.sit));
      const shoulderWidth=simple||guest?.21:appearance.shoulder;
      const bob=Math.abs(Math.sin(p.phase))*p.walk*.025*(1-p.sit),hip=vec([0,.95-.32*p.sit+bob,0]);
      const chest=hip.clone().add(vec([p.lean,.58,-.035]));
      move(spine,hip,chest);move(shoulders,chest.clone().add(vec([-shoulderWidth,0,0])),chest.clone().add(vec([shoulderWidth,0,0])));move(neck,chest,chest.clone().add(vec([0,.15,0])));
      torso.position.copy(hip).lerp(chest,.52);torso.rotation.z=-Math.atan2(p.lean,.58);
      head.position.copy(chest).add(vec([p.lean*.12,.31,0]));head.rotation.set(p.bow,p.gaze,-p.lean*.35);
      move(mouth[0],vec([-.043,-.07+p.smile*.013,.213]),vec([0,-.071-p.smile*.024,.222]));move(mouth[1],vec([0,-.071-p.smile*.024,.222]),vec([.043,-.07+p.smile*.013,.213]));
      for(let i=0;i<2;i++){
        const sign=i?-1:1,osc=Math.sin(p.phase+i*Math.PI)*p.walk*(1-p.sit);
        const shoulder=chest.clone().add(vec([sign*shoulderWidth,0,0]));
        const rest=vec([sign*.3-osc*.2,chest.y-.52,.06]);
        const lap=vec([sign*.14,chest.y-.46,.30]);rest.lerp(lap,p.hands);
        const lift=Math.sqrt(Math.max(0,p.wave));
        if(i===0){rest.y+=lift*1.08;rest.x+=lift*.24;rest.z+=lift*.09;}
        const arm=solveTwoBone(shoulder,rest,vec([sign*.8,-.35,.4]),.32,.32);
        move(limbs[i*2],shoulder,arm.middle);move(limbs[i*2+1],arm.middle,arm.end);hands[i].position.copy(arm.end);hands[i].rotation.z=sign*(-.12+lift*2.5*(i===0?1:0));
        const start=hip.clone().add(vec([sign*.105,0,0]));
        const foot=vec([sign*.13-osc*.24,.055+Math.max(0,osc)*.11,.05+.32*p.sit]);
        const standing=solveTwoBone(start,foot,vec([.2,0,1]),.46,.46).middle;
        const knee=standing.lerp(vec([sign*.14,.55,.39]),p.sit);
        move(limbs[4+i*2],start,knee);move(limbs[5+i*2],knee,foot);shoes[i].position.copy(foot).add(vec([.025,-.009,.025]));
      }
    }};
  }
  const sets=characters.map(c=>{
    const scene=new T.Scene();scene.background=new T.Color('#eeebe1');scene.add(new T.HemisphereLight('#fffaf0','#abae9b',2));
    const sun=new T.DirectionalLight('#ffefd6',2.3);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.normalBias=.025;scene.add(sun);
    box(scene,0,-.07,0,15,.13,12,floor);box(scene,0,1.7,-1.1,12,3.4,.08,wall);
    box(scene,-2.25,1.18,-1.02,1.03,2.36,.06,wood);box(scene,-2.25,1.16,-.973,.90,2.24,.04,mat('#ddd8c7'));ball(scene,-1.94,1.04,-.93,.028,ink);
    box(scene,1.75,2.03,-1.01,1.40,1.06,.06,wood);box(scene,1.75,2.03,-.965,1.28,.94,.025,mat('#bfcfc9'));rod(scene,[1.75,1.57,-.94],[1.75,2.48,-.94],.015,paper);
    const seat=chair(scene,.05);chair(scene,1.21);
    const hero=actor(scene,c.appearance);const partner=actor(scene,{...c.appearance,color:'#b5b4a8'},true);
    const camera=new T.OrthographicCamera(-3,3,2,-2,.1,40);camera.position.set(2.3,2.6,10);camera.lookAt(-.18,1.15,0);
    return {scene,camera,hero,partner,seat,id:c.id};
  });
  let time=0,selected:CharacterId='zhou',compare=false,simple=false,disposed=false;
  function render(t:number){if(disposed)return;time=t;const w=host.clientWidth,h=host.clientHeight;renderer.setScissorTest(true);
    const visible=compare?sets:sets.filter(s=>s.id===selected);
    visible.forEach((s,i)=>{
      const cols=compare?Number(getComputedStyle(host.parentElement!).getPropertyValue('--character-columns')||2):1,rows=compare?4/cols:1,cw=w/cols,ch=h/rows,x=(i%cols)*cw,y=h-(Math.floor(i/cols)+1)*ch;
      renderer.setViewport(x,y,cw,ch);renderer.setScissor(x,y,cw,ch);
      const halfH=Math.max(1.57,(cw<600?2.15:2.75)/(cw/ch));s.camera.left=-halfH*cw/ch;s.camera.right=halfH*cw/ch;s.camera.top=halfH;s.camera.bottom=-halfH;s.camera.updateProjectionMatrix();
      const p=characterFrame(s.id,t);s.hero.update(p,simple);s.seat.position.x=p.chair;
      s.partner.update({x:1.21,walk:0,phase:0,sit:1,lean:-.03,gaze:-.45,bow:0,wave:.15*Math.sin(Math.PI*Math.min(1,t/12)),hands:.65,smile:.5,chair:1.21},true);
      renderer.render(s.scene,s.camera);
    });renderer.setScissorTest(false);
  }
  function resize(){renderer.setSize(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight));render(time);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return {render,configure(id:CharacterId,all:boolean,bare:boolean){selected=id;compare=all;simple=bare;render(time);},dispose(){disposed=true;observer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}};
}
