export const stages=[
 {title:'几何底板',detail:'先有一块由三角形组成的地面。白色材质与光照让你看清轮廓；此时没有使用地表图片。',action:'拖动视角，再调“真实几何起伏”，观察边缘如何改变。',color:false,light:true,normal:false,rough:false,grass:false},
 {title:'铺上颜色',detail:'把颜色图片按纹理坐标铺到网格上。此步关闭光照，单独观察图片的贡献；图片中原有的明暗仍然可见。',action:'切换泥土与草岩，再调整重复次数，观察颗粒尺寸。',color:true,light:false,normal:false,rough:false,grass:false},
 {title:'加入光照',detail:'同一张颜色图开始接受太阳与环境光。现在明暗会随照明方向变化，网格本身没有改变。',action:'左右调整太阳方向，对比左侧不受光照影响的颜色图。',color:true,light:true,normal:false,rough:false,grass:false},
 {title:'加入法线',detail:'法线图用方向数据改变每个位置的受光，让颗粒显得凹凸。它不会增加顶点，也不会改变地面边缘。',action:'调高法线强度，再转动光源；最后切低视角，确认轮廓仍然相同。',color:true,light:true,normal:true,rough:false,grass:false},
 {title:'加入粗糙度',detail:'粗糙度图让不同位置的高光扩散程度不同。灰度图与粗糙度系数相乘；更粗糙不等于更有抓地力。',action:'调低粗糙度系数并转动光源，观察反光分布。',color:true,light:true,normal:true,rough:true,grass:false},
 {title:'补上真实草叶',detail:'在表面放置独立的草叶三角形。它们会伸出轮廓、遮挡背景并投影，这是表面贴图不能提供的效果。',action:'切换到草岩，调整草叶数量；用低视角比较左侧纯材质与右侧草叶。',color:true,light:true,normal:true,rough:true,grass:true}
];
export const initialSurface=()=>({step:3,material:'mud',repeat:2,normalStrength:1,roughness:.8,sun:35,relief:0,density:700,wire:false,shadows:true,wind:false,...flagsFor(3)});
export function flagsFor(step){const {color,light,normal,rough,grass}=stages[step];return{color,light,normal,rough,grass};}
export function validateSurface(patch){if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('需要参数对象');const ranges={step:[0,5],repeat:[.5,5],normalStrength:[0,3],roughness:[.08,1],sun:[0,360],relief:[0,1],density:[0,1600]};for(const [k,v] of Object.entries(patch)){if(k in ranges){if(typeof v!=='number'||!Number.isFinite(v)||v<ranges[k][0]||v>ranges[k][1]||(['step','density'].includes(k)&&!Number.isInteger(v)))throw Error('参数超出范围：'+k);}else if(k==='material'){if(!['mud','grass'].includes(v))throw Error('无效地表');}else if(['color','light','normal','rough','grass','wire','shadows','wind'].includes(k)){if(typeof v!=='boolean')throw Error('需要开关：'+k);}else throw Error('未知参数：'+k);}return patch;}
export function configureSurface(cfg,patch){validateSurface(patch);return{...cfg,...('step' in patch?flagsFor(patch.step):{}),...patch};}
export function surfaceHeight(x,z,amplitude){return amplitude*(.35*Math.sin(x*1.3)*Math.cos(z*1.5)+.45*Math.exp(-((x-.6)**2+(z+.3)**2)*1.3));}
export function surfaceStats(cfg){return{vertices:65*65,groundTriangles:64*64*2,grassInstances:cfg.grass?cfg.density:0,grassTriangles:cfg.grass?cfg.density*2:0,activeMaps:[cfg.color?'颜色':null,cfg.light&&cfg.normal?'法线':null,cfg.light&&cfg.rough?'粗糙度':null].filter(Boolean),lighting:cfg.light,relief:cfg.relief};}
