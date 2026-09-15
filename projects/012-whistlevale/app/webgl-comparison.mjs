export const BASIC=Object.freeze({geometry:false,materials:false,lighting:false});
// A reveal comparison renders the full projection twice. Only the second
// screen-space rectangle is clipped; cameras, time and exposure are shared.
export function comparisonViews(state){
 if(state.mode!=='detail')return[{features:BASIC,clip:0,name:'入门'}];
 const fine={...state.detail};
 if(state.edition==='base')return[{features:BASIC,clip:0,name:'基础版'}];
 if(state.edition==='fine')return[{features:fine,clip:0,name:'当前精细版'}];
 return[{features:BASIC,clip:0,name:'基础版'},{features:fine,clip:Math.max(0,Math.min(1,state.split/100)),name:'当前精细版'}];
}
export const DETAIL_TOPICS={
 structure:{title:'近看才成立的结构',see:'看屋面凸起的接缝、窗框收边、雨棚斜撑和铺地。把分界线从左拖到右，看同一位置多了什么。',change:'精细版增加真实三角形：倒角接住亮边，屋面筋条与窗框形成遮挡和小阴影。表面光照仍使用同一套参数。',try:'先关闭“表面材料”和“柔影与补光”，只比较结构；然后近看门窗。',three:'这些构件同样能用 BufferGeometry、曲线或组合网格在 Three.js 中生成。增加结构是内容制作工作。',native:'原作把屋檐、扶手、铆钉、轮辐等拆成具体部件。这里独立实现站房与小车细节，不是原作模型移植。',source:'railway.js#L838',file:'webgl-detail-geometry.mjs'},
 materials:{title:'从条纹到材料表面',see:'看木构件的纹理方向、烟囱砖缝的凹凸、金属的亮边。先关闭结构细节，直接比较同一个模型的表面。',change:'加入面内 UV、细尺度纹理变化、基于高度变化的法线扰动，以及随视角改变的反光近似。表面细微凹凸没有增加三角形。',try:'关闭“结构零件”和“柔影与补光”，只保留表面材料；拖动画面，观察反光随视角变化。',three:'UV、Bump/Normal Map 和 ShaderMaterial 能实现这些方法。它们没有原生 WebGL 2 独有的画质优势。',native:'原作按材料编号处理木头、砖墙、车漆和金属；本实验进一步用程序高度场解释细微凹凸。',source:'railway.js#L182',file:'webgl-shaders.mjs'},
 lighting:{title:'光线怎样揭示细节',see:'看屋檐阴影边缘、背光面和暖灯附近的层次。左右保持相同光线方向、曝光和机位。',change:'基础版使用 3×3 阴影采样。精细版使用更宽的 5×5 采样，并增加按表面朝向计算的天空与地面补光。它们是可控近似，不是全局光照。',try:'关闭另外两项，只比较柔影与补光；再调整光线方向，或把昼夜氛围拖到夜间。',three:'阴影滤波和环境照明可以使用现成机制或自定义着色器。关键是选择参数与预算。',native:'原作组合日光、室内灯和局部灯，并单独处理阴影与最终画面。',source:'railway.js#L218',file:'webgl-shaders.mjs'}
};
