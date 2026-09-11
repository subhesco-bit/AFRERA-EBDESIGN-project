'use strict';
const make=require('../shared/createRegistryService');
module.exports=make({table:'m034_parcels',entity:'Parcel',required:['parcel_id','geometry'],columns:['parcel_id','land_id','village_id','geometry','crs','area_ha','status','properties'],validate(d){if(d.area_ha!=null&&Number(d.area_ha)<0){const e=new Error('area_ha must be non-negative');e.statusCode=400;throw e;}if(d.geometry!=null&&typeof d.geometry!=='object'){const e=new Error('geometry must be GeoJSON/JSON');e.statusCode=400;throw e;}}});
