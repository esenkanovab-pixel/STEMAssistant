'use client';
import {useEffect,useState} from 'react';
import {terms as baseTerms,initialState} from '../lib/data';
import {Lang,Lesson,Quiz,State,Term} from '../lib/model';
import {translations} from '../lib/i18n';
import {cloudConfigured,loadLocal,saveLocal} from '../lib/storage';
import LessonStudio from '../components/LessonStudio';
import QuizStudio from '../components/QuizStudio';
import {studioText} from '../lib/studio-i18n';
import DictionaryStudio from '../components/DictionaryStudio';
import {termDetails} from '../lib/term-details';
import {cabinetText} from '../lib/cabinet-i18n';
import {classText} from '../lib/class-i18n';
import ClassStudio from '../components/ClassStudio';
type Tab='dashboard'|'dictionary'|'lessons'|'quizzes'|'results'|'classes';
const icons:Record<Tab,string>={classes:'C',dashboard:'◫',dictionary:'▤',lessons:'✎',quizzes:'⚡',results:'↗'};
export default function Home(){
 const [lang,setLang]=useState<Lang>('ru'),[tab,setTab]=useState<Tab>('dashboard'),[state,setState]=useState<State>(initialState),[ready,setReady]=useState(false),[notice,setNotice]=useState(''),[storageFailed,setStorageFailed]=useState(false);
 const [search,setSearch]=useState(''),[subject,setSubject]=useState('all'),[selected,setSelected]=useState<Lesson|null>(null);
 const t=translations[lang];
 const terms=[...baseTerms,...(state.customTerms??[])].map(term=>({...term,...termDetails[term.id],...state.termDetails?.[term.id]}));
 const [quizLesson,setQuizLesson]=useState<Lesson|undefined>(),[initialQuiz,setInitialQuiz]=useState<Quiz|undefined>();
 useEffect(()=>{try{setState(loadLocal());const l=localStorage.getItem('stem-language');if(l==='ky'||l==='ru'||l==='en')setLang(l);}catch{setStorageFailed(true);}setReady(true);},[]);
 useEffect(()=>{document.documentElement.lang=lang;},[lang]);
 function changeLanguage(l:Lang){setLang(l);try{localStorage.setItem('stem-language',l);}catch{setStorageFailed(true);}}
 function persist(next:State){try{saveLocal(next);setState(next);return true;}catch{setStorageFailed(true);return false;}}
 function navigate(next:Tab){setTab(next);setNotice('');setSelected(null);setQuizLesson(undefined);setInitialQuiz(undefined);}
 function exportCSV(){const escape=(s:string)=>'"'+s.replace(/^[=+@-]/,"'").replaceAll('"','""')+'"';const csv='\uFEFF'+[ [t.student,t.quizzes,t.score,studioText[lang].points,t.date],...state.results.map(r=>[r.student,r.quizTitle??t.quizTitle,`${r.score}/${r.total}`,String(r.points??0),r.date])].map(row=>row.map(escape).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='stem-results.csv';a.click();URL.revokeObjectURL(url);}
 const filtered=terms.filter(term=>(subject==='all'||term.subject===subject)&&Object.values(term.name).concat(Object.values(term.definition)).some(v=>v.toLocaleLowerCase().includes(search.toLocaleLowerCase())));
 const average=state.results.length?Math.round(state.results.reduce((a,r)=>a+r.score/r.total,0)/state.results.length*100):null;
 const subjectName=(s:string)=>t[s as 'science'|'technology'|'engineering'|'math'];
 const subjectOptions=<>{(['science','technology','engineering','math'] as const).map(s=><option key={s} value={s}>{t[s]}</option>)}</>;
 return <div className="shell"><aside><a className="brand" href="/" aria-label="STEM Assistant"><span className="logo">✳</span><span>STEM<span className="brand-sub">ASSISTANT</span></span></a><p className="side-caption">{t.workspace}</p><nav aria-label={t.navigation}>{(Object.keys(icons) as Tab[]).map(item=><button key={item} className={tab===item?'nav active':'nav'} onClick={()=>navigate(item)}><span>{icons[item]}</span>{item==='classes'?classText[lang].title:t[item]}</button>)}</nav><div className="side-bottom"><span className="status-dot"/>{t.demo}<p>{t.demoInfo}</p></div></aside><main><header><div className="breadcrumb">{cabinetText[lang].teacher} <span>/</span> {tab==='classes'?classText[lang].title:t[tab]}</div><a className="text-button workspace-switch" href="/student">{cabinetText[lang].student} →</a><div className="languages" aria-label={t.language}>{(['ky','ru','en'] as Lang[]).map(l=><button key={l} aria-pressed={lang===l} className={lang===l?'chosen':''} onClick={()=>changeLanguage(l)}>{l==='ky'?'КЫР':l==='ru'?'РУС':'ENG'}</button>)}</div></header><div className="content">
 {storageFailed&&<div className="alert" role="alert">{t.storageError}</div>}{cloudConfigured&&<div className="alert">{t.cloudInfo}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
 {tab==='dashboard'&&<><section className="hero"><div className="hero-copy"><span className="eyebrow">{t.tagline}</span><h1>{t.hello}</h1><p>{t.intro}</p><div className="actions"><button className="primary" onClick={()=>navigate('lessons')}>{t.start} <span>↗</span></button><button className="secondary" onClick={()=>navigate('dictionary')}>{t.explore}</button></div></div><div className="orbital" aria-hidden="true"><div className="orbit one"/><div className="orbit two"/><div className="orbit three"/><div className="nucleus">✳</div><span className="particle p1">π</span><span className="particle p2">+</span><span className="particle p3">⚡</span></div></section><section className="stats">{[[t.terms,terms.length,'◈'],[t.saved,state.lessons.length,'▤'],[t.attempts,state.results.length,'⚡'],[t.average,average===null?'—':average+'%','↗']].map(([label,value,icon])=><div className="stat" key={label}><span className="stat-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div>)}</section><div className="section-head"><h2>{t.recent}</h2><button className="text-button" onClick={()=>navigate('lessons')}>{t.view} →</button></div><div className="dashboard-bottom"><div className="panel">{state.lessons.length?state.lessons.slice(0,3).map(l=><button className="lesson-row" key={l.id} onClick={()=>{navigate('lessons');setSelected(l);}}><span className="tile">✎</span><span><strong>{l.title}</strong><small>{subjectName(l.subject)} · {t.grade} {l.grade}</small></span><span>↗</span></button>):<div className="empty"><span>✎</span><p>{t.emptyLessons}</p><button className="text-button" onClick={()=>navigate('lessons')}>{t.start} →</button></div>}</div><div className="tip"><span className="eyebrow">STEM LAB</span><h2>{t.tipTitle}</h2><p>{t.tip}</p><div className="tip-drawing" aria-hidden="true">△ + ◯ = ✧</div></div></div></>}
 {tab==='dictionary'&&<DictionaryStudio lang={lang} terms={terms} state={state} persist={persist}/>}
 {tab==='lessons'&&<LessonStudio lang={lang} state={state} terms={terms} persist={persist} initialLesson={selected} onQuiz={lesson=>{navigate('quizzes');setQuizLesson(lesson);}} onPlay={quiz=>{navigate('quizzes');setInitialQuiz(quiz);}}/>}
 {tab==='quizzes'&&<QuizStudio key={quizLesson?.id??initialQuiz?.id??'studio'} lang={lang} state={state} terms={terms} persist={persist} lesson={quizLesson} initialQuiz={initialQuiz}/>}
 {tab==='classes'&&<ClassStudio lang={lang} state={state}/>}
 {tab==='results'&&<><div className="page-title"><span className="eyebrow">04 / STEM</span><h1>{t.results}</h1></div><div className="section-head"><p>{t.attempts}: {state.results.length} · {t.average}: {average===null?'—':average+'%'}</p><button disabled={!state.results.length} className="secondary" onClick={exportCSV}>{t.download} ↓</button></div><div className="panel table-wrap">{!state.results.length?<div className="empty">{t.emptyResults}</div>:<table><thead><tr><th>{t.student}</th><th>{t.quizzes}</th><th>{t.score}</th><th>{t.date}</th></tr></thead><tbody>{state.results.map(r=><tr key={r.id}><td><span className="avatar">{r.student.slice(0,1).toUpperCase()}</span>{r.student}</td><td>{r.quizTitle??t.quizTitle}</td><td><span className="score-badge">{r.score}/{r.total} · {Math.round(r.score/r.total*100)}%</span>{r.points!==undefined&&<small className="result-points">⚡ {r.points} {studioText[lang].pointsCount}</small>}</td><td>{new Date(r.date).toLocaleString(lang==='ky'?'ky-KG':lang==='ru'?'ru-RU':'en-GB')}</td></tr>)}</tbody></table>}</div></>}
 </div><footer>STEM Assistant <span>✳</span> {t.tagline}</footer></main></div>;
}

