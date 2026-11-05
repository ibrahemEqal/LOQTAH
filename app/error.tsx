'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){
 return <main className="container workspace-page"><div className="empty-state"><span className="overline">المشهد انقطع للحظة</span><h1 className="page-title">خلّينا نجرّب مرة ثانية.</h1><p>صار خطأ أثناء تحميل الصفحة. بياناتك المحفوظة تظل في حسابك.</p><button className="btn btn-coral" onClick={reset}>إعادة المحاولة</button></div></main>;
}
