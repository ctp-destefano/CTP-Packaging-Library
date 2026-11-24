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
// Atomically remove a project's record, public route, and every file in its asset directory.
// A single Git commit prevents a partially deleted project from being published.
async function deleteProject(id, env) {
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(id)) return response({error:"Invalid project ID"},400);
  const api="https://api.github.com/repos/"+REPO;
  const headers={
    "Authorization":"Bearer "+env.GITHUB_TOKEN,
    "Accept":"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28",
    "User-Agent":"CTP-Packaging-Library-Demo"
  };
  async function github(url, options={}) {
    const res=await fetch(url,{...options,headers:{...headers,...(options.headers||{})}});
    if(!res.ok) throw Error("GitHub "+res.status+": "+(await res.text()).slice(0,250));
    return res.json();
  }
  try {
    const branch=await github(api+"/git/ref/heads/main");
    const commitSha=branch.object.sha;
    const commit=await github(api+"/git/commits/"+commitSha);
    const tree=await github(api+"/git/trees/"+commit.tree.sha+"?recursive=1");
    if(tree.truncated) return response({error:"Repository tree too large to verify complete deletion; no changes were made"},409);
    const files=tree.tree.filter(t=>t.type==="blob");
    const recordPath="docs/data/projects.json";
    if(!files.some(t=>t.path===recordPath)) return response({error:"Project database is missing"},502);
    const dataFile=await github(api+"/contents/"+recordPath+"?ref=main");
    const raw=Uint8Array.from(atob(dataFile.content.replace(/\\s/g,"")),c=>c.charCodeAt(0));
    const data=JSON.parse(new TextDecoder().decode(raw));
    if(!Array.isArray(data.projects))return response({error:"Invalid project database"},502);
    const project=data.projects.find(p=>p.id===id);
    if(!project)return response({error:"Project not found; nothing deleted"},404);
    const next={...data,projects:data.projects.filter(p=>p.id!==id)};
    const folder="docs/assets/"+id+"/";
    const route="docs/boxes/"+id+"/";
    const targets=files.filter(t=>t.path.startsWith(folder)||t.path.startsWith(route));
    if(targets.length>1500)return response({error:"Too many files for demo deletion; no changes were made"},409);
    const changes=targets.map(t=>({path:t.path,mode:"100644",type:"blob",sha:null}));
    changes.push({path:recordPath,mode:"100644",type:"blob",content:JSON.stringify(next,null,2)+"\\n"});
    const newTree=await github(api+"/git/trees",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({base_tree:commit.tree.sha,tree:changes})
    });
    const newCommit=await github(api+"/git/commits",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:"Delete packaging project "+id+" and all related files",tree:newTree.sha,parents:[commitSha]})
    });
    // Non-force update fails instead of overwriting concurrent changes.
    await github(api+"/git/refs/heads/main",{
      method:"PATCH",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({sha:newCommit.sha,force:false})
    });
    return response({ok:true,id,deletedFiles:targets.length,commit:newCommit.sha});
  } catch(e) {return response({error:"Project deletion failed; retry without refreshing if necessary",detail:String(e).slice(0,300)},502)}
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
    if (request.method!=="POST"||!["/publish","/delete-project"].includes(u.pathname)) return response({error:"Not found"},404);
    if (!env.GITHUB_TOKEN) return response({error:"Publishing secret not configured"},503);
    if (u.pathname==="/delete-project") {
      let input;try{input=await request.json()}catch{return response({error:"Invalid JSON"},400)}
      return deleteProject(input?.id,env);
    }
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
