import {atlasPlaces} from './atlas-data.mjs';
export const studyIds=['bell','pagoda','daming','hanyang','huaqing','terracotta','cuihua','louguan'];
export const studyPlaces=studyIds.map(id=>atlasPlaces.find(p=>p.id===id));
