'use client';

import {useEffect,useState} from 'react';

import {Lang,Lesson,Result,State} from '../lib/model';

import {StudentData,loadStudent,saveStudent} from '../lib/student-storage';

import ClassReport from './ClassReport';
import {classText} from '../lib/class-i18n';

type Access={code:string;ownerToken:string;name:string};

type Task={id:string;kind:'quiz'|'lesson';title:string;due:string;sessionCode?:string;lesson?:Lesson;completed?:string[];results?:Result[];errors?:{prompt:string;count:number}[]};

type Classroom={code:string;name:string;members?:string[];assignments:Task[]};

const KEY='stem-class-access-v1';

export default function ClassStudio({lang,state,student,onStudentChange}:{lang:Lang;state?:State;student?:StudentData;onStudentChange?:()=>void}){

 const t=classText[lang];const [access,setAccess]=useState<Access[]>([]),[classes,setClasses]=useState<Classroom[]>([]),[name,setName]=useState(''),[code,setCode]=useState(''),[token,setToken]=useState(''),[target,setTarget]=useState(''),[resource,setResource]=useState(''),[due,setDue]=useState(''),[error,setError]=useState(false),[busy,setBusy]=useState(false),[lesson,setLesson]=useState<Task|null>(null);

 async function request(code:string,body?:unknown,owner?:string){const r=await fetch('/api/classes?code='+encodeURIComponent(code),{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(owner?{'x-class-owner':owner}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('request');return r.json();}

 async function refresh(items=access){try{const codes=student?(student.classCodes??[]):items.map(a=>a.code);setClasses(await Promise.all(codes.map(c=>request(c,undefined,student?undefined:items.find(a=>a.code===c)?.ownerToken))));setError(false);}catch{setError(true);}}

 useEffect(()=>{if(student){void refresh();}else{try{const items=JSON.parse(localStorage.getItem(KEY)??'[]');if(!Array.isArray(items)||items.some(a=>typeof a.code!=='string'||typeof a.ownerToken!=='string'))throw Error('storage');setAccess(items);void refresh(items);}catch{setError(true);}}},[student?.classCodes?.join(',')]);

 async function act(fn:()=>Promise<void>){setBusy(true);try{await fn();setError(false);}catch{setError(true);}finally{setBusy(false);}}

 function keep(items:Access[]){localStorage.setItem(KEY,JSON.stringify(items));setAccess(items);}

 const resources=[...(state?.lessons??[]).map(l=>({value:'lesson:'+l.id,title:t.lesson+' · '+l.title})),...(state?.quizzes??[]).map(q=>({value:'quiz:'+q.id,title:t.quiz+' · '+q.title}))];

 return <section className="class-studio"><div className="section-head"><h1>{t.title}</h1><button className="secondary" onClick={()=>void refresh()} disabled={busy}>{t.refresh}</button></div><p className="small-note">{t.demo}</p>{error&&<p className="alert" role="alert">{t.error}</p>}

 <form className="panel form-panel" onSubmit={e=>{e.preventDefault();void act(async()=>{if(student){if(!student.name)throw Error('name');await request(code,{action:'join',student:student.name});const latest=loadStudent();saveStudent({...latest,classCodes:[...new Set([...(latest.classCodes??[]),code])]});onStudentChange?.();await refresh();}else{const item=await request('',{action:'create',name});const next=[...access,item];keep(next);setTarget(item.code);await refresh(next);}setName('');setCode('');});}}><label>{student?t.code:t.name}<input required maxLength={student?6:80} minLength={student?6:1} pattern={student?'[A-Z2-9]{6}':undefined} value={student?code:name} onChange={e=>student?setCode(e.target.value.toUpperCase()):setName(e.target.value)}/></label><button className="primary" disabled={busy}>{student?t.join:t.create}</button></form>

 {!student&&<><details className="panel form-panel"><summary>{t.restore}</summary><form onSubmit={e=>{e.preventDefault();void act(async()=>{const c=await request(code,undefined,token);const next=[...access.filter(a=>a.code!==code),{code,ownerToken:token,name:c.name}];keep(next);await refresh(next);});}}><label>{t.code}<input required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} maxLength={6}/></label><label>{t.key}<input required value={token} onChange={e=>setToken(e.target.value)} maxLength={64}/></label><button className="secondary" disabled={busy}>{t.restore}</button></form></details>{classes.length>0&&<form className="panel form-panel" onSubmit={e=>{e.preventDefault();void act(async()=>{const [kind,id]=resource.split(':');const deadline=String(new FormData(e.currentTarget).get('due')??'');await request(target,{action:'assign',kind,due:deadline?new Date(deadline).toISOString():'',...(kind==='lesson'?{lesson:state?.lessons.find(l=>l.id===id)}:{quiz:state?.quizzes?.find(q=>q.id===id)})},access.find(a=>a.code===target)?.ownerToken);await refresh();});}}><label>{t.title}<select required value={target} onChange={e=>setTarget(e.target.value)}><option value="">—</option>{classes.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label><label>{t.select}<select required value={resource} onChange={e=>setResource(e.target.value)}><option value="">—</option>{resources.map(r=><option key={r.value} value={r.value}>{r.title}</option>)}</select></label><label>{t.due}<input name="due" type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label><button className="primary" disabled={busy}>{t.assign}</button></form>}</>}

 {!classes.length&&<p>{t.empty}</p>}{classes.map(c=><article className="panel form-panel" key={c.code}><h2>{c.name}</h2><p>{t.code}: <strong className="class-code">{c.code}</strong></p>{!student&&<details><summary>{t.key}</summary><p className="class-key">{access.find(a=>a.code===c.code)?.ownerToken}</p></details>}<h3>{t.all}</h3>{!student&&<ClassReport classroom={c} lang={lang}/>}{!c.assignments.length&&<p>{t.none}</p>}{c.assignments.map(a=>{const done=student&&(a.kind==='quiz'?student.attempts.some(r=>r.code===a.sessionCode&&r.result.student===student.name):student.completedAssignments?.includes(a.id));return <div className="class-task" key={a.id}><strong>{a.kind==='quiz'?'⚡':'✎'} {a.title}</strong>{a.due&&<p>{t.due}: {new Date(a.due).toLocaleString(lang)} {Date.parse(a.due)<Date.now()?' · '+t.overdue:''}</p>}{student?<><p>{done?t.done:t.pending}</p>{a.kind==='quiz'?<a className="secondary" href={'/play?code='+a.sessionCode}>{t.play} →</a>:<button className="secondary" onClick={()=>setLesson(a)}>{t.read}</button>}</>:<div className="table-wrap"><table><thead><tr><th>{t.members}</th><th>{t.score}</th></tr></thead><tbody>{(c.members??[]).map(n=>{const r=a.results?.find(r=>r.student===n);return <tr key={n}><td>{n}</td><td>{a.kind==='lesson'?(a.completed?.includes(n)?t.done:t.pending):r?`${r.score}/${r.total} · ${Math.round(r.score/r.total*100)}%`:t.pending}</td></tr>;})}</tbody></table>{a.errors?.map(q=><p key={q.prompt}>{lang==='ru'?'Ошибки':lang==='ky'?'Каталар':'Errors'}: {q.prompt} — {q.count}</p>)}</div>}</div>;})}{!student&&<p>{t.members}: {(c.members??[]).join(', ')||'—'}</p>}</article>)}

 {lesson&&student&&<section className="panel form-panel" role="region"><button className="text-button" onClick={()=>setLesson(null)}>{t.close} ×</button><h2>{lesson.title}</h2><p>{lesson.lesson?.objective}</p><p>{lesson.lesson?.materials}</p>{lesson.lesson?.stages?.map(s=><div className="review" key={s.id}><h3>{s.title} · {s.minutes} min</h3><p className="lesson-content">{s.content}</p></div>)}{!lesson.lesson?.stages?.length&&<p className="lesson-content">{lesson.lesson?.activities}</p>}<button className="primary" disabled={busy} onClick={()=>void act(async()=>{const c=classes.find(c=>c.assignments.some(a=>a.id===lesson.id));await request(c!.code,{action:'complete',id:lesson.id,student:student.name});const latest=loadStudent();saveStudent({...latest,completedAssignments:[...new Set([...(latest.completedAssignments??[]),lesson.id])]});onStudentChange?.();setLesson(null);})}>{t.complete}</button></section>}

 </section>;

}

