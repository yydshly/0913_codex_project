import test from 'node:test';import assert from 'node:assert/strict';
import {makeOutdoor,journeyAt,lightAt,chapters,actorAt,solarDirection,shadowAt} from './outdoor-core.mjs';
import * as T from './vendor/three.module.js';
import {createWalker,addVehicleRig,footPlacement} from './outdoor-actors.mjs';
import {pineDimensions} from './reuse-core.mjs';
import {inspectOutdoorLayout} from './outdoor-core.mjs';
import {outdoorDefaults,outdoorLimits,outdoorPresets,validateOutdoorRecipe,encodeOutdoorRecipe,decodeOutdoorRecipe} from './outdoor-recipe.mjs';
import {expandForest} from './forest-core.mjs';
import {addCampDetails} from './outdoor-details.mjs';
test('journey covers boundaries, chapter shortcuts and a complete final sunrise',()=>{assert.equal(journeyAt(0).chapter.id,'drive');assert.equal(journeyAt(.36).chapter.id,'camp');assert.equal(journeyAt(.56).chapter.id,'hike');assert.equal(journeyAt(.88).chapter.id,'sunrise');assert.equal(journeyAt(1).local,1);for(const c of chapters)assert.equal(journeyAt(c.focus).chapter.id,c.id);assert.throws(()=>journeyAt(NaN));assert.ok(lightAt(journeyAt(.99)).elevation>lightAt(journeyAt(.89)).elevation);});
test('drive and walking samples remain grounded and stop at their endpoints',()=>{const land=makeOutdoor();for(const route of [land.drive,land.trail]){for(let p=0;p<=1;p+=.01){const q=route.sample(p);assert.ok([q.x,q.y,q.z,q.heading].every(Number.isFinite));assert.equal(q.y,land.terrain(q.x,q.z));}assert.deepEqual(route.sample(1),route.sample(2));}const end=land.trail.sample(1);assert.ok(Math.hypot(end.x-land.summit.x,end.z-land.summit.z)<1e-8);assert.ok(Math.hypot(land.drive.sample(1).x-land.camp.x,land.drive.sample(1).z-land.camp.z)>6);});
test('camp is level and full pine canopies clear campsites, driving and hiking routes',()=>{const land=makeOutdoor();for(const [x,z] of [[5.7,10.8],[9.3,11.5],[7.3,7.7]])assert.equal(land.terrain(x,z),land.camp.y);assert.ok(land.trees.length>20);for(const p of land.trees){const radius=pineDimensions.radius*p.scale;assert.ok(land.trail.nearest(p.x,p.z).distance>.65+radius);assert.ok(land.source.nearest(p.x,p.z).distance>1.6+radius);assert.ok(Math.hypot(p.x-7,p.z-10)>6.5+radius);assert.equal(p.y,land.terrain(p.x,p.z));}});
test('traveler joins arrival, camp departure and mountain trail without position jumps',()=>{const land=makeOutdoor();for(const progress of [.36+.2*.52,.36+.2*.75,.56,.88]){const a=actorAt(land,journeyAt(progress-1e-7)),b=actorAt(land,journeyAt(progress+1e-7));assert.ok(Math.hypot(a.p.x-b.p.x,a.p.z-b.p.z)<.001);}for(const p of [.36,.5,.56,.9,1])assert.equal(actorAt(land,journeyAt(p)).driveProgress,1);assert.ok(actorAt(land,journeyAt(.535)).nightFade>.99);assert.equal(actorAt(land,journeyAt(.56)).nightFade,0);});
test('automatic light and sun elevation remain continuous across chapter boundaries',()=>{for(const p of [.36,.56,.88]){const a=lightAt(journeyAt(p-1e-7)),b=lightAt(journeyAt(p+1e-7));for(const key of ['brightness','elevation','duskMix'])assert.ok(Math.abs(a[key]-b[key])<.0001);}});
test('rounded walking path keeps turning changes small and actor positions repeat on seeking',()=>{const land=makeOutdoor();let last=land.trail.sample(0);for(let i=1;i<=1000;i++){const p=land.trail.sample(i/1000),angle=Math.atan2(Math.sin(p.heading-last.heading),Math.cos(p.heading-last.heading));assert.ok(Math.abs(angle)<.3);last=p;}const a=actorAt(land,journeyAt(.69));actorAt(land,journeyAt(.9));assert.deepEqual(actorAt(land,journeyAt(.69)),a);});
test('vehicle stays in valley and never visits or intersects the summit hiking route',()=>{const land=makeOutdoor();let previous=land.trail.sample(0);for(let i=0;i<=1000;i++){const d=land.drive.sample(i/1000),w=land.trail.sample(i/1000);assert.ok(Math.hypot(d.x-land.summit.x,d.z-land.summit.z)>28);assert.ok(land.trail.nearest(d.x,d.z).distance>10);assert.ok(d.y<1.5);assert.ok(w.y>=previous.y-1e-8);previous=w;}assert.ok(land.summit.y-land.camp.y>=10);assert.ok(land.trail.length>45);});
test('walker feet clear local ground through the whole hiking sequence',()=>{const land=makeOutdoor(),world=new T.Group,walker=createWalker(world,land);for(let i=0;i<=150;i++){walker.update(actorAt(land,journeyAt(.56+.32*i/150)));world.updateMatrixWorld(true);const boots=walker.root.children.filter(m=>m.geometry?.type==='BoxGeometry');assert.equal(boots.length,2);for(const boot of boots){const p=boot.getWorldPosition(new T.Vector3);assert.ok(p.y-.06>=land.terrain(p.x,p.z)-.04);}}});
test('vehicle articulation stays finite and stops wheel rotation while parked',()=>{const land=makeOutdoor(),car=new T.Group,rig=addVehicleRig(car,land);for(let i=0;i<=100;i++){rig.update({driveProgress:i/100},lightAt(journeyAt(.2)));assert.ok([...car.position,...car.quaternion].every(Number.isFinite));}const parked=car.children.filter(g=>g.type==='Group').map(g=>g.children[0].rotation.x);rig.update({driveProgress:1},lightAt(journeyAt(.9)));assert.deepEqual(car.children.filter(g=>g.type==='Group').map(g=>g.children[0].rotation.x),parked);});
test('shared sun direction is normalized and switches east to west with time',()=>{for(let i=0;i<=100;i++){const d=solarDirection(lightAt(journeyAt(i/100)));assert.ok(Math.abs(Math.hypot(d.x,d.y,d.z)-1)<1e-10);}assert.ok(solarDirection(lightAt(journeyAt(.515))).y<0);assert.ok(solarDirection(lightAt(journeyAt(.4),'dusk')).x<0);assert.ok(solarDirection(lightAt(journeyAt(.9),'dawn')).x>0);});
test('sunrise starts below horizon then crosses it while the valley brightens',()=>{const phases=[.88,.935,1].map(p=>lightAt(journeyAt(p)));assert.ok(phases[0].elevation<0);assert.ok(phases[1].elevation>0);assert.ok(phases[2].elevation>phases[1].elevation);assert.ok(phases[2].brightness>phases[1].brightness&&phases[1].brightness>phases[0].brightness);assert.equal(chapters.find(c=>c.id==='sunrise').focus,.88);});
test('time presets drive opposed shadow directions and long low-sun shadows',()=>{const j=journeyAt(.47),day=lightAt(j,'day'),dawn=lightAt(j,'dawn'),dusk=lightAt(j,'dusk');assert.equal(day.clock,'12:30');assert.equal(dawn.clock,'06:10');assert.equal(dusk.clock,'18:05');for(const light of [day,dawn,dusk]){const sun=solarDirection(light),shadow=shadowAt(light);assert.ok(shadow.direction.x*sun.x+shadow.direction.z*sun.z<0);assert.ok(Math.abs(shadow.flatLength*light.elevation-6.4)<1e-9);}assert.ok(shadowAt(dawn).flatLength>shadowAt(day).flatLength*8);assert.ok(shadowAt(dusk).flatLength>shadowAt(day).flatLength*8);assert.ok(shadowAt(dawn).direction.x<0&&shadowAt(dusk).direction.x>0);const night=shadowAt(lightAt(journeyAt(.515)));assert.equal(night.visible,false);assert.equal(night.flatLength,null);});
test('traveler rests at night and leaves camp after the clock reaches morning',()=>{const land=makeOutdoor(),night=journeyAt(.515),departure=journeyAt(.549);assert.equal(lightAt(night).clock,'23:00');assert.equal(actorAt(land,night).walking,false);assert.deepEqual(actorAt(land,night).p,land.arrival.sample(1));assert.ok(lightAt(departure).minute>=1740);assert.equal(actorAt(land,departure).walking,true);});

