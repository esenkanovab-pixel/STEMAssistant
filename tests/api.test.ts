import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {POST} from '../app/api/quizzes/generate/route';
import {generateLocal} from '../lib/generator';
import {terms} from '../lib/data';
const payload={topic:'inertia',subject:'science',grade:'6',lang:'en',kinds:['choice','boolean','short'],count:3,material:''};
const req=(body:unknown=payload,origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/quizzes/generate',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('AI endpoint handles missing key, origin checks, invalid input and structured response',async()=>{
 const key=process.env.OPENAI_API_KEY;const originalFetch=globalThis.fetch;
 try{
  delete process.env.OPENAI_API_KEY;
  assert.equal((await POST(req())).status,503);
  assert.equal((await POST(req(payload,'https://other.example'))).status,403);
  process.env.OPENAI_API_KEY='test-placeholder';
  assert.equal((await POST(req({...payload,kinds:[]}))).status,400);
  const generated=generateLocal({...payload,lang:'en',kinds:['choice','boolean','short'],terms});
  globalThis.fetch=async(_url,options)=>{const body=JSON.parse(String(options?.body));assert.equal(body.text.format.type,'json_schema');assert.equal(body.store,false);assert.ok(!JSON.stringify(body).includes('test-placeholder'));return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({questions:generated.questions.map(({id,...q})=>q)})}]}]}),{status:200});};
  const response=await POST(req());assert.equal(response.status,200);assert.equal((await response.json()).questions.length,3);
  globalThis.fetch=async()=>new Response(JSON.stringify({output:[]}),{status:200});assert.equal((await POST(req())).status,502);
 }finally{globalThis.fetch=originalFetch;if(key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=key;}
});
