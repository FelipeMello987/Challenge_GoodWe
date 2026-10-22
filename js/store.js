const Store={
  ler(k,d){ try{ return JSON.parse(localStorage.getItem(k))??d; }catch(e){ return d; } },
  gravar(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const brlc=v=>Math.abs(v)>=1e6?'R$ '+(v/1e6).toFixed(2).replace('.',',')+' mi':brl(v);
