import {test} from 'node:test';
import assert from 'node:assert/strict';
import {triangular,trapezoidal,gaussian,tall,membership,alphaCut,DEFINITIONS,SUMMARY,definitionsFor} from '../src/app/fuzzy-engine.ts';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-10,`${a} difere de ${b}`);
test('rampa para alto preserva saturação e produz o exemplo 1,78 m',()=>{assert.equal(tall(1.4),0);close(tall(1.6),0);close(tall(1.78),.6);close(tall(1.9),1);assert.equal(tall(2.1),1);});
test('triangular respeita suporte, pico e cálculo manual',()=>{for(const h of [1.4,1.55,1.95,2.1])close(membership('triangular',h),0);close(membership('triangular',1.75),1);close(membership('triangular',1.78),.85);close(membership('triangular',1.65),.5);});
test('trapezoidal preserva platô e equivalência com triangular',()=>{for(const h of [1.65,1.7,1.75,1.78,1.85])close(membership('trapezoidal',h),1);for(let n=140;n<=210;n++)close(trapezoidal(n/100,1.55,1.75,1.75,1.95),triangular(n/100,1.55,1.75,1.95));});
test('gaussiana respeita simetria, pico e valor a um sigma',()=>{close(gaussian(1.75,1.75,.1),1);close(gaussian(1.85,1.75,.1),Math.exp(-.5));for(let n=0;n<=30;n++)close(gaussian(1.75-n/100,1.75,.1),gaussian(1.75+n/100,1.75,.1));close(membership('gaussian',1.78),Math.exp(-.045));});
test('graus ficam em [0,1] e cortes alfa têm fronteiras corretas',()=>{for(const d of DEFINITIONS){for(let n=140;n<=210;n++){const v=membership(d.id,n/100);assert.ok(v>=0&&v<=1);}for(const a of [.1,.5,.9,1]){const [l,r]=alphaCut(d.id,a);close(membership(d.id,l),a);close(membership(d.id,r),a);for(let n=140;n<=210;n++){const h=n/100;assert.equal(membership(d.id,h)>=a-1e-12,h>=l-1e-12&&h<=r+1e-12);}}}close(SUMMARY.focus,1.78);close(SUMMARY.tallFocus,.6);});
test('parâmetros inválidos e valores não finitos são rejeitados',()=>{assert.throws(()=>triangular(1.7,1.55,1.55,1.95));assert.throws(()=>trapezoidal(1.7,1.55,1.85,1.65,1.95));assert.throws(()=>gaussian(1.7,1.75,0));assert.throws(()=>tall(NaN));assert.throws(()=>alphaCut('gaussian',0));});

test('baixa e alta têm saturação e monotonicidade em todas as formas',()=>{
  for(const set of ['short','tall'] as const){
    assert.equal(definitionsFor(set).length,3);
    for(const def of DEFINITIONS){
      close(membership(def.id,set==='short'?1.4:2.1,set),1);
      let previous=membership(def.id,1.4,set);
      for(let n=141;n<=210;n++){
        const value=membership(def.id,n/100,set);
        assert.ok(value>=0&&value<=1);
        assert.ok(set==='short'?value<=previous+1e-12:value>=previous-1e-12);
        previous=value;
      }
    }
  }
  close(membership('triangular',1.78,'tall'),.15);
  close(membership('trapezoidal',1.78,'tall'),.65);
  close(membership('gaussian',1.78,'tall'),Math.exp(-1.445));
  close(membership('triangular',1.78,'short'),0);
  close(membership('trapezoidal',1.78,'short'),.35);
});

test('cortes alfa de baixa e alta coincidem com a pertinência consultada',()=>{
  for(const set of ['short','tall'] as const){
    for(const def of DEFINITIONS){
      for(const alpha of [.1,.5,.9,1]){
        const [low,high]=alphaCut(def.id,alpha,set);
        const edge=Number.isFinite(low)?low:high;
        close(membership(def.id,edge,set),alpha);
        for(let n=140;n<=210;n++){
          const h=n/100;
          assert.equal(membership(def.id,h,set)>=alpha-1e-12,h>=low-1e-12&&h<=high+1e-12);
        }
      }
    }
  }
});
