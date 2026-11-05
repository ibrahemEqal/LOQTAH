import {z} from 'zod';
import {cities,categories,packages,creators} from './catalog';
const str=(min:number,max:number)=>z.string().trim().min(min).max(max);
const city=z.string().refine(v=>cities.includes(v),'اختر مدينة من القائمة');
const category=z.string().refine(v=>categories.slice(1).includes(v),'اختر المجال');
export const safeUrl=z.string().url().max(1500).refine(v=>new URL(v).protocol==='https:','استخدم رابط HTTPS آمنًا');
export const requestSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('campaign'),title:str(3,100),business:str(2,100),category,city,brief:str(20,3000),packageId:z.string().refine(v=>packages.some(p=>p.id===v)),budget:z.number().int().min(300).max(100000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T12:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===v&&v>=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Hebron'}).format(new Date())},'اختر موعدًا قادمًا'),creatorId:z.string().nullable().refine(v=>v===null||creators.some(c=>c.id===v)),consent:z.literal(true)}),
 z.object({action:z.literal('favorite'),creatorId:z.string().refine(v=>creators.some(c=>c.id===v)),saved:z.boolean()}),
 z.object({action:z.literal('message'),campaignId:str(1,100),body:str(1,2000)}),
 z.object({action:z.literal('cancel'),campaignId:str(1,100)}),
 z.object({action:z.literal('feedback'),deliverableId:str(1,100),status:z.enum(['approved','changes']),feedback:z.string().trim().max(2000)}),
 z.object({action:z.literal('profile'),name:str(2,100),business:z.string().trim().max(100),phone:z.string().trim().max(30),city}),
 z.object({action:z.literal('apply'),name:str(2,100),city,category,portfolio:safeUrl,bio:str(20,2000),phone:str(7,30),consent:z.literal(true)}),
]);
