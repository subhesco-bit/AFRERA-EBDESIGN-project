const { getPostgreSQL }=require('../database');
const crypto=require('crypto');
class ERPControlPlaneService{
 constructor(){this.db=getPostgreSQL();}
 async trialBalance(companyId,asOfDate){
  const q=await this.db.query(`SELECT c.account_code,c.account_name,c.account_type,COALESCE(SUM(jl.base_debit),0)::numeric debit,COALESCE(SUM(jl.base_credit),0)::numeric credit FROM chart_of_accounts c LEFT JOIN journal_lines jl ON jl.account_id=c.id LEFT JOIN journal_entries je ON je.id=jl.journal_entry_id AND je.company_id=$1 AND je.status='posted' AND je.entry_date <= $2 WHERE c.company_id=$1 GROUP BY c.id ORDER BY c.account_code`,[companyId,asOfDate]);
  const rows=q.rows.map(r=>({...r,balance:Number(r.debit)-Number(r.credit)}));
  return {company_id:companyId,as_of:asOfDate,rows,total_debit:rows.reduce((s,r)=>s+Number(r.debit),0),total_credit:rows.reduce((s,r)=>s+Number(r.credit),0)};
 }
 async closePeriod(periodId,userId){
  const q=await this.db.query(`UPDATE fiscal_periods SET status='closed',closed_at=NOW(),closed_by=$2 WHERE id=$1 AND status='open' RETURNING *`,[periodId,userId||null]);
  if(!q.rows[0]) throw new Error('Fiscal period is not open or does not exist');
  return q.rows[0];
 }
 async registerFpoMember(input){
  const q=await this.db.query(`INSERT INTO fpo_members (id,fpo_id,farmer_id,membership_number,joined_on,share_count,contribution_amount,status,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8) ON CONFLICT (fpo_id,farmer_id) DO UPDATE SET status='active',metadata=EXCLUDED.metadata RETURNING *`,[crypto.randomUUID(),input.fpoId,input.farmerId,input.membershipNumber,input.joinedOn||null,Number(input.shareCount||0),Number(input.contributionAmount||0),JSON.stringify(input.metadata||{})]);
  return q.rows[0];
 }
}
module.exports=new ERPControlPlaneService();
