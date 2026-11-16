export type Lang = 'ky' | 'ru' | 'en';
export type Localized = Record<Lang, string>;
export type TermDetails={simple?:Localized;example?:Localized;formula?:string;formulaNote?:Localized;image?:string;caption?:string};
export type Term = TermDetails & {id:string; name:Localized; definition:Localized; subject: 'science'|'technology'|'engineering'|'math'};
export type Stage = {id:string; title:string; minutes:number; content:string};
export type Lesson = {id:string; title:string; subject:string; grade:string; objective:string; activities:string; termIds:string[]; createdAt:string; stages?:Stage[]; materials?:string};
export type Question = {id:string; prompt:Localized; choices:Localized[]; correct:number};
export type Result = {id:string; student:string; quizId:string; score:number; total:number; date:string; quizTitle?:string; points?:number; lessonId?:string};
export type GameKind='choice'|'boolean'|'short';
export type GameQuestion={id:string;kind:GameKind;prompt:string;choices:string[];answer:string;explanation:string};
export type Quiz={id:string;title:string;topic:string;subject:string;grade:string;lang:Lang;questions:GameQuestion[];createdAt:string;source:'library'|'material'|'ai'|'manual';lessonId?:string};
export type State = {lessons:Lesson[]; results:Result[];customTerms?:Term[];quizzes?:Quiz[];termDetails?:Record<string,TermDetails>};
export function validTermDetails(value:unknown):value is TermDetails {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const d=value as TermDetails;
 return ['simple','example','formulaNote'].every(k=>d[k as 'simple']===undefined||['ky','ru','en'].every(l=>typeof d[k as 'simple']?.[l as Lang]==='string'))&&[d.formula,d.caption].every(v=>v===undefined||typeof v==='string')&&(d.image===undefined||(typeof d.image==='string'&&d.image.length<600000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(d.image)));
}
export function normalizeAnswer(value:string){return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/ё/g,'е').replace(/[.!?]+$/,'').replace(/\s+/g,' ');}
export function isCorrect(q:GameQuestion,answer:string){return normalizeAnswer(answer)===normalizeAnswer(q.answer);}
export function gamePoints(correct:boolean,streak:number){return correct?100+Math.min(Math.max(streak-1,0),4)*25:0;}
export function validGameQuestions(value:unknown):value is GameQuestion[]{
 if(!Array.isArray(value)||value.length<1||value.length>20)return false;
 const ids=new Set<string>();
 return value.every(q=>{if(!q||typeof q!=='object'||typeof q.id!=='string'||ids.has(q.id)||!['choice','boolean','short'].includes(q.kind)||typeof q.prompt!=='string'||!q.prompt.trim()||typeof q.answer!=='string'||!q.answer.trim()||typeof q.explanation!=='string'||!Array.isArray(q.choices)||!q.choices.every((c:unknown)=>typeof c==='string'&&c.trim()))return false;ids.add(q.id);return q.kind==='short'?q.choices.length===0:q.choices.length>1&&q.choices.length<=6&&new Set(q.choices).size===q.choices.length&&q.choices.includes(q.answer)&&(q.kind!=='boolean'||q.choices.length===2);});
}
export function gradeQuiz(questions:Question[], answers:Record<string,number>) {return questions.reduce((score,q)=>score+(answers[q.id]===q.correct?1:0),0);}
export function validLesson(lesson:Pick<Lesson,'title'|'objective'|'activities'>) {return !!(lesson.title.trim()&&lesson.objective.trim()&&lesson.activities.trim());}
export function isState(value:unknown):value is State {
 if (!value || typeof value !== 'object') return false;
 const s=value as State;
 if(s.termDetails!==undefined&&(!s.termDetails||typeof s.termDetails!=='object'||Array.isArray(s.termDetails)||!Object.values(s.termDetails).every(validTermDetails)))return false;
 if(Array.isArray(s.customTerms)&&s.customTerms.some(term=>!validTermDetails(term)))return false;
 if(s.customTerms!==undefined&&(!Array.isArray(s.customTerms)||!s.customTerms.every(term=>term&&typeof term.id==='string'&&['science','technology','engineering','math'].includes(term.subject)&&['ky','ru','en'].every(l=>typeof term.name?.[l as Lang]==='string'&&typeof term.definition?.[l as Lang]==='string'))))return false;
 if(s.quizzes!==undefined&&(!Array.isArray(s.quizzes)||!s.quizzes.every(q=>q&&typeof q.id==='string'&&typeof q.title==='string'&&typeof q.topic==='string'&&typeof q.grade==='string'&&['science','technology','engineering','math'].includes(q.subject)&&['ky','ru','en'].includes(q.lang)&&['library','material','ai','manual'].includes(q.source)&&typeof q.createdAt==='string'&&Number.isFinite(Date.parse(q.createdAt))&&validGameQuestions(q.questions))))return false;
 if(Array.isArray(s.lessons)&&s.lessons.some(l=>l?.stages!==undefined&&(!Array.isArray(l.stages)||!l.stages.every(stage=>stage&&typeof stage.id==='string'&&typeof stage.title==='string'&&typeof stage.content==='string'&&Number.isFinite(stage.minutes)&&stage.minutes>=1&&stage.minutes<=120))))return false;
 return Array.isArray(s.lessons)&&Array.isArray(s.results)&&s.lessons.every(l=>l&&typeof l==='object'&&typeof l.id==='string'&&typeof l.title==='string'&&typeof l.objective==='string'&&typeof l.activities==='string'&&['science','technology','engineering','math'].includes(l.subject)&&typeof l.grade==='string'&&Array.isArray(l.termIds)&&l.termIds.every(t=>typeof t==='string')&&typeof l.createdAt==='string'&&Number.isFinite(Date.parse(l.createdAt)))&&s.results.every(r=>r&&typeof r==='object'&&typeof r.id==='string'&&typeof r.student==='string'&&typeof r.quizId==='string'&&Number.isInteger(r.score)&&Number.isInteger(r.total)&&r.score>=0&&r.total>0&&r.score<=r.total&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date)));
}
