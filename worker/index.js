// CTP Packaging Library — temporary demo publishing bridge.
// Public write access: anyone who knows this endpoint can modify the demo library.
// Never use for confidential or production content. Disable when demo ends.
const REPO = 'ctp-destefano/CTP-Packaging-Library';
const BRANCH = 'main';
const ALLOWED_ORIGIN = 'https://ctp-destefano.github.io';
const MAX_BODY = 28 * 1024 * 1024;
function reply(body,status=200,origin=ALLOWED_ORIGIN){
  return new Response(JSON.stringify(body),{status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin':origin,
    'Vary':'Origin',
    'Cache-Control':'no-store',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  }});
}
function permitted(path){
  if(path==='docs/data/projects.json')return true;
  if(/^docs\/boxes\/[A-Za-z0-9_-]{2,32}\/index\.html$/.test(path))return true;
  if(/^docs\/assets\/[A-Za-z0-9_-]{2,32}\/[A-Za-z0-9_-]{2,70}\/[A-Za-z0-9._-]{1,130}$/.test(path))return true;
  return false;
}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin');
    if(origin && origin!==ALLOWED_ORIGIN)return reply({error:'Origin not allowed'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{
      'Access-Control-Allow-Origin':ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'600'
    }});
    const url=new URL(request.url);
    if(request.method==='GET'&&url.pathname==='/health')return reply({ok:true,service:'CTP demo publishing',configured:!!env.GITHUB_TOKEN});
    if(request.method!=='POST'||url.pathname!=='/publish')return reply({error:'Not found'},404);
    if(!env.GITHUB_TOKEN)return reply({error:'Worker secret GITHUB_TOKEN is not configured'},503);
    if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)return reply({error:'File too large'},413);
    let body;
    try{body=await request.json()}catch{return reply({error:'Invalid JSON'},400)}
    const {path,content,message}=body||{};
    if(typeof path!=='string'||!permitted(path)||typeof content!=='string'||content.length>MAX_BODY||
       !/^[A-Za-z0-9+/=\r\n]+$/.test(content)||typeof message!=='string'||message.length>160){
      return reply({error:'Invalid publish request or path'},400);
    }
    const github='https://api.github.com/repos/'+REPO+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
    const headers={
      'Authorization':'Bearer '+env.GITHUB_TOKEN,
      'Accept':'application/vnd.github+json',
      'Content-Type':'application/json',
      'User-Agent':'CTP-Packaging-Library-Demo-Worker',
      'X-GitHub-Api-Version':'2022-11-28'
    };
    try{
      const current=await fetch(github,{headers,cache:'no-store'});
      let sha;
      if(current.status===200){const info=await current.json();sha=info.sha}
      else if(current.status!==404){return reply({error:'GitHub read failed',status:current.status},502)}
      const result=await fetch(github,{method:'PUT',headers,body:JSON.stringify({
        message,content,branch:BRANCH,...(sha?{sha}:{})
      })});
      if(!result.ok){
        const detail=(await result.text()).slice(0,300);
        return reply({error:'GitHub publishing failed',status:result.status,detail},502);
      }
      const info=await result.json();
      return reply({ok:true,path,commit:info.commit?.sha||null});
    }catch(e){return reply({error:'Backend request failed',detail:String(e).slice(0,180)},502)}
  }
};
