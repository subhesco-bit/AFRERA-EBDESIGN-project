describe('M051-M100 agricultural production controls',()=>{
 const Service=require('../src/services/m051m100AgricultureProductionService');
 test('validates production quantity and area',()=>expect(Service.validateProduction({quantity:100,area:2,expectedYield:60}).valid).toBe(true));
 test('rejects invalid production area',()=>expect(()=>Service.validateProduction({quantity:100,area:0})).toThrow());
 test('classifies harvest quality',()=>expect(Service.classifyHarvest({grade:'A'}).marketable).toBe(true));
 test('rejects unknown harvest grade',()=>expect(()=>Service.classifyHarvest({grade:'X'})).toThrow());
 test('rejects FPO procurement without positive quantity',()=>expect(Service.recordFpoProcurement({fpoId:'f',farmerId:'r',quantity:0})).rejects.toThrow());
});