test('stance foot stays fixed in world space while the walker advances, including bends',()=>{
 const land=makeOutdoor(),world=new T.Group,walker=createWalker(world,land),route=land.trail;
 for(const cycle of [4,13,26,39])for(const sign of [-1,1]){
  const offset=sign<0?0:.5,positions=[];
  for(const phase of [.15,.3,.5]){const distance=(cycle-offset+phase)*.88,motion={p:route.sample(distance/route.length),route,routeDistance:distance,walkDistance:distance,walking:true,visible:true};walker.update(motion);world.updateMatrixWorld(true);const boots=walker.root.children.filter(m=>m.geometry?.type==='BoxGeometry'),boot=boots[sign<0?0:1];assert.equal(boot.userData.planted,true);positions.push(boot.getWorldPosition(new T.Vector3));}
  for(const p of positions)assert.ok(p.distanceTo(positions[0])<1e-8,'planted boot must not slide or rotate with the moving root');
 }
 const motion=actorAt(land,journeyAt(.735)),before=footPlacement(motion,-1,land.terrain);footPlacement(actorAt(land,journeyAt(.62)),-1,land.terrain);assert.deepEqual(footPlacement(motion,-1,land.terrain),before);
});

test('trail shoulders avoid abrupt cut walls while preserving the climb',()=>{
 const land=makeOutdoor();let max=0,total=0,count=0;
 for(let i=15;i<90;i++){const p=land.trail.sample(i/100),c=Math.cos(p.heading),s=Math.sin(p.heading);for(let offset=-2;offset<=2;offset+=.1){const x=p.x+c*offset,z=p.z-s*offset,grade=Math.abs(land.terrain(x+c*.025,z-s*.025)-land.terrain(x-c*.025,z+s*.025))/.05;max=Math.max(max,grade);total+=grade;count++;}}
 assert.ok(max<2.2,'no near-vertical cliff within the sampled two-metre shoulders');assert.ok(total/count<.42);
});

