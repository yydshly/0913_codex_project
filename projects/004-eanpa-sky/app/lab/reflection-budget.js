// Authored matte surfaces keep native sky illumination but do not compile the
// local-probe + screen-space reflection graph. Wet paths/windows stay native SSR.
export function makeMatteEnvironment(root){
 const materials=new Set();
 root.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){
  if(m?.userData?.environmentOnly){m.userData.noSSR=true;materials.add(m);}
 }});
 return{count:materials.size,setEnvironment(texture){for(const m of materials){if(m.envMap!==texture){m.envMap=texture;m.needsUpdate=true;}}}};
}
