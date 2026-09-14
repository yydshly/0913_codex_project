# 原始位置证据

采集日期2026-09-14。本目录不是图像素材。

- `osm-way-256930203.json`：西安秦岭野生动物园，来自 https://api.openstreetmap.org/api/0.6/way/256930203/full.json ，way版本3，更新时间2023-11-26。
- `osm-way-533105129.json`：白鹿原影视城，来自 https://api.openstreetmap.org/api/0.6/way/533105129/full.json ，way版本1，更新时间2017-10-17。数据较旧，不承诺现状边界。

© OpenStreetMap contributors。原始数据及从它派生的边界坐标按 [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) 使用，参见[来源版权说明](https://www.openstreetmap.org/copyright)。项目未向OSM写入任何数据。地点坐标的高德来源与许可单独保留，不将其冒称为OSM数据或已获商业再分发授权。

原始HTTP JSON原样保存，包含节点、对象版本和编辑元数据。`app/compile-location-evidence.mjs` 检查具名way，按节点顺序提取完整闭合轮廓，计算原始SHA256，并将高德坐标通过已有coordtransform 2.1.2近似转换到WGS-84。输出 `app/xian-spatial-evidence.mjs`，保留来源、许可与转换路径。

该过程没有从包围框中心“创造第二坐标”。点与面只做区域支持检查；边界100米内暂不判断，这个缓冲为实验配置，不是经过标定的测绘精度。OSM与高德是不同提供方，未逐段证明地图绘制来源完全独立，因此不能声称地理真值认证。
