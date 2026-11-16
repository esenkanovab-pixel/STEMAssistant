import {randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {GameQuestion,Quiz,Result,gamePoints,isCorrect,isState,validGameQuestions} from './model';
export type Session={code:string;ownerToken:string;quiz:Quiz;open:boolean;createdAt:string;results:Result[];attempts:Record<string,{result:Result;answers:Record<string,string>}>};
type Store={sessions:Session[]};
export class SessionError extends Error{constructor(public code:string,public status:number){super(code);}}
export function publicSession(s:Session){return {code:s.code,open:s.open,title:s.quiz.title,lang:s.quiz.lang,grade:s.quiz.grade,subject:s.quiz.subject,questions:s.quiz.questions.map(({id,kind,prompt,choices})=>({id,kind,prompt,choices}))};}
export function verifyOwner(s:Session,token:string){const a=Buffer.from(s.ownerToken),b=Buffer.from(token);return a.length===b.length&&timingSafeEqual(a,b);}
export function validateQuiz(value:unknown):value is Quiz{return isState({lessons:[],results:[],quizzes:[value]})&&JSON.stringify(value).length<40000;}
export function gradeSession(questions:GameQuestion[],answers:Record<string,string>){let score=0,streak=0,points=0;for(const q of questions){const correct=isCorrect(q,answers[q.id]??'');streak=correct?streak+1:0;if(correct)score++;points+=gamePoints(correct,streak);}return {score,total:questions.length,points};}
export function createSessionStore(directory:string){
 const file=path.join(directory,'sessions.json');let queue:Promise<unknown>=Promise.resolve();
 async function read():Promise<Store>{try{const data=JSON.parse(await readFile(file,'utf8')) as Store;if(!Array.isArray(data.sessions)||data.sessions.some(s=>!s||!validateQuiz(s.quiz)||!validGameQuestions(s.quiz.questions)))throw Error('Invalid session storage');return data;}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {sessions:[]};throw e;}}
 function transaction<T>(fn:(store:Store)=>T|Promise<T>,write=false):Promise<T>{const run=queue.then(async()=>{const store=await read();const result=await fn(store);if(write){await mkdir(directory,{recursive:true});const temporary=path.join(directory,'sessions-'+randomBytes(8).toString('hex')+'.tmp');await writeFile(temporary,JSON.stringify(store),{encoding:'utf8',mode:0o600});await rename(temporary,file);}return result;});queue=run.catch(()=>{});return run;}
 function find(store:Store,code:string){const s=store.sessions.find(v=>v.code===code);if(!s)throw new SessionError('notFound',404);return s;}
 function owner(s:Session,token:string){if(!verifyOwner(s,token))throw new SessionError('forbidden',403);}
 function review(s:Session,result:Result,answers:Record<string,string>){return {result,review:s.quiz.questions.map(q=>({...q,studentAnswer:answers[q.id],correct:isCorrect(q,answers[q.id])}))};}
 return {
  create(quiz:Quiz){return transaction(store=>{if(!validateQuiz(quiz))throw new SessionError('invalid',400);if(store.sessions.length>=100)throw new SessionError('limit',429);let code='';const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';do{code=Array.from(randomBytes(6),v=>alphabet[v%alphabet.length]).join('');}while(store.sessions.some(s=>s.code===code));const s:Session={code,ownerToken:randomBytes(32).toString('hex'),quiz:structuredClone(quiz),open:true,createdAt:new Date().toISOString(),results:[],attempts:{}};store.sessions.push(s);return {code,ownerToken:s.ownerToken};},true);},
  get(code:string){return transaction(store=>publicSession(find(store,code)));},
  results(code:string,token:string){return transaction(store=>{const s=find(store,code);owner(s,token);return {code:s.code,open:s.open,title:s.quiz.title,results:s.results,errors:s.quiz.questions.map(q=>({prompt:q.prompt,count:Object.values(s.attempts).filter(a=>!isCorrect(q,a.answers[q.id])).length})).filter(q=>q.count>0).sort((a,b)=>b.count-a.count)};});},
  close(code:string,token:string){return transaction(store=>{const s=find(store,code);owner(s,token);s.open=false;return {open:false};},true);},
  submit(code:string,student:string,attemptId:string,answers:Record<string,string>){return transaction(store=>{const s=find(store,code);if(!/^[a-f0-9-]{36}$/i.test(attemptId)||!student.trim()||student.trim().length>80||!answers||typeof answers!=='object'||Array.isArray(answers))throw new SessionError('invalid',400);
   const old=s.attempts[attemptId];if(old){if(old.result.student!==student.trim()||s.quiz.questions.some(q=>old.answers[q.id]!==answers[q.id]))throw new SessionError('invalid',400);return review(s,old.result,old.answers);}
   if(!s.open)throw new SessionError('closed',409);if(s.results.length>=200)throw new SessionError('limit',429);
   if(Object.keys(answers).length!==s.quiz.questions.length||s.quiz.questions.some(q=>typeof answers[q.id]!=='string'||!answers[q.id].trim()||answers[q.id].length>500||(q.kind!=='short'&&!q.choices.includes(answers[q.id]))))throw new SessionError('invalid',400);
   const result:Result={id:attemptId,student:student.trim(),quizId:s.quiz.id,quizTitle:s.quiz.title,...gradeSession(s.quiz.questions,answers),date:new Date().toISOString(),...(s.quiz.lessonId?{lessonId:s.quiz.lessonId}:{})};s.results.unshift(result);s.attempts[attemptId]={result,answers:{...answers}};return review(s,result,answers);
  },true);}
 };
}
// Local single-server demo adapter; replace with durable database transactions for deployment.
export const sessionStore=createSessionStore(path.join(process.cwd(),'.local-games'));
