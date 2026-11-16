import {NextRequest,NextResponse} from 'next/server';
import {classStore} from '../../../lib/class-store';
import {SessionError} from '../../../lib/session-store';
import {sameOrigin} from '../../../lib/session-request';
export const runtime='nodejs';export const dynamic='force-dynamic';
const response=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(e:unknown)=>response({error:e instanceof SessionError?e.code:'server'},e instanceof SessionError?e.status:500);
const code=(req:NextRequest)=>req.nextUrl.searchParams.get('code')?.trim().toUpperCase()??'';
export async function GET(req:NextRequest){try{return response(await classStore.get(code(req),req.headers.get('x-class-owner')??undefined));}catch(e){return fail(e);}}
export async function POST(req:NextRequest){try{if(!sameOrigin(req))throw new SessionError('forbidden',403);const raw=await req.text();if(raw.length>45000)throw new SessionError('invalid',413);let data;try{data=JSON.parse(raw);}catch{throw new SessionError('invalid',400);}if(!data||typeof data!=='object')throw new SessionError('invalid',400);const token=req.headers.get('x-class-owner')??'';switch(data.action){case 'create':return response(await classStore.create(data.name),201);case 'join':return response(await classStore.join(code(req),data.student));case 'assign':return response(await classStore.assign(code(req),token,data));case 'complete':return response(await classStore.complete(code(req),data.id,data.student));default:throw new SessionError('invalid',400);}}catch(e){return fail(e);}}
