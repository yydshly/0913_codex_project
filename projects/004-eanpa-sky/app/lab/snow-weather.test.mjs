import test from 'node:test';
import assert from 'node:assert/strict';
import {engineWeatherFor,roofHeightAt,snowGroundAt,advanceSnow,makeSnowWeather} from './snow-weather.js';
test('snow reuses overcast while native rain and thunder remain separate',()=>{
 assert.equal(engineWeatherFor('snow'),'overcast');
 for(const preset of ['none','clear','rain','storm'])assert.equal(engineWeatherFor(preset),preset);
});
test('roof collision covers pavilion and rooms but leaves open courtyard exposed',()=>{
 assert.equal(roofHeightAt(-4,-4),5.15);assert.equal(roofHeightAt(8,-13),3.87);
 assert.equal(roofHeightAt(-9.2,0),5.15);assert.equal(roofHeightAt(-3,4.5),null);
 assert.equal(roofHeightAt(0,10),null);assert.equal(snowGroundAt(.7,4),.14);
 assert.equal(snowGroundAt(-8,6),.43);
});
test('snow grows gradually, pauses exactly and recedes after stopping',()=>{
 let cover=0;for(let i=0;i<300;i++)cover=advanceSnow(cover,1,.1,28);
 assert.ok(cover>.6&&cover<.7);assert.equal(advanceSnow(cover,1,0,28),cover);
 const next=advanceSnow(cover,0,.1,100);assert.ok(next<cover&&next>cover*.99);
});
test('scene geometry initializes and excludes sheltered ground cells',()=>{
 // Minimal geometry spy exercises the real mesh-building path, including all cell indices.
 const node=new Proxy(()=>node,{get:()=>node,apply:()=>node});
 class Group{constructor(){this.children=[];this.userData={};}add(o){this.children.push(o);}traverse(fn){fn(this);this.children.forEach(fn);}}
 class Geometry{constructor(){this.attributes={};}setAttribute(k,v){this.attributes[k]=v;}setIndex(v){this.index=v;}computeVertexNormals(){}}
 class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.userData={};}}
 class Material{constructor(){this.userData={};}}
 class Instances extends Mesh{constructor(...args){super(...args);this.instanceMatrix={};this.written=[];}setMatrixAt(i){this.written.push(i);}}
 class Transform{constructor(){this.position={set(){}};this.scale={set(){}};this.quaternion={copy(){}};}rotateZ(){}updateMatrix(){}}
 const T={Group,PlaneGeometry:Geometry,BufferGeometry:Geometry,Float32BufferAttribute:class{constructor(v){this.array=v;}},InstancedBufferAttribute:class{setX(){}},Mesh,InstancedMesh:Instances,MeshBasicNodeMaterial:Material,MeshStandardNodeMaterial:Material,Object3D:Transform,uniform:node,max:node,float:node,distance:node,positionWorld:node,vec3:node,uv:node,smoothstep:node,length:node,attribute:node,color:node,sin:node,mx_noise_float:node};
 Mesh.prototype.position={y:0};
 const scene=new Group(),effect=makeSnowWeather(T,scene);
 const surfaces=scene.children[0].children.slice(1);assert.equal(surfaces.length,3);
 const ground=surfaces[0].geometry;
 for(let i=0;i<ground.index.length;i+=3){
  const triangle=ground.index.slice(i,i+3),x=triangle.reduce((s,j)=>s+ground.attributes.position.array[j*3],0)/3,z=triangle.reduce((s,j)=>s+ground.attributes.position.array[j*3+2],0)/3;
  assert.equal(roofHeightAt(x,z),null);
 }
 const flakes=scene.children[0].children[0],args={dt:.1,time:0,enabled:true,wind:{x:2,z:1},hours:15.5,camera:{quaternion:{}}};
 for(let i=0;i<100;i++){flakes.written=[];args.time+=.1;effect.update(args);assert.deepEqual(flakes.written,Array.from({length:flakes.count},(_,i)=>i));}
 assert.ok(flakes.count>1000&&flakes.count<=1800);
 args.enabled=false;for(let i=0;i<150;i++){args.time+=.1;effect.update(args);}
 flakes.written=[];const residual=effect.update(args);
 assert.equal(flakes.count,0);assert.equal(flakes.visible,false);assert.equal(flakes.written.length,0);
 assert.ok(residual.accumulation>.004);assert.equal(surfaces[0].visible,true);
});
