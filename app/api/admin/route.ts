import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import * as s from '../../../db/schema';
import {eq,desc,and} from 'drizzle-orm';
import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {safeUrl} from '../../lib/validation';
import {stages} from '../../lib/catalog';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const allowed=(id:string)=>(env.LOQTAH_ADMIN_USER_IDS||'').split(',').map(v=>v.trim()).filter(Boolean).includes(id);
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('status'),campaignId:z.string().max(100),status:z.enum(stages)}),
 z.object({action:z.literal('deliverable'),campaignId:z.string().max(100),title:z.string().trim().min(2).max(100),url:safeUrl}),
 z.object({action:z.literal('revise'),campaignId:z.string().max(100),deliverableId:z.string().max(100),title:z.string().trim().min(2).max(100),url:safeUrl}),
 z.object({action:z.literal('message'),campaignId:z.string().max(100),body:z.string().trim().min(1).max(2000)}),
 z.object({action:z.literal('application'),id:z.string().max(100),status:z.enum(['pending','approved','rejected'])}),
]);
export async function GET(){
 const user=await getChatGPTUser();if(!user||!allowed(user.userId))return json({error:'غير مصرّح بالوصول.'},403);
 try{const db=getDb();return json({campaigns:await db.select().from(s.campaigns).orderBy(desc(s.campaigns.createdAt)),applications:await db.select().from(s.applications).orderBy(desc(s.applications.createdAt)),messages:await db.select().from(s.messages).orderBy(s.messages.createdAt),deliverables:await db.select().from(s.deliverables)});}catch(e){console.error('Admin read failed',e);return json({error:'تعذّر تحميل البيانات.'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user||!allowed(user.userId))return json({error:'غير مصرّح بالتعديل.'},403);
 if(request.headers.get('origin')!==new URL(request.url).origin)return json({error:'مصدر الطلب غير مسموح.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'صيغة غير صالحة.'},415);
 let body;try{const raw=await request.text();if(raw.length>10000)return json({error:'الطلب كبير جدًا.'},413);body=JSON.parse(raw);}catch{return json({error:'بيانات غير صالحة.'},400);}
 const parsed=schema.safeParse(body);if(!parsed.success)return json({error:'راجع بيانات التحديث والرابط.'},400);
 const data=parsed.data;
 try{
  const db=getDb();
  if(data.action==='application'){
   const [a]=await db.select().from(s.applications).where(eq(s.applications.id,data.id));if(!a)return json({error:'الطلب غير موجود.'},404);
   await db.update(s.applications).set({status:data.status}).where(eq(s.applications.id,data.id));
  }else{
   const[campaign]=await db.select().from(s.campaigns).where(eq(s.campaigns.id,data.campaignId));if(!campaign)return json({error:'الحملة غير موجودة.'},404);
   if(['cancelled','completed'].includes(campaign.status))return json({error:'الحملة مغلقة.'},409);
   if(data.action==='status'){
    const current=stages.indexOf(campaign.status as typeof stages[number]);const next=stages.indexOf(data.status);
    if(next!==current+1)return json({error:'انتقل للمرحلة التالية بالترتيب فقط.'},409);
    const files=await db.select().from(s.deliverables).where(eq(s.deliverables.campaignId,campaign.id));
    if(data.status==='review'&&!files.length)return json({error:'أضف تسليمًا قبل طلب المراجعة.'},409);
    if(data.status==='completed'&&(!files.length||files.some(f=>f.status!=='approved')))return json({error:'يجب موافقة العميل على كل التسليمات قبل إكمال الحملة.'},409);
    await db.update(s.campaigns).set({status:data.status}).where(and(eq(s.campaigns.id,campaign.id),eq(s.campaigns.status,campaign.status)));
   }else if(data.action==='revise'){
    const [file]=await db.select().from(s.deliverables).where(and(eq(s.deliverables.id,data.deliverableId),eq(s.deliverables.campaignId,campaign.id)));
    if(!file)return json({error:'التسليم غير موجود في هذه الحملة.'},404);
    if(!['production','review'].includes(campaign.status))return json({error:'تُراجع التسليمات أثناء الإنتاج أو المراجعة.'},409);
    await db.update(s.deliverables).set({title:data.title,url:data.url,status:'review'}).where(eq(s.deliverables.id,file.id));
   }else if(data.action==='deliverable'){
    if(!['production','review'].includes(campaign.status))return json({error:'تُضاف التسليمات في مرحلة الإنتاج أو المراجعة.'},409);
    await db.insert(s.deliverables).values({id:crypto.randomUUID(),campaignId:campaign.id,title:data.title,url:data.url,createdAt:Date.now()});
   }else{
    await db.insert(s.messages).values({id:crypto.randomUUID(),campaignId:campaign.id,authorId:user.userId,authorName:'فريق لقطة',isTeam:true,body:data.body,createdAt:Date.now()});
   }
  }return json({ok:true});
 }catch(e){console.error('Admin write failed',e);return json({error:'تعذّر حفظ التحديث.'},503);}
}
