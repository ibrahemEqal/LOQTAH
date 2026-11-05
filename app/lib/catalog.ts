export type Creator={id:string;name:string;role:string;category:string;city:string;image:string;cover:string;color:string;bio:string;skills:string[]};
export const categories=['الكل','أزياء وجمال','مطاعم وكافيهات','لايف ستايل','تصوير ومونتاج'];
export const cities=['نابلس','رام الله','جنين','طولكرم','سلفيت','قلقيلية','بيت لحم','الخليل'];
// Illustrative profiles, not registered creators or verified availability.
export const creators:Creator[]=[
 {id:'lina',name:'لينا أحمد',role:'صانعة محتوى • أزياء وجمال',category:'أزياء وجمال',city:'نابلس',image:'/images/creator-lina.jpg',cover:'/images/fashion.jpg',color:'#eee4e1',bio:'أحب أحكي قصة المنتج بتفاصيل بسيطة وقريبة من الناس. محتوى للأزياء، الجمال، والعلامات المحلية بروح عفوية.',skills:['محتوى UGC','تنسيق أزياء','ريلز إنستغرام']},
 {id:'adam',name:'آدم خليل',role:'صانع محتوى • مطاعم وكافيهات',category:'مطاعم وكافيهات',city:'رام الله',image:'/images/creator-adam.jpg',cover:'/images/food.jpg',color:'#e2e8dc',bio:'لكل طبق حكاية. أصنع محتوى يبرز تجربة المكان وتفاصيله، من أول فنجان قهوة إلى آخر لقمة.',skills:['تجارب مطاعم','تصوير طعام','كتابة أفكار']},
 {id:'nour',name:'نور عادل',role:'صانعة محتوى • لايف ستايل',category:'لايف ستايل',city:'نابلس',image:'/images/creator-nour.jpg',cover:'/images/coffee.jpg',color:'#e7dff0',bio:'أشارك اللحظات اليومية وأحوّل المنتجات إلى جزء طبيعي من الحكاية. محتوى بسيط، مدروس، وقريب من جمهورك.',skills:['محتوى UGC','فيديو منتجات','لايف ستايل']},
 {id:'omar',name:'عمر منصور',role:'مصور ومخرج • تصوير ومونتاج',category:'تصوير ومونتاج',city:'جنين',image:'/images/creator-omar.jpg',cover:'/images/studio.jpg',color:'#e6e1d9',bio:'أحوّل الأفكار إلى مشاهد. تصوير منتجات وإعلانات قصيرة باهتمام بالإضاءة، الحركة، والتفاصيل.',skills:['تصوير إعلاني','مونتاج','إخراج بصري']},
 {id:'sara',name:'سارة خالد',role:'صانعة محتوى • أزياء وجمال',category:'أزياء وجمال',city:'رام الله',image:'/images/creator-sara.jpg',cover:'/images/fashion.jpg',color:'#ecdfdb',bio:'محتوى يعبّر عن شخصية العلامة ويعطي المنتج مساحته. أهتم بالتفاصيل والألوان والأسلوب البصري المتناسق.',skills:['تصوير منتجات','جمال وعناية','محتوى UGC']},
 {id:'yazan',name:'يزن سامي',role:'مصور • مطاعم وكافيهات',category:'مطاعم وكافيهات',city:'طولكرم',image:'/images/creator-yazan.jpg',cover:'/images/coffee.jpg',color:'#dce6e1',bio:'تصوير للمقاهي والمطاعم، من تفاصيل التحضير إلى تجربة الزائر. لقطات دافئة تحكي قصة المكان.',skills:['تصوير مقاهي','فيديو قصير','مونتاج']},
];
export const packages=[
 {id:'spark',name:'أول لقطة',tag:'جرّب الفكرة',price:650,description:'إعلان واحد، بداية مدروسة.',features:['فيديو ريلز واحد حتى 30 ثانية','فكرة ونص إعلاني','جلسة تصوير حتى ساعتين','جولة تعديلات واحدة','نسخة جاهزة للنشر'],deliverables:1},
 {id:'story',name:'لقطة متكاملة',tag:'مساحة أكبر لحكايتك',price:1450,description:'محتوى متنوع لحضور أقوى.',features:['3 فيديوهات ريلز حتى 45 ثانية','6 صور منتجات معدّلة','تطوير الفكرة وجدولة التصوير','جولتا تعديلات','تنظيم التسليم وحقوق الاستخدام'],deliverables:3},
 {id:'partner',name:'لقطة كل شهر',tag:'استمرّ بالصورة',price:2800,description:'خطة محتوى تمشي مع علامتك.',features:['6 فيديوهات ريلز شهريًا','12 صورة منتجات معدّلة','خطة محتوى شهرية','جولتا تعديلات لكل فيديو','متابعة وتقرير للمحتوى المنشور'],deliverables:6},
];
export const stages=['requested','planning','production','review','completed'] as const;
export const statusLabels:Record<string,string>={requested:'بانتظار المراجعة',planning:'تجهيز الفكرة',production:'قيد الإنتاج',review:'بانتظار موافقتك',completed:'مكتملة',cancelled:'ملغاة'};
export type Campaign={id:string;title:string;business:string;category:string;city:string;brief:string;packageId:string;budget:number;date:string;creatorId:string|null;status:string;createdAt:number};
export type Message={id:string;campaignId:string;authorName:string;body:string;isTeam:boolean;createdAt:number};
export type Deliverable={id:string;campaignId:string;title:string;url:string;status:string;feedback:string};
export type Workspace={campaigns:Campaign[];favorites:string[];messages:Message[];deliverables:Deliverable[];profile:{name:string;business:string;phone:string;city:string}|null;application:{status:string;name:string}|null;isAdmin:boolean};
export const emptyWorkspace:Workspace={campaigns:[],favorites:[],messages:[],deliverables:[],profile:null,application:null,isAdmin:false};
export const money=(n:number)=>new Intl.NumberFormat('en-US').format(n);
