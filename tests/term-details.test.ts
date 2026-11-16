import test from 'node:test';
import assert from 'node:assert/strict';
import {terms,initialState} from '../lib/data';
import {termDetails} from '../lib/term-details';
import {isState,validTermDetails} from '../lib/model';
test('every built-in term has localized simple explanations and concrete examples',()=>{
 for(const term of terms){const detail=termDetails[term.id];assert.ok(detail);for(const lang of ['ky','ru','en'] as const){assert.ok(detail.simple?.[lang]);assert.ok(detail.example?.[lang]);if(detail.formula)assert.ok(detail.formulaNote?.[lang]);}}
});
test('term details round-trip without breaking legacy lessons, and unsafe images are rejected',()=>{
 assert.ok(isState(initialState));
 const state={...initialState,termDetails:{inertia:{...termDetails.inertia,image:'data:image/jpeg;base64,YWJj',caption:'Bus'}}};
 assert.ok(isState(JSON.parse(JSON.stringify(state))));
 assert.equal(validTermDetails({image:'https://tracking.example/photo.jpg'}),false);
 assert.equal(validTermDetails({image:'data:image/svg+xml;base64,YWJj'}),false);
 assert.equal(validTermDetails({simple:{ru:'only'}}),false);
 assert.equal(isState({...initialState,customTerms:{}}),false);
 assert.equal(isState({...initialState,termDetails:{inertia:null}}),false);
});
