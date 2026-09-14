// Public POI pages read on 2026-09-14. Coordinates shown lat/lon there, stored lon/lat here.
export const newCoordinates=[
 ['qinling-zoo','B001D092I6',108.866715,34.047456,'reference-point','西安秦岭野生动物园；长安滦镇；园区参考点，非指定入口'],
 ['yuanjia','B0GUKACX5K',108.538698,34.590240,'reference-point','礼泉烟霞镇袁家村；不是城区同名餐饮店'],
 ['bailu-film','B0FFGAB102',109.278101,34.076758,'reference-point','蓝田白鹿原影视城；不是白鹿仓或整个白鹿原'],
 ['bailucang','B0FFI2H1FU',109.115310,34.215594,'east-gate','高德具名东门参考点；不当作景区中心，不承诺该门当前开放']
].map(([placeId,providerPlaceId,lon,lat,pointRole,pointDescription])=>({placeId,providerPlaceId,lon,lat,pointRole,pointDescription,crs:'GCJ-02',originGroup:'amap',url:`https://ditu.amap.com/place/${providerPlaceId}`,checkedAt:'2026-09-14',license:'再分发与商业使用许可待核实'}));
