/* GenAI-assisted merged-data adapter, reviewed against the supplied workbooks.
 * National and state records are alternative populations, never additive.
 * State age/sex/road-user tables are separate marginals, not joint observations.
 */
(function(root){
'use strict';
const DIMENSIONS=['age','sex','user','counterparty'];
const COLUMNS=['Calendar year','Period','Geography','Cause of injury','Age group','Sex','Road user','Counterparty','Count of cases','Bed days','Geography type','Source'];
function number(value){
  if(value==null || String(value).trim()==='' || /^(n\.p\.|np|n\/a)$/i.test(String(value).trim())) return null;
  const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('Invalid nonnegative count: '+value);return n;
}
function parse(raw){
 const year=Number(raw['Calendar year']);
 if(!Number.isInteger(year)||year<2011||year>2021)throw new Error('Unexpected calendar year');
 const type=String(raw['Geography type']||'').trim();
 if(!['ABS remoteness area','State or territory'].includes(type))throw new Error('Unknown geography type: '+type);
 const r={year,month:raw.Period,period:raw.Period,remote:raw.Geography,state:raw.Geography,age:raw['Age group'],sex:raw.Sex,user:raw['Road user'],counterparty:raw.Counterparty,n:number(raw['Count of cases']),type,source:raw.Source,raw};
 if(type==='State or territory'){
  const dims=DIMENSIONS.filter(k=>r[k]!=='All');
  if(dims.length>1)throw new Error('State rows must represent one breakdown');
  r.breakdown=dims[0]||'total';
 } else r.breakdown='joint';
 return r;
}
function select(rows,mode,f,skip=[],breakdown='total'){
 return rows.filter(r=>{
  if(r.type!==(mode==='state'?'State or territory':'ABS remoteness area'))return false;
  if(!skip.includes('year')&&f.year!=='all'&&String(r.year)!==f.year)return false;
  if(mode==='state')return r.breakdown===breakdown && (skip.includes('state')||f.state==='all'||r.state===f.state) && (f.period==='all'||r.period===f.period);
  return ['remote','user','sex','age'].every(k=>skip.includes(k)||f[k]==='all'||String(r[k])===f[k]);
 });
}
const api={COLUMNS,number,parse,select};root.VisiRoadData=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
