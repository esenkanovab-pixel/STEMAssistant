'use client';
import {useEffect,useState} from 'react';
import {Lang,Term} from '../lib/model';
import {studioText} from '../lib/studio-i18n';
import {translations} from '../lib/i18n';
export default function CustomTerm({lang,subject,onAdd}:{lang:Lang;subject:Term['subject'];onAdd:(term:Term)=>boolean}){
 const t=studioText[lang],base=translations[lang];const [name,setName]=useState(''),[definition,setDefinition]=useState(''),[open,setOpen]=useState(false),[chosenSubject,setChosenSubject]=useState(subject);
 useEffect(()=>setChosenSubject(subject),[subject]);
 return <div className="custom-term"><button type="button" className="secondary" onClick={()=>setOpen(!open)}>＋ {t.custom}</button>{open&&<form className="panel form-panel" onSubmit={e=>{e.preventDefault();if(!name.trim()||!definition.trim())return;const term:Term={id:crypto.randomUUID(),subject:chosenSubject,name:{ky:name.trim(),ru:name.trim(),en:name.trim()},definition:{ky:definition.trim(),ru:definition.trim(),en:definition.trim()}};if(onAdd(term)){setName('');setDefinition('');setOpen(false);}}}><p>{t.customNote}</p><label>{t.subject}<select value={chosenSubject} onChange={e=>setChosenSubject(e.target.value as Term['subject'])}>{(['science','technology','engineering','math'] as const).map(s=><option key={s} value={s}>{base[s]}</option>)}</select></label><div className="form-row"><label>{t.termName}<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label><label>{t.definition}<textarea required maxLength={2000} value={definition} onChange={e=>setDefinition(e.target.value)}/></label></div><button type="submit" className="primary">{t.saveTerm}</button></form>}</div>;
}
