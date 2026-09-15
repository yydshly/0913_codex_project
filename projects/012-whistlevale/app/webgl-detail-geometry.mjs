// Additional structure is independent from shading: switching this module's
// output changes geometry only. Core station footprint and vehicle pose stay fixed.
export function addStudyDetails(b,car,wheel){
 const wood='#805a3c',trim='#d9c8a0',green='#365749',metal='#526b61',brass='#ba9558';
 // Roof seam ribs are actual geometry, not lines painted on the roof.
 for(let x=-2.98;x<1.02;x+=.28){b.beam([x,2.475,.82],[x,3.477,-.75],.017,metal,6,6);b.beam([x,3.477,-.75],[x,2.475,-2.32],.017,metal,6,6);}
 b.beam([-3.12,3.48,-.75],[1.12,3.48,-.75],.06,green,6,16);
 for(const x of[-3.07,1.07]){b.beam([x,2.43,.83],[x,3.46,-.75],.047,trim,11,6);b.beam([x,3.46,-.75],[x,2.43,-2.33],.047,trim,11,6);}
 b.beam([-3.12,2.42,.84],[1.12,2.42,.84],.048,metal,6,12);
 b.beam([1.08,2.42,.84],[1.08,.42,.84],.045,metal,6,12);
 for(const y of[.65,1.28,1.98])b.box([1.08,y,.86],[.13,.045,.08],brass,6);
 // Stone plinth blocks, coping, and repeated paving around the building.
 for(let row=0;row<2;row++)for(let x=-2.80;x<.84;x+=.39){b.beveledBox([x, .48+row*.19,.52],[.37,.175,.09],row?'#b7aa92':'#aa9d85',10,.018);}
 for(let x=-3.45;x<1.42;x+=.36)for(let z=-2.13;z<1.65;z+=.36){if(x>-2.92&&x<.96&&z> -2.07&&z<.59)continue;b.beveledBox([x,.367,z],[.343,.025,.343],(Math.round(x*100+z*71)&1)?'#c4baa4':'#bdb39d',10,.009);}
 b.beveledBox([-1,.393,1.84],[5.4,.10,.12],trim,10,.015);
 for(let x=-3.56;x<1.7;x+=.16)b.box([x,.448,1.85],[.075,.012,.05],'#dfd3a9',0);
 // Window casing, shutters, hinges and a shallow lintel throw real shadows.
 for(const x of[-2.18,.28]){
  for(const dx of[-.5,.5])b.beveledBox([x+dx,1.52,.635],[.105,1.12,.17],trim,11,.02);
  for(const y of[.975,2.065])b.beveledBox([x,y,.66],[1.12,.095,.21],trim,11,.02);
  for(const dx of[-.29,.29])for(const yy of[1.1,1.92])b.cylinder([x+dx,yy,.695],.018,.035,brass,6,8,'z');
  b.beveledBox([x-.64,1.52,.585],[.19,.98,.07],green,11,.018);
  for(let y=1.12;y<2;y+=.09)b.box([x-.64,y,.634],[.165,.035,.045],metal,11);
 }
 for(const x of[-1.0,-.1])b.beveledBox([x,1.06,.615],[.09,1.52,.15],trim,11,.018);
 b.beveledBox([-.55,.73,.56],[.58,.36,.08],wood,1,.025);
 for(const x of[-.83,-.28])b.beveledBox([x,.73,.61],[.032,.34,.04],brass,6,.008);
 b.cylinder([-.25,1.03,.63],.038,.07,brass,6,16,'z');
 for(const y of[.64,1.6])b.box([-.92,y,.66],[.09,.12,.035],metal,6);
 // The sign is generated with Canvas 2D, then sampled using this explicit UV quad.
 for(const x of[-1.9,-.1])b.beam([x,2.4,1.67],[x,2.29,1.67],.015,brass,6,8);
 b.beveledBox([-1,2.15,1.67],[2.62,.30,.11],brass,6,.025);
 b.quad([-2.26,2.025,1.735],[.26,2.025,1.735],[.26,2.275,1.735],[-2.26,2.275,1.735],'#ffffff',9,[[0,0],[1,0],[1,1],[0,1]]);
 // Awning ribs, brackets and panel joints, visible from the platform camera.
 for(let x=-3.03;x<1.1;x+=.29)b.box([x,2.472,.96],[.025,.025,1.31],metal,6);
 b.beam([-3.13,2.4,1.64],[1.13,2.4,1.64],.05,metal,6,12);
 for(const x of[-2.98,1]){
  b.beveledBox([x,1.35,1.44],[.12,2.04,.12],wood,1,.013);
  b.beam([x,1.91,1.44],[x+(x<0?.43:-.43),2.33,1.44],.043,wood,1,4);
  b.beam([x,1.91,1.44],[x,2.34,.99],.043,wood,1,4);
  for(const y of[.48,1.89,2.28])b.cylinder([x,y,1.515],.024,.035,brass,6,8,'z');
 }
 // Open lantern frame: a small bulb sits within the structure.
 for(const dx of[-.115,.115])for(const dz of[-.115,.115])b.beam([1.6+dx,2.22,.45+dz],[1.6+dx,2.55,.45+dz],.016,metal,6,6);
 b.sphere([1.6,2.39,.45],.055,'#ffdf9b',7);b.cylinder([1.6,2.29,.45],.034,.13,brass,6,12);
 // Bench fasteners, luggage, a timetable case and station clock.
 for(const x of[-2.4,-1.6])for(const z of[1.065,1.275])b.cylinder([x,.698,z],.013,.015,brass,6,8);
 b.beveledBox([-2.63,.55,1.15],[.25,.31,.22],'#906d4a',1,.03);
 for(const x of[-2.72,-2.55])b.box([x,.55,1.269],[.027,.30,.019],brass,6);
 b.beam([-2.7,.73,1.15],[-2.58,.73,1.15],.017,metal,6,8);
 b.beveledBox([.85,1.47,.61],[.34,.53,.10],wood,1,.018);b.box([.85,1.47,.671],[.27,.43,.015],'#e2d6b7',0);
 for(let i=0;i<6;i++)b.box([.84,1.62-i*.057,.683],[i%2?.15:.21,.012,.006],'#6f7568',0);
 b.cylinder([.73,2.15,.63],.135,.07,brass,6,32,'z');b.cylinder([.73,2.15,.672],.115,.017,'#eee3c9',0,32,'z');
 b.beam([.73,2.15,.688],[.73,2.23,.688],.007,'#34413c',0,6);b.beam([.73,2.15,.688],[.79,2.12,.688],.007,'#34413c',0,6);
 // Rail seats and bolts: repeated hardware on the same sleepers.
 for(let x=-4.8;x<=4.81;x+=.27)for(const z of[2.11,2.89]){b.box([x,.32,z],[.19,.025,.18],metal,6);for(const dz of[-.07,.07])b.cylinder([x,.35,z+dz],.017,.035,brass,6,6);}
 // Vehicle lining, rivets, door hardware, roof vents and step edges.
 for(const side of[-1,1]){
  for(const y of[.49,.94,1.06])car.box([0,y,side*.5],[1.84,.027,.023],brass,6);
  for(let x=-.85;x<.86;x+=.14)car.cylinder([x,.58,side*.504],.014,.026,brass,6,8,'z');
  for(const x of[-.59,0,.59])for(const y of[1.11,1.57])car.beveledBox([x,y,side*.504],[.50,.035,.04],green,6,.007);
  car.beveledBox([-.64,.28,side*.64],[.44,.08,.20],metal,6,.015);
  car.beam([-.87,.4,side*.63],[-.87,.94,side*.63],.018,brass,6,8);
 }
 for(const x of[-.47,.47]){car.beveledBox([x,1.79,0],[.35,.12,.35],metal,6,.025);for(let i=0;i<4;i++)car.box([x-.1+i*.065,1.855,0],[.025,.015,.27],'#263b33',0);}
 for(const side of[-1,1])car.beam([.966,.71,side*.38],[.966,1.12,side*.38],.017,brass,6,8);
 car.beveledBox([.986,.51,0],[.10,.1,.74],metal,6,.025);
 for(let i=0;i<10;i++){const a=i*Math.PI*2/10;wheel.beam([.10*Math.cos(a),.10*Math.sin(a),.095],[.195*Math.cos(a),.195*Math.sin(a),.095],.012,brass,6,6);}
}
