import {GameQuestion,Lang,Result,isState,validGameQuestions} from './model';
export type StudentAttempt={code:string;lang:Lang;title:string;result:Result;review:(GameQuestion&{studentAnswer:string;correct:boolean})[]};
export type StudentData={name:string;attempts:StudentAttempt[];classCodes?:string[];completedAssignments?:string[]};
const KEY='stem-student-v1';
export function validStudentData(value:unknown):value is StudentData{
 if(!value||typeof value!=='object')return false;const s=value as StudentData;
 if(typeof s.name!=='string'||s.name.length>80||!Array.isArray(s.attempts))return false;
 if(s.classCodes!==undefined&&(!Array.isArray(s.classCodes)||s.classCodes.some(c=>typeof c!=="string"||!/^[A-Z2-9]{6}$/.test(c))))return false;
 if(s.completedAssignments!==undefined&&(!Array.isArray(s.completedAssignments)||s.completedAssignments.some(c=>typeof c!=="string"||!/^[a-f0-9]{32}$/.test(c))))return false;
 const ids=new Set<string>();return s.attempts.every(a=>{if(!a||typeof a.title!=='string'||!['ky','ru','en'].includes(a.lang)||!/^[A-Z2-9]{6}$/.test(a.code)||!isState({lessons:[],results:[a.result]})||!validGameQuestions(a.review)||a.review.length!==a.result.total||a.review.some(q=>typeof q.studentAnswer!=='string'||typeof q.correct!=='boolean')||ids.has(a.result.id))return false;ids.add(a.result.id);return a.result.points===undefined||Number.isInteger(a.result.points)&&a.result.points>=0;});
}
export function loadStudent():StudentData{const raw=localStorage.getItem(KEY);if(!raw)return {name:'',attempts:[]};const value:unknown=JSON.parse(raw);if(!validStudentData(value))throw Error('Invalid student data');return value;}
export function saveStudent(data:StudentData){if(!validStudentData(data))throw Error('Invalid student data');localStorage.setItem(KEY,JSON.stringify(data));}
export function rememberAttempt(attempt:StudentAttempt){const previous=loadStudent();saveStudent({...previous,name:attempt.result.student,attempts:[attempt,...previous.attempts.filter(a=>a.result.id!==attempt.result.id)]});}
