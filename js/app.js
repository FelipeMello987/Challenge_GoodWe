const CUSTO_KWH=0.70;
const LIMITE_IA=0.9;
const CICLO_MS=1000;
const CONSUMO_MEDIA=0.65;
const CONSUMO_DESVIO=0.10;
const CONSUMO_MIN=0.2;
const CONSUMO_MAX=1;
const gauss=()=>{let s=0;for(let i=0;i<6;i++)s+=Math.random();return (s-3)*Math.SQRT2;};
let pressionado=false;
const METODOS=['Pix','Cartão','QR Code','App'];

const App={
  D:null,
  timer:null,

  iniciar(){
    this.D=Store.ler('ampera_dados_'+Auth.usuario.email,{chargers:[],nextId:1,transacoes:[],hist:[],feed:[],alerta:null});
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';
    document.getElementById('user-nome').innerText=Auth.usuario.nome;
    UI.navegar('dashboard');
    clearInterval(this.timer);
    this.timer=setInterval(()=>this.ciclo(),CICLO_MS);
  },

  usoGlobal(){
    const ch=this.D.chargers, cap=ch.reduce((s,c)=>s+c.potencia,0);
    return cap?ch.reduce((s,c)=>s+c.pot,0)/cap*100:0;
  },

  salvar(){ Store.gravar('ampera_dados_'+Auth.usuario.email,this.D); },

  ciclo(){
    const D=this.D, ativos=D.chargers.filter(c=>c.status);
    D.chargers.forEach(c=>{
      if(!c.status){ c.pot=0; return; }
      c.pot=c.potencia*Math.min(CONSUMO_MAX,Math.max(CONSUMO_MIN,CONSUMO_MEDIA+gauss()*CONSUMO_DESVIO));
    });
    IA.analisar(D);

    const t=IA.tarifa(this.usoGlobal());
    this.n=(this.n||0)+1;
    if(this.n%4===0) IA.insights(D,this.usoGlobal(),t);
    ativos.forEach(c=>{
      if(Math.random()<CICLO_MS/10000){
        const kwh=5+Math.random()*20, valor=kwh*t.valor;
        c.kwh+=kwh; c.receita+=valor; c.gasto+=kwh*CUSTO_KWH;
        D.transacoes.unshift({id:c.id,idLabel:c.idLabel,kwh,valor,time:new Date().toLocaleTimeString('pt-BR'),metodo:METODOS[Math.floor(Math.random()*METODOS.length)]});
      }
    });
    if(D.transacoes.length>40) D.transacoes.length=40;

    const h={};
    D.chargers.forEach(c=>h[c.id]=c.pot);
    D.hist.push(h);
    if(D.hist.length>60000/CICLO_MS) D.hist.shift();

    this.salvar();
    if(!pressionado) UI.render();
  }
};

setInterval(()=>{
  document.getElementById('clock').innerText=new Date().toLocaleString('pt-BR');
},1000);

document.addEventListener('mousedown',()=>pressionado=true);
document.addEventListener('mouseup',()=>pressionado=false);

Auth.restaurar();
