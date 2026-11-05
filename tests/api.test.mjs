import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

// Compile the authored handlers unchanged except for the three hosting boundaries:
// request identity, Workers environment, and a SQLite-backed D1 adapter.
const root=process.cwd();
const out=path.join(root,'.sites-runtime','api-tests');
const files=['app/api/workspace/route.ts','app/api/admin/route.ts','app/lib/catalog.ts','app/lib/validation.ts','db/schema.ts'];
let workspace,admin,env,sqlite;
const userA={userId:'user-a',displayName:'عميل أول',email:'a@example.test',fullName:null};
const userB={userId:'user-b',displayName:'عميل ثان',email:'b@example.test',fullName:null};
const operator={userId:'operator',displayName:'فريق لقطة',email:'team@example.test',fullName:null};
class Statement{
 constructor(sql,params=[]){this.sql=sql;this.params=params;}
 bind(...params){return new Statement(this.sql,params);}
 async run(){const info=sqlite.prepare(this.sql).run(...this.params);return {success:true,results:[],meta:{changes:Number(info.changes),last_row_id:Number(info.lastInsertRowid)}};}
 async raw(){const s=sqlite.prepare(this.sql);s.setReturnArrays(true);return s.all(...this.params);}
 async all(){return {success:true,results:sqlite.prepare(this.sql).all(...this.params),meta:{}};}
}
const d1={prepare:sql=>new Statement(sql)};
const outputFile=f=>path.join(out,f.replace(/\.ts$/,'.mjs'));
before(async()=>{
 for(const file of files){
  let source=await readFile(path.join(root,file),'utf8');
  source=source.replace(/from\s+(['"])([^'"]+)\1/g,(full,quote,specifier)=>{
   if(specifier==='cloudflare:workers')return `from ${quote}${pathToFileURL(path.join(out,'env.mjs'))}${quote}`;
   if(!specifier.startsWith('.'))return full;
   let resolved=path.normalize(path.join(path.dirname(file),specifier));
   if(resolved==='db')resolved='db/index';
   return `from ${quote}${pathToFileURL(outputFile(resolved+'.ts'))}${quote}`;
  });
  await mkdir(path.dirname(outputFile(file)),{recursive:true});
  await writeFile(outputFile(file),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 await writeFile(path.join(out,'app/chatgpt-auth.mjs'),'export async function getChatGPTUser(){return globalThis.__loqtahTestUser;}');
 await writeFile(path.join(out,'db/index.mjs'),"import {drizzle} from 'drizzle-orm/d1'; import * as schema from './schema.mjs'; export function getDb(){return drizzle(globalThis.__loqtahTestDb,{schema});}");
 await writeFile(path.join(out,'env.mjs'),'export const env={LOQTAH_ADMIN_USER_IDS:"operator"};');
 workspace=await import(pathToFileURL(outputFile(files[0])));
 admin=await import(pathToFileURL(outputFile(files[1])));
 env=(await import(pathToFileURL(path.join(out,'env.mjs')))).env;
});
beforeEach(async()=>{
 sqlite?.close();sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
 sqlite.exec(await readFile(path.join(root,'drizzle/0000_odd_blockbuster.sql'),'utf8'));
 globalThis.__loqtahTestDb=d1;globalThis.__loqtahTestUser=userA;env.LOQTAH_ADMIN_USER_IDS='operator';
});
after(()=>{sqlite?.close();delete globalThis.__loqtahTestDb;delete globalThis.__loqtahTestUser;});
const origin='https://loqtah.example.test';
async function post(handler,data,{user=userA,requestOrigin=origin}={}){
 globalThis.__loqtahTestUser=user;
 return handler.POST(new Request(origin+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:requestOrigin},body:JSON.stringify(data)}));
}
async function get(user=userA){globalThis.__loqtahTestUser=user;return (await workspace.GET()).json();}
const draft=()=>({action:'campaign',title:'حملة تجريبية',business:'مقهى تجريبي',category:'مطاعم وكافيهات',city:'نابلس',brief:'تصوير فيديو عن المشروبات الجديدة وتجربة المقهى لروّاده.',packageId:'story',budget:1450,date:'2099-11-20',creatorId:null,consent:true});
async function create(){const r=await post(workspace,draft());assert.equal(r.status,201);return(await r.json()).id;}
async function stage(id,status){return post(admin,{action:'status',campaignId:id,status},{user:operator});}

test('authentication is required for all private reads and writes',async()=>{
 globalThis.__loqtahTestUser=null;assert.equal((await workspace.GET()).status,401);
 assert.equal((await post(workspace,draft(),{user:null})).status,401);
 assert.equal((await post(admin,{action:'status',campaignId:'x',status:'planning'},{user:userA})).status,403);
});
test('cross-origin requests cannot write',async()=>{assert.equal((await post(workspace,draft(),{requestOrigin:'https://other.test'})).status,403);assert.equal(sqlite.prepare('select count(*) as n from campaigns').get().n,0);});
test('campaigns persist and the server supplies ownership and initial status',async()=>{
 const r=await post(workspace,{...draft(),userId:'attacker',status:'completed'});assert.equal(r.status,201);
 const own=await get();assert.equal(own.campaigns.length,1);assert.equal(own.campaigns[0].status,'requested');assert.equal('userId' in own.campaigns[0],false);
 assert.equal(sqlite.prepare('select user_id from campaigns').get().user_id,userA.userId);
});
test('another account cannot see, message, or cancel a campaign',async()=>{
 const id=await create();assert.equal((await get(userB)).campaigns.length,0);
 for(const action of ['message','cancel'])assert.equal((await post(workspace,{action,campaignId:id,body:'هذه رسالة اختبار'},{user:userB})).status,404);
 assert.equal(sqlite.prepare('select status from campaigns').get().status,'requested');
});
test('invalid budgets, impossible dates, missing consent and short briefs are rejected',async()=>{
 for(const change of [{budget:-1},{budget:1.5},{date:'2099-02-31'},{date:'2020-01-01'},{consent:false},{brief:'قصير'},{packageId:'fake'},{city:'مدينة مجهولة'}])assert.equal((await post(workspace,{...draft(),...change})).status,400,JSON.stringify(change));
});
test('favorites are idempotent and isolated between users',async()=>{
 for(let i=0;i<2;i++)assert.equal((await post(workspace,{action:'favorite',creatorId:'lina',saved:true})).status,200);
 assert.deepEqual((await get()).favorites,['lina']);assert.deepEqual((await get(userB)).favorites,[]);
 await post(workspace,{action:'favorite',creatorId:'lina',saved:false});assert.deepEqual((await get()).favorites,[]);
});
test('creator applications accept HTTPS, prevent duplicates, and never publish automatically',async()=>{
 const data={action:'apply',name:'صانع محتوى',city:'نابلس',category:'تصوير ومونتاج',portfolio:'https://example.test/work',bio:'أعمل على تصوير المنتجات والمحتوى الإعلاني القصير.',phone:'0590000000',consent:true};
 assert.equal((await post(workspace,{...data,portfolio:'javascript:alert(1)'})).status,400);
 assert.equal((await post(workspace,data)).status,200);assert.equal((await get()).application.status,'pending');
 assert.equal((await post(workspace,data)).status,409);assert.equal((await get(userB)).application,null);
});
test('only unstarted requests can be withdrawn',async()=>{
 const id=await create();assert.equal((await stage(id,'planning')).status,200);
 assert.equal((await post(workspace,{action:'cancel',campaignId:id})).status,409);
 const id2=await create();assert.equal((await post(workspace,{action:'cancel',campaignId:id2})).status,200);
 assert.equal((await post(workspace,{action:'message',campaignId:id2,body:'رسالة'})).status,409);
});
test('admin access defaults to nobody, and role escalation from the client is ignored',async()=>{
 env.LOQTAH_ADMIN_USER_IDS='';globalThis.__loqtahTestUser=operator;assert.equal((await admin.GET()).status,403);
 await post(workspace,{action:'profile',name:'عميل أول',business:'مقهى',phone:'0590000000',city:'نابلس',isAdmin:true});
 assert.equal((await get()).isAdmin,false);
});
test('campaign stages cannot be skipped and review requires a deliverable',async()=>{
 const id=await create();assert.equal((await stage(id,'completed')).status,409);
 assert.equal((await stage(id,'planning')).status,200);assert.equal((await stage(id,'production')).status,200);
 assert.equal((await stage(id,'review')).status,409);
});
test('delivery approval, ownership, feedback and completion work together',async()=>{
 const id=await create();await stage(id,'planning');await stage(id,'production');
 assert.equal((await post(admin,{action:'deliverable',campaignId:id,title:'الفيديو الأول',url:'http://insecure.test/video'},{user:operator})).status,400);
 assert.equal((await post(admin,{action:'deliverable',campaignId:id,title:'الفيديو الأول',url:'https://example.test/video'},{user:operator})).status,200);
 await stage(id,'review');assert.equal((await stage(id,'completed')).status,409);
 const file=(await get()).deliverables[0];
 assert.equal((await post(workspace,{action:'feedback',deliverableId:file.id,status:'approved',feedback:''},{user:userB})).status,404);
 assert.equal((await post(workspace,{action:'feedback',deliverableId:file.id,status:'changes',feedback:''})).status,400);
 assert.equal((await post(workspace,{action:'feedback',deliverableId:file.id,status:'changes',feedback:'تعديل العنوان في بداية الفيديو'})).status,200);
 assert.equal((await stage(id,'completed')).status,409);
 assert.equal((await post(admin,{action:'revise',campaignId:id,deliverableId:file.id,title:'الفيديو الأول - نسخة معدّلة',url:'https://example.test/video-v2'},{user:operator})).status,200);
 const revised=(await get()).deliverables[0];assert.equal(revised.status,'review');assert.equal(revised.url,'https://example.test/video-v2');
 assert.equal((await post(workspace,{action:'feedback',deliverableId:file.id,status:'approved',feedback:'المحتوى معتمد'})).status,200);
 assert.equal((await stage(id,'completed')).status,200);assert.equal((await get()).campaigns[0].status,'completed');
 assert.equal((await post(workspace,{action:'feedback',deliverableId:file.id,status:'changes',feedback:'تعديل بعد الإغلاق'})).status,409);
});
test('campaign messages preserve client/team authorship and stay private',async()=>{
 const id=await create();await post(workspace,{action:'message',campaignId:id,body:'هل يمكن التصوير صباحًا؟',isTeam:true});
 await post(admin,{action:'message',campaignId:id,body:'نراجع الموعد مع الفريق.'},{user:operator});
 const messages=(await get()).messages;assert.equal(messages.length,2);assert.equal(messages[0].isTeam,false);assert.equal(messages[1].isTeam,true);assert.equal((await get(userB)).messages.length,0);
});
