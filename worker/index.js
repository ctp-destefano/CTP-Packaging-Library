// CTP Packaging Library temporary demo bridge.
// WARNING: No user authentication. Anyone who reaches this Worker can alter demo assets.
// Do not put confidential materials in the demo. Disable Worker when presentation ends.
const REPO = "ctp-destefano/CTP-Packaging-Library";
const ORIGIN = "https://ctp-destefano.github.io";
const VERSION = "2026-11-23";
const MAX_JSON = 28_000_000;
function response(value, status=200) {
  return new Response(JSON.stringify(value), {
    status, headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
      "Vary": "Origin"
    }
  });
}
function allowed(path) {
  return path === "docs/data/projects.json" ||
    /^docs\/boxes\/[A-Za-z0-9_-]{2,32}\/index\.html$/.test(path) ||
    /^docs\/assets\/[A-Za-z0-9_-]{2,32}\/[A-Za-z0-9_-]{1,80}\/[A-Za-z0-9._-]{1,180}$/.test(path);
}
export default {
  async fetch(request, env) {
    const u = new URL(request.url);
    const origin = request.headers.get("Origin");
    if (origin !== ORIGIN && request.method !== "GET") return response({error:"Origin not allowed"},403);
    if (request.method==="OPTIONS") {
      return new Response(null,{status:204,headers:{
        "Access-Control-Allow-Origin":ORIGIN,
        "Access-Control-Allow-Methods":"POST, OPTIONS",
        "Access-Control-Allow-Headers":"Content-Type"
      }});
    }
    if (request.method==="GET" && u.pathname==="/health") {
      return response({ok:true,version:VERSION,configured:Boolean(env.GITHUB_TOKEN)});
    }
    if (request.method!=="POST"||u.pathname!=="/publish") return response({error:"Not found"},404);
    if (!env.GITHUB_TOKEN) return response({error:"Publishing secret not configured"},503);
    if (Number(request.headers.get("Content-Length"))>MAX_JSON) return response({error:"Upload too large"},413);
    let body;
    try { body=await request.json(); } catch { return response({error:"Invalid JSON"},400); }
    const {path,content,message}=body||{};
    if (typeof path!=="string" || !allowed(path) ||
        typeof content!=="string" || content.length>MAX_JSON ||
        !/^[A-Za-z0-9+/=\r\n]+$/.test(content) ||
        typeof message!=="string" || message.length>180) {
      return response({error:"Invalid file or request"},400);
    }
    const github="https://api.github.com/repos/"+REPO+"/contents/"+path.split("/").map(encodeURIComponent).join("/");
    const headers={
      "Authorization":"Bearer "+env.GITHUB_TOKEN,
      "Accept":"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28",
      "User-Agent":"CTP-Packaging-Library-Demo"
    };
    try {
      const current=await fetch(github,{headers});
      let sha;
      if(current.status===200) sha=(await current.json()).sha;
      else if(current.status!==404) return response({error:"Unable to read GitHub file",status:current.status},502);
      const out=await fetch(github,{
        method:"PUT",
        headers:{...headers,"Content-Type":"application/json"},
        body:JSON.stringify({message,content,branch:"main",...(sha?{sha}:{})})
      });
      if(!out.ok) return response({error:"GitHub rejected publication",status:out.status,detail:(await out.text()).slice(0,220)},502);
      return response({ok:true,commit:(await out.json()).commit?.sha||null});
    } catch(e) { return response({error:"Publication failed",detail:String(e).slice(0,140)},502); }
  }
};
