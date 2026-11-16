import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {initialState} from './data';
import {isState, Lesson, Quiz, Result, State, Term} from './model';
const KEY='stem-assistant-v1';
export const cloudConfigured=!!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
type StoredRow={id:string;user_id:string;payload:Lesson|Result|Quiz|Term;created_at:string};
type StoredTable={Row:StoredRow;Insert:Omit<StoredRow,'created_at'>;Update:Partial<StoredRow>;Relationships:[]};
type Database={public:{Tables:{lessons:StoredTable;results:StoredTable;quizzes:StoredTable;terms:StoredTable};Views:Record<string,never>;Functions:Record<string,never>}};
let client:SupabaseClient<Database>|null=null;
export function getClient(){if(!cloudConfigured)throw new Error('Not configured');return client??(client=createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));}
export function loadLocal():State {const raw=localStorage.getItem(KEY);if(!raw)return initialState; const parsed:unknown=JSON.parse(raw);if(!isState(parsed))throw new Error('Invalid saved data');return parsed;}
export function saveLocal(state:State) {localStorage.setItem(KEY,JSON.stringify(state));}
export async function loadCloud():Promise<State>{const db=getClient();const {data:auth}=await db.auth.getUser();if(!auth.user)throw new Error('Sign in required');const responses=await Promise.all((['lessons','results','quizzes','terms'] as const).map(table=>db.from(table).select('payload').order('created_at',{ascending:false})));for(const response of responses)if(response.error)throw response.error;const [lessons,results,quizzes,customTerms]=responses.map(response=>response.data!.map(row=>row.payload));const state={lessons,results,quizzes,customTerms};if(!isState(state))throw new Error('Invalid cloud data');return state;}
export async function saveCloud(kind:'lessons'|'results'|'quizzes'|'terms', item:Lesson|Result|Quiz|Term){const db=getClient();const {data:auth}=await db.auth.getUser();if(!auth.user)throw new Error('Sign in required');const {error}=await db.from(kind).upsert({id:item.id,user_id:auth.user.id,payload:item});if(error)throw error;}
