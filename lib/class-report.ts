import {Result} from './model';
export type ReportTask={id:string;title:string;kind:'lesson'|'quiz';due:string;completed?:string[];results?:Result[]};
export type ReportClass={code:string;name:string;members?:string[];assignments:ReportTask[]};
export function classReport(c:ReportClass,now=Date.now()){
 const rows=(c.members??[]).flatMap(student=>c.assignments.map(a=>{
  const result=a.kind==='quiz'?a.results?.filter(r=>r.student===student).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))[0]:undefined;
  const done=a.kind==='lesson'?!!a.completed?.includes(student):!!result;
  return {student,assignmentId:a.id,title:a.title,kind:a.kind,due:a.due,done,overdue:!done&&!!a.due&&Date.parse(a.due)<now,result};
 }));
 const scores=rows.flatMap(r=>r.result?[r.result.score/r.result.total*100]:[]);
 return {rows,completed:rows.filter(r=>r.done).length,total:rows.length,overdue:rows.filter(r=>r.overdue).length,average:scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null};
}
export function csvCell(value:string){return '"'+(/^[\s]*[=+@-]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';}
export function reportCSV(rows:string[][]){return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
