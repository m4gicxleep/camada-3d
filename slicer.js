(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CamadaSlicer=factory();})(globalThis,function(){
  'use strict';
  const LIMIT=50*1024*1024;
  function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=c>>>1^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
  async function extract(bytes){
    if(bytes.length>LIMIT)throw new Error('Limite de leitura: 50 MB.');
    const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const check=(p,n)=>{if(p<0||p+n>bytes.length)throw new Error('Arquivo 3MF incompleto ou inválido.');};
    let end=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(v.getUint32(p,true)===0x06054b50&&p+22+v.getUint16(p+20,true)===bytes.length){end=p;break;}
    if(end<0)throw new Error('Não encontrei um 3MF válido. Exporte o arquivo já fatiado.');
    if(v.getUint16(end+4,true)||v.getUint16(end+6,true))throw new Error('Arquivo multipartes não suportado.');
    const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),offset=v.getUint32(end+16,true);check(offset,size);if(count>10000||offset+size>end)throw new Error('Diretório 3MF inválido.');
    let pos=offset;const found=[];
    for(let i=0;i<count;i++){
      check(pos,46);if(v.getUint32(pos,true)!==0x02014b50)throw new Error('Diretório 3MF inválido.');
      const flags=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),crc=v.getUint32(pos+16,true),packed=v.getUint32(pos+20,true),length=v.getUint32(pos+24,true),nameLen=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true),local=v.getUint32(pos+42,true);
      check(pos+46,nameLen+extra+comment);const name=new TextDecoder().decode(bytes.subarray(pos+46,pos+46+nameLen));
      if(/\.gcode$/i.test(name))found.push({flags,method,crc,packed,length,local});pos+=46+nameLen+extra+comment;
    }
    if(found.length!==1)throw new Error(found.length?'Há várias mesas neste arquivo. Exporte uma mesa por vez ou preencha os totais manualmente.':'Este 3MF não tem G-code. Exporte a mesa já fatiada no Bambu Studio / Orca.');
    const e=found[0];if((e.flags&1)||![0,8].includes(e.method)||e.length>LIMIT)throw new Error('Compressão não suportada, arquivo protegido ou G-code acima de 50 MB.');
    check(e.local,30);if(v.getUint32(e.local,true)!==0x04034b50)throw new Error('G-code interno inválido.');
    const start=e.local+30+v.getUint16(e.local+26,true)+v.getUint16(e.local+28,true);check(start,e.packed);if(start+e.packed>offset)throw new Error('G-code interno inválido.');
    const compressed=bytes.slice(start,start+e.packed);let out=compressed;
    if(e.method===8){
      let stream;try{stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch{throw new Error('Seu navegador não lê este 3MF. Use .gcode textual ou preencha peso e tempo.');}
      const reader=stream.getReader(),chunks=[];let total=0;
      try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>LIMIT||total>e.length){await reader.cancel();throw new Error('G-code descompactado ultrapassou o limite declarado.');}chunks.push(value);}}catch(err){throw new Error('Não foi possível descompactar o G-code: '+err.message);}
      out=new Uint8Array(total);let at=0;for(const c of chunks){out.set(c,at);at+=c.length;}
    }
    if(out.length!==e.length||crc32(out)!==e.crc)throw new Error('G-code corrompido: tamanho ou verificação de integridade não confere.');
    return new TextDecoder().decode(out);
  }
  async function read(file){if(file.size>LIMIT)throw new Error('Limite de leitura: 50 MB.');if(/\.gcode\.3mf$/i.test(file.name))return extract(new Uint8Array(await file.arrayBuffer()));if(/\.gcode$/i.test(file.name))return file.text();throw new Error('Use .gcode ou .gcode.3mf de uma mesa já fatiada.');}
  return {extract,read,crc32};
});
