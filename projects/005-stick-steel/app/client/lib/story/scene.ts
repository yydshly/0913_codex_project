import * as T from 'three';
import {solveTwoBone,vec,segmentTransform} from '../rig/ik';
import {handPaths} from '../rig/hand';
import {storyFrame,type StoryId,type ActorPose} from './script';

// Authored character performance. IK and hand geometry reuse the research rig;
// story timing is deterministic so seeking never requires a physics rewind.
export function createStoryScene(host:HTMLElement,id:StoryId){
  const scene=new T.Scene();scene.background=new T.Color('#eeece3');scene.fog=new T.Fog('#eeece3',15,38);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','人物故事实时三维画面：使用下方播放和时间轴观看。');host.appendChild(renderer.domElement);
  const camera=new T.OrthographicCamera(-6,6,3,-3,.1,65);camera.position.set(0,3.6,12);camera.lookAt(0,1.1,0);
  const ambient=new T.HemisphereLight('#fff8e7','#b7bba9',2.5);scene.add(ambient);
  const sun=new T.DirectionalLight('#ffefd2',3);sun.position.set(-5,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-12,right:12,top:9,bottom:-9});sun.shadow.normalBias=.025;scene.add(sun);
  const geometries:T.BufferGeometry[]=[],materials:T.Material[]=[];
  const sphere=new T.SphereGeometry(1,24,16),cylinder=new T.CylinderGeometry(1,1,1,10),cube=new T.BoxGeometry(1,1,1);
  geometries.push(sphere,cylinder,cube);
  const mat=(color:string)=>{const m=new T.MeshStandardMaterial({color,roughness:1});materials.push(m);return m;};
  const paper=mat('#fbf9ed'),faint=mat('#c9c8b9'),wood=mat('#c7b69a'),ink=mat('#414d47'),groundMat=mat('#e8e7db');
  function box(parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material){const o=new T.Mesh(cube,m);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function ball(parent:T.Object3D,x:number,y:number,z:number,r:number,m:T.Material){const o=new T.Mesh(sphere,m);o.position.set(x,y,z);o.scale.setScalar(r);parent.add(o);o.castShadow=true;return o;}
  function rod(parent:T.Object3D,a:number[],b:number[],r:number,m:T.Material){const o=new T.Mesh(cylinder,m);const tr=segmentTransform(vec(a),vec(b));o.position.copy(tr.position);o.quaternion.copy(tr.rotation);o.scale.set(r,tr.length,r);parent.add(o);o.castShadow=true;return o;}
  function line(parent:T.Object3D,points:T.Vector3[],color:string){const g=new T.BufferGeometry().setFromPoints(points);geometries.push(g);const m=new T.LineBasicMaterial({color});materials.push(m);const o=new T.Line(g,m);parent.add(o);return o;}
  box(scene,0,-.09,0,40,.15,30,groundMat);
  const set=new T.Group();scene.add(set);
  const chairs:T.Group[]=[];
  function chair(x:number,z:number){const g=new T.Group();set.add(g);box(g,x,.54,z,.66,.06,.6,wood);box(g,x,.97,z-.25,.65,.09,.07,wood);box(g,x,1.16,z-.25,.65,.09,.07,wood);for(const dx of [-.25,.25])for(const dz of [-.2,.2])rod(g,[x+dx,0,z+dz],[x+dx,.6,z+dz],.025,ink);for(const dx of [-.25,.25])rod(g,[x+dx,.5,z-.25],[x+dx,1.25,z-.25],.025,ink);chairs.push(g);return g;}
  function tree(x:number,z:number,size=1){const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(size);set.add(g);rod(g,[0,0,0],[.05,2.7,0],.047,faint);for(let i=0;i<5;i++){const a=i*2.39;rod(g,[0,1.7,0],[Math.cos(a)*.6,2.65+Math.sin(i)*.3,Math.sin(a)*.35],.024,faint);}for(let i=0;i<6;i++){const a=i*2.39;const leaf=ball(g,Math.cos(a)*.55,3+Math.sin(i)*.35,Math.sin(a)*.4,.75,mat(i%2?'#d0d1b6':'#dce0c9'));leaf.scale.y*=.7;}}
  let dish:T.Group|undefined,bowl:T.Group|undefined;
  function cup(parent:T.Object3D,x:number,y:number,z:number,color='#f1eee4'){const m=mat(color),g=new T.Group();g.position.set(x,y,z);parent.add(g);const geo=new T.CylinderGeometry(.095,.07,.15,20,1,true);geometries.push(geo);const o=new T.Mesh(geo,m);g.add(o);const ring=new T.TorusGeometry(.05,.011,7,18);geometries.push(ring);const handle=new T.Mesh(ring,m);handle.position.x=.10;g.add(handle);return g;}
  if(id==='father'){
    box(set,0,-.002,0,23,.016,2.5,mat('#eeeade'));
    for(let i=-9;i<10;i++)line(set,[vec([i*1.3,.01,-1.25]),vec([i*1.3+.15,.01,1.25])],'#d8d3c3');
    for(const z of [-1.3,1.3])rod(set,[-14,.01,z],[14,.01,z],.014,faint);
    tree(-4,-2.9,1.2);tree(4.7,-3,1.5);tree(-9,-5,1.7);tree(10,-6,2);
    const bench=new T.Group();set.add(bench);for(let i=0;i<4;i++)box(bench,3.6,.57,-2+i*.14,2,.06,.1,wood);
    for(let i=0;i<3;i++)box(bench,3.6,.86+i*.15,-2.05,2,.1,.05,wood);
    for(const x of [2.85,4.35]){rod(bench,[x,0,-1.6],[x,.58,-1.6],.026,ink);rod(bench,[x,0,-2],[x,1.3,-2],.026,ink);}
    rod(set,[-3.1,0,-2],[-3.1,3.4,-2],.035,faint);box(set,-3.1,3.4,-2,.32,.05,.3,wood);ball(set,-3.1,3.19,-2,.12,paper);
    // Distant buildings are deliberately subdued so posture remains readable.
    for(let i=0;i<10;i++){const x=-13+i*2.8,h=1.9+(i%3)*.55;box(set,x,h/2,-8,2.45,h,1.7,mat(i%2?'#deded1':'#d5d9cf'));for(let k=0;k<3;k++)box(set,x-.7+k*.65,h*.7,-7.13,.25,.44,.02,faint);}
  }else if(id==='dinner'){
    box(set,0,1.9,-2.4,13,3.8,.12,mat('#e5dfd0'));box(set,0,.01,0,15,.02,9,mat('#e0d6c3'));
    for(let i=-7;i<8;i++)line(set,[vec([i,.027,-2.4]),vec([i,.027,5])],'#cfc2ad');
    box(set,2.8,2.15,-2.31,2.1,1.7,.09,wood);box(set,2.8,2.15,-2.24,1.91,1.52,.04,mat('#bdc8c5'));
    rod(set,[2.8,1.4,-2.19],[2.8,2.9,-2.19],.025,paper);rod(set,[1.9,2.15,-2.19],[3.7,2.15,-2.19],.025,paper);
    box(set,-3,1.9,-2.25,.95,1.14,.04,wood);box(set,-3,1.9,-2.19,.81,1,.04,paper);
    box(set,0,1.02,0,1.4,.075,.85,wood);for(const x of [-.55,.55])for(const z of [-.3,.3])rod(set,[x,0,z],[x,1,z],.035,wood);
    chair(-.9,0);chair(.9,0);
    rod(set,[0,3.6,0],[0,2.65,0],.01,ink);const shadeGeo=new T.ConeGeometry(.48,.26,32,1,true);geometries.push(shadeGeo);const shade=new T.Mesh(shadeGeo,wood);shade.position.set(0,2.7,0);set.add(shade);ball(set,0,2.57,0,.06,paper);
    dish=new T.Group();dish.position.set(-.43,1.08,.12);set.add(dish);const plate=ball(dish,0,0,0,.19,paper);plate.scale.y*=.14;for(let i=0;i<6;i++)ball(dish,Math.sin(i)*.095,.03,Math.cos(i)*.07,.035,mat('#87967a'));
    bowl=new T.Group();bowl.position.set(.53,1.14,.15);set.add(bowl);const b=ball(bowl,0,0,0,.115,paper);b.scale.y*=.6;
    cup(set,-.7,1.14,-.25);cup(set,.7,1.14,-.25);
  }else{
    box(set,0,1.85,-2.2,14,3.7,.12,mat('#e2e5db'));box(set,-3,.58,-1.5,3.5,1.15,.9,wood);box(set,-3,1.17,-1.5,3.7,.08,1,paper);
    box(set,-3,1.52,-1.5,.48,.64,.5,ink);box(set,-2.98,1.55,-1.23,.32,.3,.02,faint);cup(set,-2.45,1.32,-1.2);
    box(set,3.5,2,-2.1,2,1.6,.04,wood);box(set,3.5,2,-2.05,1.85,1.45,.04,mat('#cbd7d3'));
    tree(-5.2,-1.3,.65);for(let i=0;i<4;i++)box(set,-.8+i*.35,2.5,-2.05,.2,.28,.015,paper);
  }
  function actor(color:string){
    const root=new T.Group();scene.add(root);const m=mat(color);const outline=new T.MeshBasicMaterial({color,side:T.BackSide});materials.push(outline);
    const head=new T.Group();root.add(head);ball(head,0,0,0,.219,outline).castShadow=false;ball(head,0,0,0,.209,paper);
    for(const x of [-.07,.07]){ball(head,x,.016,.196,.012,ink).scale.y*=1.25;rod(head,[x-.025,.07,.187],[x+.025,.072,.187],.004,ink);}
    rod(head,[-.023,-.065,.198],[.026,-.061,.198],.004,ink);
    const body=rod(root,[0,.9,0],[0,1.5,0],.014,m),shoulders=rod(root,[-.21,1.49,0],[.21,1.49,0],.014,m),neck=rod(root,[0,1.49,0],[0,1.68,0],.013,m);
    const segments=Array.from({length:8},()=>rod(root,[0,0,0],[0,1,0],.013,m));
    const hands=[new T.Group(),new T.Group()];hands.forEach((hand,i)=>{root.add(hand);const paths=handPaths(.18,i?'right':'left');for(const points of [paths.stem,...paths.fingers])line(hand,points,color);hand.scale.setScalar(.75);});
    const feet=[rod(root,[0,0,0],[.1,0,0],.018,m),rod(root,[0,0,0],[.1,0,0],.018,m)];
    const moveSegment=(mesh:T.Mesh,a:T.Vector3,b:T.Vector3)=>{const tr=segmentTransform(a,b);mesh.position.copy(tr.position);mesh.quaternion.copy(tr.rotation);mesh.scale.y=tr.length;};
    return {root,hands,update(p:ActorPose){
      const scale=p.scale??1,phase=p.phase??0,walking=p.walk??0,lean=p.lean??0;
      root.position.set(p.x,0,p.z??0);root.scale.setScalar(scale);
      const bob=Math.abs(Math.sin(phase))*Math.abs(walking)*.023;
      const hip=vec([0,p.sit?.62:.92+bob,0]),chest=hip.clone().add(vec([lean,.60,-.02]));
      moveSegment(body,hip,chest);moveSegment(shoulders,chest.clone().add(vec([-.21,0,0])),chest.clone().add(vec([.21,0,0])));moveSegment(neck,chest,chest.clone().add(vec([0,.14,0])));
      head.position.copy(chest).add(vec([lean*.2,.30,0]));head.rotation.set(p.bow??0,p.gaze??0,p.tilt??-lean*.25);
      for(let side=0;side<2;side++){
        const sign=side===0?-1:1,osc=Math.sin(phase+side*Math.PI)*walking;
        const shoulder=chest.clone().add(vec([sign*.21,0,0]));
        let target=vec([sign*.29+osc*.2,chest.y-.53,.035]);
        const specified=side===0?p.left:p.right;
        if(specified)target=vec(specified).sub(root.position).divideScalar(scale);
        if(p.wave&&side===1)target=vec([.5,chest.y-.35+p.wave*.75,.1]);
        const arm=solveTwoBone(shoulder,target,vec([sign*.6,-.4,.3]),.31,.31);
        moveSegment(segments[side*2],shoulder,arm.middle);moveSegment(segments[side*2+1],arm.middle,arm.end);hands[side].position.copy(arm.end);
        hands[side].rotation.z=side===0?-.12:.12;
        const legStart=hip.clone().add(vec([sign*.10,0,0]));
        const foot=vec([sign*.12+osc*.25,.055+Math.max(0,osc)*.12,p.sit?.36:0]);
        const knee=p.sit?vec([sign*.15,.53,.37]):solveTwoBone(legStart,foot,vec([.22,0,.9]),.45,.45).middle;
        moveSegment(segments[4+side*2],legStart,knee);moveSegment(segments[5+side*2],knee,foot);moveSegment(feet[side],foot,foot.clone().add(vec([.09,-.012,.065])));
      }
    }};
  }
  const actors=[actor('#a25749'),actor('#587c8d'),actor('#859079'),actor('#9a897c')];
  if(id==='newcomer')cup(actors[1].hands[0],0,.09,.025,'#e8e5db');
  let currentTime=0,close=false,disposed=false;
  function render(time:number){if(disposed)return;currentTime=time;const frame=storyFrame(id,time);actors.forEach((a,i)=>{a.root.visible=i<frame.actors.length;if(frame.actors[i])a.update(frame.actors[i]);});
    if(dish)dish.position.x=frame.dish;if(bowl)bowl.position.x=frame.bowl;
    const center=id==='father'?(frame.actors[0].x+frame.actors[1].x)/2:id==='newcomer'?.65:0;
    camera.position.x=center;camera.lookAt(center,1.12,0);
    sun.color.set(id==='father'?new T.Color('#ffefd2').lerp(new T.Color('#ffe0bc'),frame.light):'#ffefd2');
    renderer.render(scene,camera);return frame;
  }
  function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),aspect=w/h;renderer.setSize(w,h);const halfWidth=Math.max(w<600?2.9:4.2,aspect*1.95)*(close?.80:1);camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfWidth/aspect;camera.bottom=-halfWidth/aspect;camera.updateProjectionMatrix();render(currentTime);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return {render,setClose(value:boolean){close=value;resize();},dispose(){disposed=true;observer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}};
}
