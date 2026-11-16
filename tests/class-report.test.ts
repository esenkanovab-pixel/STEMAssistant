import test from 'node:test';
import assert from 'node:assert/strict';
import {classReport,reportCSV,ReportClass} from '../lib/class-report';
test('class report uses latest attempt, excludes outsiders and distinguishes overdue from completed',()=>{
 const c:ReportClass={code:'ABC234',name:'Class',members:['A','B'],assignments:[{id:'l',title:'Lesson',kind:'lesson',due:'2020-01-01',completed:['A']},{id:'q',title:'Quiz',kind:'quiz',due:'2099-01-01',results:[{id:'1',student:'A',quizId:'q',score:1,total:2,date:'2026-01-01'},{id:'2',student:'A',quizId:'q',score:2,total:2,date:'2026-02-01'},{id:'3',student:'Other',quizId:'q',score:0,total:2,date:'2026-03-01'}]}]};
 const r=classReport(c,Date.parse('2026-03-01'));assert.equal(r.total,4);assert.equal(r.completed,2);assert.equal(r.overdue,1);assert.equal(r.average,100);assert.equal(r.rows[1].result?.id,'2');assert.equal(classReport({...c,members:[]}).average,null);
});
test('CSV preserves Cyrillic, quotes and newlines and prevents spreadsheet formulas',()=>{
 const csv=reportCSV([['Ученик','"Тема"','a\nb','=CMD()','  +SUM(1)','@test']]);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('""Тема""'));assert.ok(csv.includes("'  +SUM(1)"));assert.ok(csv.includes("'=CMD()"));
});
