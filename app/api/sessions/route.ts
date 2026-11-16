import {NextRequest,NextResponse} from 'next/server';
import {SessionError,sessionStore,validateQuiz} from '../../../lib/session-store';
import {sameOrigin} from '../../../lib/session-request';
export const runtime='nodejs';export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const limits=new Map<string,{count:number;until:number}>();
function guard(req:NextRequest){if(!sameOrigin(req))throw new SessionError('forbidden',403);const key=req.headers.get('x-forwarded-for')??'local';const now=Date.now();const bucket=limits.get(key);if(bucket&&bucket.until>now){if(bucket.count>=60)throw new SessionError('limit',429);bucket.count++;}else{for(const [k,b] of limits)if(b.until<=now)limits.delete(k);limits.set(key,{count:1,until:now+60000});}}
function fail(e:unknown){if(e instanceof SessionError)return response({error:e.code},e.status);return response({error:'server'},500);}
function code(req:NextRequest){const value=req.nextUrl.searchParams.get('code')?.trim().toUpperCase()??'';if(!/^[A-Z2-9]{6}$/.test(value))throw new SessionError('invalid',400);return value;}
async function body(req:NextRequest){const raw=await req.text();if(raw.length>45000)throw new SessionError('invalid',413);try{return JSON.parse(raw);}catch{throw new SessionError('invalid',400);}}
export async function GET(req:NextRequest){try{const token=req.headers.get('x-session-owner');return response(token?await sessionStore.results(code(req),token):await sessionStore.get(code(req)));}catch(e){return fail(e);}}
export async function POST(req:NextRequest){try{guard(req);const data=await body(req);if(!data||typeof data!=='object')throw new SessionError('invalid',400);if(data.action==='create'){if(!validateQuiz(data.quiz))throw new SessionError('invalid',400);return response(await sessionStore.create(data.quiz),201);}if(data.action==='submit'){if(typeof data.student!=='string'||typeof data.attemptId!=='string')throw new SessionError('invalid',400);return response(await sessionStore.submit(code(req),data.student,data.attemptId,data.answers));}throw new SessionError('invalid',400);}catch(e){return fail(e);}}
export async function PATCH(req:NextRequest){try{guard(req);const token=req.headers.get('x-session-owner')??'';return response(await sessionStore.close(code(req),token));}catch(e){return fail(e);}}
