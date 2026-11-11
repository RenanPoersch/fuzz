/** Funções de pertinência. Dados e parâmetros didáticos explícitos. */
export type Shape = 'triangular' | 'trapezoidal' | 'gaussian';
export type HeightSet = 'short' | 'medium' | 'tall';
export interface Definition { id:Shape;name:string;parameters:string;formula:string;description:string; }
export const SET_LABELS:Record<HeightSet,string>={short:'baixa',medium:'média',tall:'alta'};
/** Versões com ombro que saturam nas extremidades. A gaussiana com ombro
 * é uma adaptação por partes: uma cauda gaussiana conectada a um platô.
 */
export const SHOULDERS={
  short:{triangular:[1.55,1.75],trapezoidal:[1.65,1.85],center:1.55},
  tall:{triangular:[1.75,1.95],trapezoidal:[1.65,1.85],center:1.95}
} as const;
export const FOCUS=1.78;
export const UNIVERSE=[1.40,2.10] as const;
export const DEFINITIONS:Definition[]=[
  {id:'triangular',name:'Triangular',parameters:'a = 1,55 · b = 1,75 · c = 1,95 m',formula:'μ(h) = max(min((h−a)/(b−a), (c−h)/(c−b)), 0)',description:'A estatura média tem um único valor de adequação máxima: 1,75 m.'},
  {id:'trapezoidal',name:'Trapezoidal',parameters:'a = 1,55 · b = 1,65 · c = 1,85 · d = 1,95 m',formula:'μ(h) = max(min((h−a)/(b−a), 1, (d−h)/(d−c)), 0)',description:'Todas as alturas de 1,65 a 1,85 m recebem adequação máxima à descrição.'},
  {id:'gaussian',name:'Gaussiana',parameters:'c = 1,75 m · σ = 0,10 m',formula:'μ(h) = exp(−(h−c)² / (2σ²))',description:'A adequação é máxima em 1,75 m e diminui suavemente com o afastamento.'}
];
function finite(...values:number[]):void{if(!values.every(Number.isFinite))throw new Error('Use apenas números finitos.');}
export function triangular(x:number,a:number,b:number,c:number):number{
  finite(x,a,b,c);if(!(a<b&&b<c))throw new Error('A triangular exige a < b < c.');
  return Math.max(0,Math.min((x-a)/(b-a),(c-x)/(c-b)));
}
export function trapezoidal(x:number,a:number,b:number,c:number,d:number):number{
  finite(x,a,b,c,d);if(!(a<b&&b<=c&&c<d))throw new Error('A trapezoidal exige a < b ≤ c < d.');
  return Math.max(0,Math.min((x-a)/(b-a),1,(d-x)/(d-c)));
}
export function gaussian(x:number,center:number,sigma:number):number{
  finite(x,center,sigma);if(sigma<=0)throw new Error('A largura σ deve ser positiva.');
  return Math.exp(-((x-center)**2)/(2*sigma*sigma));
}
export function membership(shape:Shape,x:number,set:HeightSet='medium'):number{
  if(set!=='medium'){
    finite(x);
    const model=SHOULDERS[set];
    if(shape==='gaussian')return (set==='short'?x<=model.center:x>=model.center)?1:gaussian(x,model.center,.10);
    if(shape!=='triangular'&&shape!=='trapezoidal')throw new Error('Função desconhecida.');
    const [a,b]=model[shape];
    return Math.max(0,Math.min(1,set==='short'?(b-x)/(b-a):(x-a)/(b-a)));
  }
  switch(shape){case 'triangular':return triangular(x,1.55,1.75,1.95);case 'trapezoidal':return trapezoidal(x,1.55,1.65,1.85,1.95);case 'gaussian':return gaussian(x,1.75,.10);default:throw new Error('Função desconhecida.');}
}
const metres=(x:number)=>x.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
export function definitionsFor(set:HeightSet):Definition[]{
  if(set==='medium')return DEFINITIONS;
  const model=SHOULDERS[set],left=set==='short';
  return DEFINITIONS.map(def=>{
    if(def.id==='gaussian')return {
      id:def.id,name:'Gaussiana com ombro',parameters:`c = ${metres(model.center)} m · σ = 0,10 m`,
      formula:`μ(h) = 1 se h ${left?'≤':'≥'} c; exp(−(h−c)² / (2σ²)) caso contrário`,
      description:`A cauda gaussiana encontra um platô de grau 1 para alturas ${left?'até':'a partir de'} ${metres(model.center)} m.`
    };
    const [a,b]=model[def.id];
    return {
      id:def.id,name:def.name+' com ombro',parameters:`a = ${metres(a)} · b = ${metres(b)} m`,
      formula:`μ(h) = max(0, min(1, ${left?'(b−h)':'(h−a)'} / (b−a)))`,
      description:`Rampa ${left?'decrescente':'crescente'}, com grau 1 ${left?'até '+metres(a):'a partir de '+metres(b)} m.`
    };
  });
}
/** Exemplo didático inspirado na pergunta de Russell sobre uma pessoa de 1,78 m.
 * Os limites 1,60/1,90 e o grau calculado não são fornecidos pelo livro.
 */
export function tall(height:number):number{finite(height);return Math.max(0,Math.min(1,(height-1.60)/.30));}
/** Corte alfa fechado, na reta real, para as funções definidas acima. */
export function alphaCut(shape:Shape,alpha:number,set:HeightSet='medium'):[number,number]{
  if(!Number.isFinite(alpha)||alpha<=0||alpha>1)throw new Error('Use 0 < α ≤ 1.');
  if(set!=='medium'){
    const model=SHOULDERS[set],left=set==='short';
    let edge:number;
    if(shape==='gaussian'){
      const radius=.10*Math.sqrt(-2*Math.log(alpha));
      edge=model.center+(left?radius:-radius);
    }else if(shape==='triangular'||shape==='trapezoidal'){
      const [a,b]=model[shape];edge=left?b-(b-a)*alpha:a+(b-a)*alpha;
    }else throw new Error('Função desconhecida.');
    return left?[-Infinity,edge]:[edge,Infinity];
  }
  if(shape==='triangular')return [1.55+.20*alpha,1.95-.20*alpha];
  if(shape==='trapezoidal')return [1.55+.10*alpha,1.95-.10*alpha];
  if(shape==='gaussian'){const radius=.10*Math.sqrt(-2*Math.log(alpha));return [1.75-radius,1.75+radius];}
  throw new Error('Função desconhecida.');
}
export const SUMMARY={
  concept:'Estatura média',universe:UNIVERSE,focus:FOCUS,tallFocus:tall(FOCUS),
  definitions:DEFINITIONS,
  focusValues:DEFINITIONS.map(d=>({shape:d.id,value:membership(d.id,FOCUS)})),
  alpha:.5,cuts:DEFINITIONS.map(d=>({shape:d.id,interval:alphaCut(d.id,.5)}))
};
