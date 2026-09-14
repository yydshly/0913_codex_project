// Three guided configurations of the same demonstration courtyard.
export const scenarios={
 free:{zh:'自由观察',en:'Explore freely',description:['听雨小院：保持同一机位切换天气，观察石径干湿、屋檐遮雨、树木摆动和夜间灯光。','Listening Garden: keep your viewpoint while switching weather to compare wet paths, roof shelter, trees and night lighting.']},
 architecture:{zh:'建筑雨景',en:'Architecture in rain',weather:'rain',hours:15.5,view:'shelter',description:['从屋檐下看雨幕与室外光线；开启声音，比较屋檐内外。可用于建筑看房、庭院与酒店方案展示。','View rainfall and outdoor lighting from shelter. Enable sound and compare indoors/outdoors. Useful for architecture, courtyard and hotel presentations.']},
 landscape:{zh:'落日景观',en:'Landscape at dusk',weather:'none',hours:17.5,view:'overview',description:['观察晚霞、云影和建筑受光；切换“仰望云层”看天空层次。可用于景区、园林与互动背景展示。','Observe dusk, cloud shadows and lighting; use Clouds to inspect the sky. Useful for landscape, destination and interactive background presentations.']},
 materials:{zh:'雨中材质',en:'Materials in rain',weather:'rain',hours:15.5,view:'surface',description:['观察石径水迹、木构和金属灯具在雨中的外观；雨停后水迹会保留，这不是防滑或排水性能测试。','Observe wet stone, timber and metal lights. Moisture persists after rain; this is not a slip-resistance or drainage test.']},
};
// Weather shortcuts intentionally contain no time or camera settings.
export const conditions={hail:{weather:'hail'},snow:{weather:'snow'},clear:{weather:'clear'},sunshower:{weather:'sunshower'},overcast:{weather:'overcast'},rain:{weather:'rain'},storm:{weather:'storm'}};
