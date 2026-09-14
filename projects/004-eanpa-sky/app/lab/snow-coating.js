// Shared snow history on existing geometry: no duplicate trees or terrain meshes.
export function coatWithSnow(T,material,cover){
 if(!cover)return;
 const upward=T.smoothstep(.02,.68,T.normalWorld.y);
 const uneven=T.mx_noise_float(T.positionWorld.mul(.7)).mul(.18).add(.82);
 const amount=cover.mul(upward).mul(uneven).clamp(0,1);
 material.colorNode=T.mix(material.colorNode??T.color(material.color),T.color(0xdce5e9),amount);
 material.roughnessNode=T.mix(material.roughnessNode??T.float(material.roughness),T.float(.97),amount);
}