test('summit arrival turns continuously toward the sun with both boots aligned',()=>{
 const land=makeOutdoor(),j=journeyAt(.97),old=land.trail.sample(1),light=lightAt(j),sun=solarDirection(light),motion=actorAt(land,j,light);
 const alignment=heading=>(Math.sin(heading)*sun.x+Math.cos(heading)*sun.z)/Math.hypot(sun.x,sun.z);
 assert.ok(alignment(old.heading)<.05,'the original trail heading does not face sunrise');assert.ok(alignment(motion.p.heading)>1-1e-10);
 let previous=actorAt(land,journeyAt(.88)).p.heading;
 for(let i=1;i<=120;i++){const m=actorAt(land,journeyAt(.88+i*.00012)),angle=Math.atan2(Math.sin(m.p.heading-previous),Math.cos(m.p.heading-previous));assert.ok(Math.abs(angle)<.025);assert.equal(m.p.x,land.summit.x);assert.equal(m.p.z,land.summit.z);previous=m.p.heading;}
 for(const sign of [-1,1]){const foot=footPlacement(motion,sign,land.terrain);assert.ok(alignment(foot.heading)>1-1e-10);assert.ok(Math.hypot(foot.x-land.summit.x,foot.z-land.summit.z)<.2);}
 const world=new T.Group,walker=createWalker(world,land);walker.update(motion,light);assert.ok(alignment(walker.root.rotation.y)>1-1e-10);
});

