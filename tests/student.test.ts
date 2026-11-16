import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStudent,saveStudent,rememberAttempt,validStudentData,StudentAttempt} from '../lib/student-storage';
import {cabinetText} from '../lib/cabinet-i18n';
test('student profile preserves attempts, deduplicates submission retries and restores full review',()=>{
 const original=globalThis.localStorage;const data=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
 try{
  assert.deepEqual(loadStudent(),{name:'',attempts:[]});saveStudent({name:'Ученица',attempts:[]});assert.equal(loadStudent().name,'Ученица');
  const a:StudentAttempt={code:'ABC234',lang:'ru',title:'Сила',result:{id:'r1',student:'Ученица',quizId:'q1',score:1,total:1,points:100,date:new Date().toISOString()},review:[{id:'question1',kind:'choice',prompt:'Единица силы?',choices:['Ньютон','Джоуль'],answer:'Ньютон',explanation:'Сила измеряется в ньютонах.',studentAnswer:'Ньютон',correct:true}]};
  rememberAttempt(a);rememberAttempt(a);assert.equal(loadStudent().attempts.length,1);assert.deepEqual(loadStudent().attempts[0],a);
  saveStudent({...loadStudent(),name:'Новое имя'});assert.equal(loadStudent().attempts[0].result.student,'Ученица');
  assert.equal(validStudentData({name:'A',attempts:[{...a,review:[]}]}),false);
  assert.equal(validStudentData({name:'A',attempts:[a,a]}),false);
  data.set('stem-student-v1','invalid');assert.throws(()=>loadStudent());
 }finally{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:original});}
});
test('cabinet labels are complete on all three languages',()=>{for(const l of ['ky','en'] as const)assert.deepEqual(Object.keys(cabinetText[l]),Object.keys(cabinetText.ru));});
