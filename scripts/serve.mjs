import http from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist/browser');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer(async(req,res)=>{
  try{
    const requestPath=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    let filename=path.resolve(root,'.'+requestPath);
    if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    try{if((await stat(filename)).isDirectory())filename=path.join(filename,'index.html');}catch{filename=path.join(root,'index.html');}
    const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]??'application/octet-stream'});res.end(data);
  }catch{res.writeHead(404);res.end('Arquivo não encontrado.');}
}).listen(4200,'127.0.0.1',()=>console.log('Demonstração: http://127.0.0.1:4200/\nMantenha este terminal aberto. Ctrl+C para encerrar.'));
