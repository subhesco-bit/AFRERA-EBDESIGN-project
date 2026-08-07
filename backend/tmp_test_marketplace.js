process.env.NODE_ENV='test';
const request = require('supertest');
const { app } = require('./src/index');
(async ()=>{
  try{
    const reg = await request(app).post('/api/v1/auth/register').send({ email:'gi-test2@example.com', password:'Test123!@#', role:'admin' });
    const token = reg.body.token;
    const create = await request(app).post('/api/v1/gi-intelligence/gi-products').set('Authorization', `Bearer ${token}`).send({ product_id:'p123', gi_name:'Assam Tea', gi_registration_number:'R-1', registration_date:'2020-01-01', geographical_region:'Assam', state:'Assam', gi_authority:'Auth', gi_category:'agri', description:'desc', historical_significance:'hist', unique_characteristics:[], production_methods:[], quality_standards:{} });
    console.log('product created body:', create.body);
    const gid = create.body.id;
    const market = await request(app).post('/api/v1/gi-intelligence/gi-marketplace').set('Authorization', `Bearer ${token}`).send({ gi_product_id: gid, product_id: 'prod-1', listing_title:'LT', description:'desc', available_quantity:10, unit:'kg', price_per_unit:100, quality_tier:'premium', harvest_date:'2024-01-01', location_id:null });
    console.log('market response status', market.status, 'body=', market.body);
  }catch(e){ console.error(e); }
})();