import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stayStops,stayResponse} from './stay.js';
import {views} from './courtyard.js';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const weatherSelect=html.match(/<select id="weather">([\s\S]*?)<\/select>/)[1];
const offered=new Set([...weatherSelect.matchAll(/value="([^"]+)"/g)].map(m=>m[1]));
for(const [name,view] of Object.entries(views))assert(Math.hypot(...view.position.map((v,i)=>v-view.target[i]))<=100,`${name}: camera exceeds OrbitControls distance limit and will be displaced`);
for(const name of ['none','clear','fair','sunshower','overcast','rain','storm','cyclone','darkstorm'])assert(offered.has(name),`Missing weather entry: ${name}`);
for(const [name,stop] of Object.entries(stayStops)){assert(offered.has(stop.weather),name);assert(views[stop.view],name);assert(stop.hours>=0&&stop.hours<=24,name);}
assert.equal(stayResponse('storm',23).key,'shelter','Storm guidance takes precedence over night');
assert.equal(stayResponse('sunshower',16).view,'shelter');
assert.equal(stayResponse('none',23).view,'rooms');
assert.equal(stayResponse('overcast',15).key,'garden');
console.log('Guest tour checks passed: complete preset entries, valid stop views, rain/night/storm adaptation priority.');
