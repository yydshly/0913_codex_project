// Local simple polygons only: no dateline crossing, holes or disputed boundary inference.
export function checkAreaEvidence(placeId,evidence){
 const pending=detail=>({status:'pending',detail});
 if(!evidence)return pending('未取得另一来源的具名景区边界');
 const {point,area}=evidence;
 if(point?.placeId!==placeId||area?.placeId!==placeId||!area.identityBasis||!area.source||!point.source)return pending('点位与边界的地点绑定或来源缺失');
 if(!point.originGroup||!area.originGroup||point.originGroup===area.originGroup)return pending('边界与点位同源，不能交叉支持');
 if(point.crs!=='WGS-84'||area.crs!=='WGS-84')return pending('点位和边界需要统一为WGS-84');
 if(!point.conversion?.method||!point.original)return pending('缺少原坐标与转换依据');
 const ring=area.ring,finite=xy=>Array.isArray(xy)&&xy.length===2&&xy.every(Number.isFinite)&&Math.abs(xy[0])<=180&&Math.abs(xy[1])<=90;
 if(!finite([point.lon,point.lat])||!Array.isArray(ring)||ring.length<4||!ring.every(finite)||JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))return pending('坐标或闭合边界无效');
 if(Math.max(...ring.map(p=>p[0]))-Math.min(...ring.map(p=>p[0]))>3||Math.max(...ring.map(p=>p[1]))-Math.min(...ring.map(p=>p[1]))>3)return pending('超出当前局部边界算法范围');
 if(!Number.isFinite(evidence.edgeMarginMeters)||evidence.edgeMarginMeters<0)return pending('边界误差缓冲未定义');
 let inside=false,nearest=Infinity;const kx=111195*Math.cos(point.lat*Math.PI/180),ky=111195;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];
  if((yi>point.lat)!==(yj>point.lat)&&point.lon<(xj-xi)*(point.lat-yi)/(yj-yi)+xi)inside=!inside;
  const ax=(xi-point.lon)*kx,ay=(yi-point.lat)*ky,bx=(xj-point.lon)*kx,by=(yj-point.lat)*ky,dx=bx-ax,dy=by-ay;
  const t=dx*dx+dy*dy?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy))):0;
  nearest=Math.min(nearest,Math.hypot(ax+t*dx,ay+t*dy));
 }
 const status=nearest<=evidence.edgeMarginMeters?'edge-uncertain':inside?'inside':'outside';
 return {status,inside,edgeDistanceMeters:Math.round(nearest),detail:status==='inside'?'参考点落在另一来源的同名景区边界内（仅区域支持）':status==='outside'?'参考点落在另一来源的景区边界外，需核查':'参考点靠近边界，受转换及边界误差影响，暂不判断',boundarySource:area.source,sourceVersion:area.version};
}
