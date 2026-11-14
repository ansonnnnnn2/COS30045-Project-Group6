const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../dvp/js/data-model.js');
// Parse this simple CSV with quoted-field support, including escaped quotes/newlines.
function csv(text){const out=[];let row=[],v='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(q&&text[i+1]==='"'){v+='"';i++;}else q=!q;}else if(!q&&(c===','||c==='\n')){row.push(v.replace(/\r$/,''));v='';if(c==='\n'){out.push(row);row=[];}}else v+=c;}if(v||row.length){row.push(v.replace(/\r$/,''));out.push(row);}const h=out.shift();return out.filter(r=>r.length>1).map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]])));}
const raw=csv(fs.readFileSync(path.join(__dirname,'../dvp/data/FinalG6.csv'),'utf8'));
const rows=raw.map(M.parse),f=Object.fromEntries(['year','remote','user','sex','age','state','period'].map(k=>[k,'all']));
const sum=a=>a.reduce((n,r)=>n+(r.n??0),0);
assert.equal(rows.length,85397);
assert.equal(M.select(rows,'national',f).length,81562);
assert.equal(M.select(rows,'state',f).length,176);
assert.equal(sum(M.select(rows,'national',f)),413013);
assert.equal(new Set(M.select(rows,'state',f).map(r=>r.state)).size,8);
assert.equal(sum(M.select(rows,'state',{...f,year:'2020'})),37292);
assert.equal(sum(M.select(rows,'national',{...f,year:'2020'})),38054);
assert.equal(sum(M.select(rows,'national',{...f,year:'2016'})),39231);
const nswh1=M.select(rows,'state',{...f,year:'2011',state:'NSW',period:'Jan-Jun'});
assert.equal(nswh1.length,1);assert.equal(sum(nswh1),5223);
const ages=M.select(rows,'state',{...f,year:'2011',state:'NSW',period:'Jan-Jun'},[],'age');
assert.equal(ages.length,7);assert(ages.every(r=>r.user==='All'&&r.sex==='All'&&r.breakdown==='age'));
assert.equal(M.select(rows,'state',{...f,state:'NOT_A_STATE'}).length,0);
// National charts can preserve their own dimension without ignoring other filters.
const selected={...f,year:'2020',user:'Car driver'};
assert(M.select(rows,'national',selected,['year']).some(r=>r.year===2011));
assert(M.select(rows,'national',selected,['year']).every(r=>r.user==='Car driver'));
assert(M.select(rows,'national',selected,['user']).some(r=>r.user!=='Car driver'));
assert(M.select(rows,'national',selected,['user']).every(r=>r.year===2020));
assert(M.select(rows,'state',f).every(r=>r.age==='All'&&r.user==='All'&&r.sex==='All'&&r.counterparty==='All'));
assert.equal(M.number('n.p.'),null);assert.equal(M.number(''),null);assert.equal(M.number('0'),0);
assert.throws(()=>M.number('bad'));assert.throws(()=>M.number('-1'));
assert.throws(()=>M.parse({...raw[0],'Geography type':'Unknown'}));
console.log('PASS: merged file shape, separate populations, exact annual and state/period totals, marginal isolation, chart context filters, invalid-value handling.');
console.log('State total cases:',sum(M.select(rows,'state',f)));
