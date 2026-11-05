import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import * as s from '../../../db/schema';
import {and,eq,inArray,desc} from 'drizzle-orm';
import {requestSchema} from '../../lib/validation';
import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
function adminId(id:string){return(env.LOQTAH_ADMIN_USER_IDS||'').split(',').map(v=>v.trim()).filter(Boolean).includes(id);}
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'سجّل دخولك لفتح مساحة العمل.'},401);
 try{
  const db=getDb();
  const [profile]=await db.select().from(s.profiles).where(eq(s.profiles.id,user.userId));
  const campaigns=await db.select().from(s.campaigns).where(eq(s.campaigns.userId,user.userId)).orderBy(desc(s.campaigns.createdAt));
  const favorites=await db.select().from(s.favorites).where(eq(s.favorites.userId,user.userId));
  const [application]=await db.select().from(s.applications).where(eq(s.applications.userId,user.userId));
  const ids=campaigns.map(c=>c.id);
  const messages=ids.length?await db.select().from(s.messages).where(inArray(s.messages.campaignId,ids)).orderBy(s.messages.createdAt):[];
  const deliverables=ids.length?await db.select().from(s.deliverables).where(inArray(s.deliverables.campaignId,ids)):[];
  return json({profile:profile?{name:profile.name,business:profile.business,phone:profile.phone,city:profile.city}:null,campaigns:campaigns.map(({userId,...c})=>c),favorites:favorites.map(f=>f.creatorId),application:application?{name:application.name,status:application.status}:null,messages:messages.map(({authorId,...m})=>m),deliverables,isAdmin:adminId(user.userId)});
 }catch(error){console.error('Workspace read failed',error);return json({error:'تعذّر تحميل مساحة العمل. حاول مجددًا.'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'سجّل دخولك لحفظ طلبك.'},401);
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return json({error:'مصدر الطلب غير مسموح.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'صيغة الطلب غير صحيحة.'},415);
 if(Number(request.headers.get('content-length')||0)>16000)return json({error:'الطلب أكبر من الحد المسموح.'},413);
 let body;try{const raw=await request.text();if(raw.length>16000)return json({error:'الطلب كبير جدًا.'},413);body=JSON.parse(raw);}catch{return json({error:'بيانات غير صالحة.'},400);}
 const parsed=requestSchema.safeParse(body);if(!parsed.success)return json({error:parsed.error.issues[0]?.message||'راجع بياناتك.'},400);
 const data=parsed.data;
 try{
  const db=getDb();await db.insert(s.profiles).values({id:user.userId,name:user.displayName,email:user.email,createdAt:Date.now()}).onConflictDoNothing();
  if(data.action==='favorite'){
   if(data.saved)await db.insert(s.favorites).values({userId:user.userId,creatorId:data.creatorId}).onConflictDoNothing();
   else await db.delete(s.favorites).where(and(eq(s.favorites.userId,user.userId),eq(s.favorites.creatorId,data.creatorId)));
  }else if(data.action==='campaign'){
   const id=crypto.randomUUID();const{action,consent,...campaign}=data;
   await db.insert(s.campaigns).values({...campaign,id,userId:user.userId,status:'requested',createdAt:Date.now()});return json({ok:true,id},201);
  }else if(data.action==='profile'){
   const{action,...profile}=data;await db.update(s.profiles).set(profile).where(eq(s.profiles.id,user.userId));
  }else if(data.action==='apply'){
   const{action,consent,...application}=data;const existing=await db.select().from(s.applications).where(eq(s.applications.userId,user.userId));
   if(existing.length)return json({error:'لديك طلب انضمام مسجّل بالفعل.'},409);
   await db.insert(s.applications).values({...application,id:crypto.randomUUID(),userId:user.userId,createdAt:Date.now()});
  }else if(data.action==='feedback'){
   if(data.status==='changes'&&data.feedback.length<5)return json({error:'اكتب التعديلات المطلوبة.'},400);
   const[file]=await db.select().from(s.deliverables).innerJoin(s.campaigns,eq(s.deliverables.campaignId,s.campaigns.id)).where(and(eq(s.deliverables.id,data.deliverableId),eq(s.campaigns.userId,user.userId)));
   if(!file)return json({error:'الملف غير موجود.'},404);
   if(['cancelled','completed'].includes(file.campaigns.status))return json({error:'هذه الحملة مغلقة.'},409);
   await db.update(s.deliverables).set({status:data.status,feedback:data.feedback}).where(eq(s.deliverables.id,data.deliverableId));
  }else{
   const[campaign]=await db.select().from(s.campaigns).where(and(eq(s.campaigns.id,data.campaignId),eq(s.campaigns.userId,user.userId)));
   if(!campaign)return json({error:'الحملة غير موجودة.'},404);
   if(data.action==='cancel'){
    if(campaign.status!=='requested')return json({error:'يمكن سحب الطلب قبل بدء التخطيط فقط. راسل الفريق للمساعدة.'},409);
    await db.update(s.campaigns).set({status:'cancelled'}).where(and(eq(s.campaigns.id,campaign.id),eq(s.campaigns.status,'requested')));
   }else{
    if(campaign.status==='cancelled')return json({error:'الحملة ملغاة.'},409);
    await db.insert(s.messages).values({id:crypto.randomUUID(),campaignId:campaign.id,authorId:user.userId,authorName:user.displayName,body:data.body,createdAt:Date.now()});
   }
  }return json({ok:true});
 }catch(error){console.error('Workspace write failed',error);return json({error:'لم يتم الحفظ. حاول مرة أخرى.'},503);}
}
