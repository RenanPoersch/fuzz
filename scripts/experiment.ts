import {writeFileSync} from 'node:fs';
import {SUMMARY} from '../src/app/fuzzy-engine.ts';
const file=process.argv[2]??'resultados-pertinencia.json';
writeFileSync(file,JSON.stringify(SUMMARY,null,2));
console.log(JSON.stringify({file,focus:SUMMARY.focusValues,cuts:SUMMARY.cuts}));
