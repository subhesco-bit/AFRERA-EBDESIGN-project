'use strict';
const geo=require('../../utils/geo');

function execute(operation,input={}){
  switch(operation){
    case 'distance': return {operation,distanceKm:geo.distanceKm(input.lat1,input.lng1,input.lat2,input.lng2)};
    case 'bearing': return {operation,bearingDeg:geo.bearingDeg(input.lat1,input.lng1,input.lat2,input.lng2)};
    case 'bounding_box': return {operation,boundingBox:geo.boundingBox(input.lat,input.lng,input.radiusKm)};
    case 'within_radius': return {operation,within:geo.isWithinRadius(input.lat,input.lng,input.centreLat,input.centreLng,input.radiusKm)};
    case 'within_polygon': return {operation,within:geo.isWithinPolygon(input.lat,input.lng,input.polygon)};
    case 'route_length': return {operation,routeLengthKm:geo.routeLengthKm(input.points||[],input.latKey||'latitude',input.lngKey||'longitude')};
    case 'proximity_sort': return {operation,items:geo.sortByProximity(input.lat,input.lng,input.items||[],input.latKey||'latitude',input.lngKey||'longitude')};
    default: {
      const e=new Error('unknown geospatial operation');e.code='GEOSPATIAL_OPERATION_UNKNOWN';throw e;
    }
  }
}
module.exports={execute};
