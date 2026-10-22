const Auth={
  cadastro:false,
  usuario:null,
  hash(s){ let h=5381; for(const c of s) h=((h<<5)+h+c.charCodeAt(0))|0; return String(h); },
  erro(t){ document.getElementById('login-error').innerText=t; },
  alternar(){
    this.cadastro=!this.cadastro;
    document.getElementById('a-nome').style.display=this.cadastro?'block':'none';
    document.getElementById('a-btn').innerText=this.cadastro?'Criar conta':'Entrar';
    document.getElementById('a-alt').innerText=this.cadastro?'Já tem conta? Entrar':'Não tem conta? Criar conta';
    this.erro('');
  },
  enviar(){
    const nome=document.getElementById('a-nome').value.trim();
    const email=document.getElementById('a-email').value.trim().toLowerCase();
    const senha=document.getElementById('a-pass').value;
    const users=Store.ler('ampera_users',{});
    if(!email||!senha) return this.erro('Preencha email e senha.');
    if(this.cadastro){
      if(!nome) return this.erro('Informe seu nome.');
      if(!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return this.erro('Informe um email válido, como nome@gmail.com.');
      if(senha.length<6) return this.erro('A senha precisa ter 6 caracteres ou mais.');
      if(users[email]) return this.erro('Este email já tem conta.');
      users[email]={nome,h:this.hash(senha)};
      Store.gravar('ampera_users',users);
    } else if(!users[email]||users[email].h!==this.hash(senha)){
      return this.erro('Email ou senha incorretos.');
    }
    this.entrar(email,users[email].nome);
  },
  entrar(email,nome){
    this.usuario={email,nome};
    Store.gravar('ampera_sessao',email);
    App.iniciar();
  },
  restaurar(){
    const email=Store.ler('ampera_sessao',null);
    const users=Store.ler('ampera_users',{});
    if(email&&users[email]) this.entrar(email,users[email].nome);
  },
  sair(){ localStorage.removeItem('ampera_sessao'); location.reload(); }
};
