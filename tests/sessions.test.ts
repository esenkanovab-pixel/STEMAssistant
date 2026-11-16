import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {NextRequest} from 'next/server';
import {Quiz} from '../lib/model';
import {createSessionStore,SessionError} from '../lib/session-store';
import {GET,POST} from '../app/api/sessions/route';
import {sessionText} from '../lib/session-i18n';
import {sameOrigin} from '../lib/session-request';
const quiz:Quiz={id:'quiz-1',title:'Инерция',topic:'Инерция',subject:'science',grade:'6',lang:'ru',source:'manual',createdAt:new Date().toISOString(),questions:[{id:'1',kind:'choice',prompt:'Выберите единицу силы',choices:['Ньютон','Джоуль'],answer:'Ньютон',explanation:'Сила измеряется в ньютонах.'},{id:'2',kind:'short',prompt:'Как называется сохранение скорости при нулевой равнодействующей?',choices:[],answer:'Инерция',explanation:'Инерция.'},{id:'3',kind:'boolean',prompt:'Энергия измеряется в джоулях?',choices:['Правда','Ложь'],answer:'Правда',explanation:'Джоуль — единица энергии.'}]};
const directory=()=>path.resolve(process.cwd(),'../../work','sessions-test-'+randomUUID());
test('sessions hide answers and ownership, preserve snapshot, and survive reloading the store',async()=>{
 const dir=directory(),store=createSessionStore(dir);const access=await store.create(quiz);assert.match(access.code,/^[A-Z2-9]{6}$/);quiz.title='Изменено';
 const publicGame=await store.get(access.code);assert.equal(publicGame.title,'Инерция');const raw=JSON.stringify(publicGame);assert.ok(!raw.includes('ownerToken'));assert.ok(!raw.includes('answer'));assert.ok(!raw.includes('explanation'));
 const restored=createSessionStore(dir);assert.deepEqual(await restored.get(access.code),publicGame);
 await assert.rejects(()=>store.results(access.code,'wrong'),(e:unknown)=>e instanceof SessionError&&e.status===403);
 assert.equal((await store.results(access.code,access.ownerToken)).results.length,0);
});
test('server grades answers, rejects invalid payloads, deduplicates retries and enforces closure',async()=>{
 const store=createSessionStore(directory()),a=await store.create(quiz),id=randomUUID();const answers={'1':'Ньютон','2':' ИНЕРЦИЯ ','3':'Ложь'};
 await assert.rejects(()=>store.submit(a.code,'Student',id,{'1':'Ньютон'}));
 await assert.rejects(()=>store.submit(a.code,'Student',id,{'1':'Bogus','2':'Инерция','3':'Правда'}));
 const done=await store.submit(a.code,'Student',id,answers);assert.equal(done.result.score,2);assert.equal(done.result.points,225);assert.equal(done.review[2].correct,false);
 const repeated=await store.submit(a.code,'Student',id,answers);assert.deepEqual(repeated,done);assert.equal((await store.results(a.code,a.ownerToken)).results.length,1);
 await assert.rejects(()=>store.submit(a.code,'Someone else',id,answers));
 await assert.rejects(()=>store.close(a.code,'wrong'));await store.close(a.code,a.ownerToken);
 assert.equal((await store.get(a.code)).open,false);await assert.rejects(()=>store.submit(a.code,'Student',randomUUID(),answers),(e:unknown)=>e instanceof SessionError&&e.code==='closed');
 assert.deepEqual(await store.submit(a.code,'Student',id,answers),done);
});
test('concurrent attempts are retained and session messages exist in all languages',async()=>{
 const store=createSessionStore(directory()),a=await store.create(quiz);await Promise.all(Array.from({length:5},(_,i)=>store.submit(a.code,'Student '+i,randomUUID(),{'1':'Ньютон','2':'Инерция','3':'Правда'})));
 assert.equal((await store.results(a.code,a.ownerToken)).results.length,5);
 for(const l of ['ky','en'] as const)assert.deepEqual(Object.keys(sessionText[l]),Object.keys(sessionText.ru));
});
test('session endpoint rejects cross-origin mutations and invalid codes',async()=>{
 assert.ok(sameOrigin(new Request('http://localhost:3000/api/sessions',{headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000'}})));
 assert.equal(sameOrigin(new Request('http://localhost:3000/api/sessions',{headers:{host:'127.0.0.1:3000',origin:'http://other.example'}})),false);
 const request=new NextRequest('http://localhost:3000/api/sessions',{method:'POST',headers:{origin:'https://other.example'},body:JSON.stringify({action:'create',quiz})});assert.equal((await POST(request)).status,403);
 assert.equal((await GET(new NextRequest('http://localhost:3000/api/sessions?code=../file'))).status,400);
 assert.equal((await POST(new NextRequest('http://localhost:3000/api/sessions',{method:'POST',headers:{origin:'http://localhost:3000'},body:'not-json'}))).status,400);
});
