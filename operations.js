(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./calculator.js'));else root.CamadaOps=factory(root.Camada);})(globalThis,function(C){
  'use strict';
  function text(v,label,max=160){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(label+' inválido.');return v.trim();}
  function num(v,label,min=0,max=1e9,integer=false){const n=C.number(v);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(label+' inválido.');return n;}
  function date(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v||v<'2000-01-01'||v>'2100-12-31')throw new Error('Data inválida.');return v;}
  function roll(raw){
    const r={id:text(raw.id,'Identificador'),name:text(raw.name,'Material / marca'),color:text(raw.color,'Cor'),price:num(raw.price,'Preço'),shipping:num(raw.shipping,'Frete'),discount:num(raw.discount,'Desconto'),spool:num(raw.spool,'Peso líquido',0.001),opening:num(raw.opening,'Saldo inicial'),date:date(raw.date),archived:raw.archived===true};
    if(r.discount>r.price+r.shipping||r.opening>r.spool)throw new Error('Confira desconto e saldo inicial do rolo.');
    return r;
  }
  function run(raw){
    const planned=C.restore(raw.planned),actual=C.restore(raw.actual);
    // Actual consumption includes all attempts. Reserves are budget provisions, not measured use.
    actual.reserve=0;actual.colorReserve=0;actual.selling=false;
    const result=C.calculate(actual);if(!result.ok)throw new Error('Custos realizados inválidos.');
    const r={id:text(raw.id,'Identificador'),saleId:raw.saleId===null?null:text(raw.saleId,'Venda'),name:text(raw.name,'Trabalho'),date:date(raw.date),planned,actual,good:num(raw.good,'Peças boas',0,100000,true),failed:num(raw.failed,'Tentativas com falha',0,100000,true),notes:typeof raw.notes==='string'?raw.notes.slice(0,2000):'',cancelled:raw.cancelled===true};
    if(!r.good&&!r.failed)throw new Error('Informe peças boas ou tentativas com falha.');
    if(r.good&&actual.quantity!==r.good)throw new Error('Quantidade realizada deve ser igual às peças boas.');
    return r;
  }
  function used(runs,id){return runs.filter(r=>!r.cancelled).reduce((s,r)=>s+r.actual.materials.filter(m=>m.rollId===id).reduce((n,m)=>n+Number(m.grams)+Number(m.waste||0),0),0);}
  function remaining(roll,runs){return roll.opening-used(runs,roll.id);}
  function value(roll,runs){return remaining(roll,runs)*(roll.price+roll.shipping-roll.discount)/roll.spool;}
  function validate(raw,sales=[]){
    if(!Array.isArray(raw.inventory)||raw.inventory.length>500||!Array.isArray(raw.runs)||raw.runs.length>5000)throw new Error('Estoque ou produção inválidos.');
    const inventory=raw.inventory.map(roll),runs=raw.runs.map(run);
    for(const list of [inventory,runs])if(new Set(list.map(x=>x.id)).size!==list.length)throw new Error('Identificadores repetidos no estoque ou produção.');
    const linked=runs.filter(r=>!r.cancelled&&r.saleId);if(new Set(linked.map(r=>r.saleId)).size!==linked.length)throw new Error('Esta venda já tem um fechamento. Edite o existente incluindo todas as tentativas.');
    for(const r of runs){
      if(r.saleId&&!sales.some(s=>s.id===r.saleId))throw new Error('Produção sem venda correspondente.');
      for(const m of r.actual.materials)if(m.rollId&&!inventory.some(x=>x.id===m.rollId))throw new Error('Rolo da produção não encontrado.');
    }
    for(const r of inventory)if(remaining(r,runs)<-1e-7)throw new Error('Estoque insuficiente: '+r.name+' · '+r.color+'. Confira todos os consumos, inclusive falhas.');
    return {inventory,runs};
  }
  function comparison(r){const planned=C.calculate(r.planned),actual=C.calculate(r.actual);return {planned,actual,delta:actual.total-planned.total,unit:r.good?actual.total/r.good:null};}
  return {roll,run,used,remaining,value,validate,comparison};
});