test('all bounded layout corners preserve connected routes, level camps and a distinct parking area',()=>{
 for(let i=0;i<64;i++){
  const recipe=Object.fromEntries(Object.entries(outdoorLimits).map(([key,range],j)=>[key,range[(i>>j)&1]])),land=makeOutdoor(recipe),report=inspectOutdoorLayout(land);
  assert.equal(report.valid,true);assert.ok(report.separation>10);assert.equal(land.drive.sample(1).x,land.camp.x-7);assert.equal(land.drive.sample(1).z,land.camp.z);
  assert.deepEqual(land.trail.sample(1),{...land.trail.sample(1),x:land.summit.x,z:land.summit.z,y:land.summit.y});
  const a=land.departure.sample(1),b=land.trail.sample(0);assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<1e-8);
  for(const [x,z] of [[-1.3,.8],[2.3,1.5],[.3,-2.3]])assert.equal(land.terrain(land.camp.x+x,land.camp.z+z),land.camp.y);
  for(const t of [.36,.56,.88]){const before=actorAt(land,journeyAt(t-1e-8)),after=actorAt(land,journeyAt(t+1e-8));assert.ok(Math.hypot(before.p.x-after.p.x,before.p.z-after.p.z)<.001);}
 }
});

test('regenerated forests and camp accessories follow each preset, with deterministic recipe replay',()=>{
 for(const recipe of Object.values(outdoorPresets)){
  const land=makeOutdoor(recipe),forest=expandForest(land),restored=makeOutdoor(decodeOutdoorRecipe(encodeOutdoorRecipe(recipe)));
  assert.deepEqual(expandForest(restored).trees,forest.trees);
  for(const tree of forest.trees)assert.equal(land.isPlantable(tree.x,tree.z,tree.scale*(tree.width??1)),true,'canopies must avoid the new routes and sites');
  const views=[{x:land.camp.x+4.2,z:land.camp.z+4.7},{x:land.summit.x-.4168708*4.7-.9089657*1.3,z:land.summit.z+.9089657*4.7-.4168708*1.3}];for(const view of views)for(const tree of forest.trees)assert.ok(Math.hypot(view.x-tree.x,view.z-tree.z)>pineDimensions.radius*tree.scale*(tree.width??1)+.15,'camp and summit cameras need canopy clearance');
  const world=new T.Group;addCampDetails(world,land);const table=world.children[0];assert.equal(table.position.x,land.camp.x+.3);assert.equal(table.position.z,land.camp.z-2.3);assert.equal(table.position.y,land.camp.y);
  const walker=createWalker(new T.Group,land);walker.update(actorAt(land,journeyAt(.97)));assert.equal(walker.root.position.x,land.summit.x);assert.equal(walker.root.position.z,land.summit.z);
 }
});

test('layout files reject invalid versions, unknown fields, missing fields and out-of-range data',()=>{
 const original=encodeOutdoorRecipe(outdoorPresets.ridge);assert.deepEqual(decodeOutdoorRecipe(original),outdoorPresets.ridge);assert.deepEqual(validateOutdoorRecipe({}),outdoorDefaults);
 for(const input of [{ascent:NaN},{campX:100},{summitZ:'-18'},{constructor:1},{unexpected:0}])assert.throws(()=>validateOutdoorRecipe(input));
 for(const text of ['{}','not json',original.replace('"version": 2','"version": 99'),JSON.stringify({kind:'songlan-outdoor',version:1,recipe:{campX:7}}),'x'.repeat(16385)])assert.throws(()=>decodeOutdoorRecipe(text));
 assert.equal(encodeOutdoorRecipe(outdoorPresets.ridge),original);assert.deepEqual(makeOutdoor().recipe,outdoorDefaults);
});
