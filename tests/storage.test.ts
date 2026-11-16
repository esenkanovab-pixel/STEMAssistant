import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadLocal,saveLocal} from '../lib/storage';
test('demo storage survives reload and rejects malformed records',()=>{
 const entries=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>entries.set(key,value)}});
 assert.deepEqual(loadLocal(),{lessons:[],results:[]});
 const state={lessons:[{id:'lesson-1',title:'Paper bridge',subject:'engineering',grade:'6',objective:'Compare strength',activities:'Build, load, record',termIds:['prototype'],createdAt:'2026-10-08T00:00:00Z'}],results:[{id:'attempt-1',student:'Demo',quizId:'stem-foundations',score:3,total:4,date:'2026-10-08T00:00:00Z'}]};
 saveLocal(state);
 assert.deepEqual(loadLocal(),state);
 entries.set('stem-assistant-v1','{"lessons":null}');
 assert.throws(()=>loadLocal(),/Invalid saved data/);
 entries.set('stem-assistant-v1','broken json');
 assert.throws(()=>loadLocal());
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>{throw new Error('denied');},setItem:()=>{throw new Error('full');}}});
 assert.throws(()=>loadLocal(),/denied/);
 assert.throws(()=>saveLocal(state),/full/);
});
