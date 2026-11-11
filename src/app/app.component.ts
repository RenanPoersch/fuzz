import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FOCUS, UNIVERSE, SET_LABELS, SHOULDERS, membership, tall, definitionsFor } from './fuzzy-engine';
import type { Shape, HeightSet } from './fuzzy-engine';

@Component({
  selector:'app-root',standalone:true,
  imports:[DecimalPipe,FormsModule,MatCardModule,MatExpansionModule,MatSliderModule,MatButtonToggleModule],
  templateUrl:'./app.component.html'
})
export class AppComponent {
  height=FOCUS;
  selectedSet:HeightSet='medium';
  get setLabel(){return SET_LABELS[this.selectedSet];}
  get definitions(){return definitionsFor(this.selectedSet);}
  value(shape:Shape,x=this.height){return membership(shape,x,this.selectedSet);}
  get tallFocus(){return tall(this.height);}
  get markerX(){return this.mapX(this.height);}
  private decimal(value:number,digits=2){
    return value.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  }
  formatDegree(value:number){return value>0&&value<.0005?'< 0,001':this.decimal(value,3);}
  private centimetres(value:number){return this.decimal(Math.abs(value)*100,0);}
  get reading(){
    const h=this.height,label=this.decimal(h),set=this.setLabel;
    const results=this.definitions.map(d=>({...d,value:this.value(d.id)}));
    const full=results.filter(d=>d.value>=1-1e-10);
    if(full.length===3){
      if(this.selectedSet==='medium')return {
        title:`As três funções consideram uma pessoa de ${label} m plenamente compatível com “estatura média”.`,
        explanation:'A medida coincide com a referência central de 1,75 m da triangular e da gaussiana, e também está na faixa de 1,65 a 1,85 m aceita integralmente pela trapezoidal. Por isso, todas atribuem grau 1, mesmo usando formas diferentes.'
      };
      const tallSet=this.selectedSet==='tall';
      const edge=tallSet?1.95:1.55;
      return {
        title:`As três funções consideram uma pessoa de ${label} m plenamente ${set}.`,
        explanation:`Todas atribuem grau 1 ao pertencimento a “${set}”. A partir de ${this.decimal(edge)} m${tallSet?' para cima':' para baixo'}, as três definições já atingem esse grau máximo.`+
          (Math.abs(h-edge)>1e-10?` Assim, ${label} m e ${this.decimal(edge)} m recebem o mesmo grau, embora a pessoa de ${label} m seja ${this.centimetres(h-edge)} cm ${tallSet?'mais alta':'mais baixa'}. O grau informa que a descrição já é plenamente satisfeita; a diferença de altura continua existindo.`:' A altura selecionada está justamente no ponto em que as três passam a concordar no grau máximo.')
      };
    }
    if(full.length===1){
      const winner=full[0];
      const others=results.filter(d=>d.id!==winner.id);
      return {
        title:`Somente a ${winner.id==='trapezoidal'?'trapezoidal':winner.name.toLowerCase()} considera uma pessoa de ${label} m plenamente ${set}.`,
        explanation:`Nessa função, a altura já pertence à faixa de grau 1. A ${others[0].name.toLowerCase()} atribui ${this.formatDegree(others[0].value)} e a ${others[1].name.toLowerCase()} atribui ${this.formatDegree(others[1].value)}. As três avaliam a mesma pessoa, mas as duas últimas ainda indicam pertencimento parcial a “${set}”. A diferença vem dos limites e da forma adotados por cada definição.`
      };
    }
    const linearZero=results.filter(d=>d.id!=='gaussian').every(d=>d.value===0);
    if(linearZero)return {
      title:`A triangular e a trapezoidal não incluem ${label} m no conjunto “${set}”.`,
      explanation:`As duas atribuem grau 0 porque a medida está fora da região aceita por suas definições. A gaussiana ainda atribui ${this.formatDegree(this.value('gaussian'))}: sua cauda diminui gradualmente e permanece positiva. Portanto, o resultado gaussiano residual não equivale à aceitação plena da descrição.`
    };
    const ordered=[...results].sort((a,b)=>b.value-a.value);
    const top=ordered[0];
    return {
      title:`Uma pessoa de ${label} m tem pertencimento parcial a “${set}”, com maior grau na ${top.name.toLowerCase()}.`,
      explanation:`Nenhuma função considera essa altura plenamente ${set}. A ${top.name.toLowerCase()} atribui ${this.formatDegree(top.value)}, enquanto a ${ordered[1].name.toLowerCase()} atribui ${this.formatDegree(ordered[1].value)} e a ${ordered[2].name.toLowerCase()} atribui ${this.formatDegree(ordered[2].value)}. A comparação mostra quanto cada definição aceita essa mesma altura como “${set}”.`
    };
  }
  get tallCalculation(){return `(${this.decimal(this.height)} − 1,60) / 0,30`;}
  calculation(shape:Shape){
    const h=this.height,label=this.decimal(h);
    if(this.selectedSet!=='medium'){
      const model=SHOULDERS[this.selectedSet],left=this.selectedSet==='short';
      if(shape==='gaussian')return (left?h<=model.center:h>=model.center)
        ?`h ${left?'≤':'≥'} ${this.decimal(model.center)} m: grau 1`
        :`exp(−(${label} − ${this.decimal(model.center)})² / (2 × 0,10²))`;
      const [a,b]=model[shape];
      if(h<=a)return `h ≤ ${this.decimal(a)} m: grau ${left?'1':'0'}`;
      if(h>=b)return `h ≥ ${this.decimal(b)} m: grau ${left?'0':'1'}`;
      return `${left?'('+this.decimal(b)+' − '+label+')':'('+label+' − '+this.decimal(a)+')'} / ${this.decimal(b-a)}`;
    }
    if(shape==='gaussian')return `exp(−(${label} − 1,75)² / (2 × 0,10²))`;
    if(h<=1.55||h>=1.95)return 'Nos pés ou fora do suporte: grau 0';
    if(shape==='triangular')return h<=1.75?`(${label} − 1,55) / 0,20`:`(1,95 − ${label}) / 0,20`;
    if(h<1.65)return `(${label} − 1,55) / 0,10`;
    if(h<=1.85)return `${label} está no platô [1,65; 1,85]`;
    return `(1,95 − ${label}) / 0,10`;
  }
  interpretation(shape:Shape){
    const h=this.height,label=this.decimal(h),value=this.value(shape);
    const meaning=value>=1-1e-10
      ?`Uma pessoa de ${label} m satisfaz plenamente a descrição “${this.setLabel}” nesta função.`
      :value===0
        ?`Uma pessoa de ${label} m não pertence ao conjunto “${this.setLabel}” nesta função.`
        :`Uma pessoa de ${label} m recebe grau ${this.formatDegree(value)} de pertencimento a “${this.setLabel}” nesta função.`;
    if(this.selectedSet!=='medium'){
      const model=SHOULDERS[this.selectedSet],left=this.selectedSet==='short';
      if(shape==='gaussian'){
        if(left?h<=model.center:h>=model.center)return `${meaning} O grau máximo começa em ${this.decimal(model.center)} m${left?' para baixo':' para cima'}; a medida selecionada está ${this.centimetres(h-model.center)} cm ${left?'abaixo':'acima'} desse marco.`;
        return `${meaning} A medida está ${this.centimetres(h-model.center)} cm ${left?'acima':'abaixo'} de ${this.decimal(model.center)} m, onde começaria o pertencimento pleno. A distância em relação a esse marco, com largura de 10 cm, explica o grau calculado.`;
      }
      const [a,b]=model[shape];
      if(h<=a)return left
        ?`${meaning} A definição aceita integralmente alturas até ${this.decimal(a)} m, e ${label} m está ${this.centimetres(a-h)} cm abaixo desse limite.`
        :`${meaning} O pertencimento só começa a crescer acima de ${this.decimal(a)} m; faltam ${this.centimetres(a-h)} cm para alcançar esse limite.`;
      if(h>=b)return left
        ?`${meaning} Em ${this.decimal(b)} m o pertencimento a “baixa” já chega a zero. A medida selecionada está ${this.centimetres(h-b)} cm acima desse limite.`
        :`${meaning} O grau máximo começa em ${this.decimal(b)} m; ${label} m está ${this.centimetres(h-b)} cm acima desse limite. Esses centímetros extras aumentam a altura, mas o pertencimento já atingiu 1.`;
      return left
        ?`${meaning} Faltam ${this.centimetres(b-h)} cm para atingir ${this.decimal(b)} m, onde o pertencimento zera. Essa distância corresponde a ${this.centimetres(b-h)} dos ${this.centimetres(b-a)} cm da transição, resultando no grau ${this.formatDegree(value)}.`
        :`${meaning} A medida avançou ${this.centimetres(h-a)} dos ${this.centimetres(b-a)} cm entre ${this.decimal(a)} m e ${this.decimal(b)} m. Por isso, ainda não atende integralmente à descrição “alta”.`;
    }
    if(shape==='gaussian'){
      if(Math.abs(h-1.75)<1e-10)return `${meaning} Sua medida coincide com 1,75 m, a referência central de estatura média adotada por essa definição.`;
      return `${meaning} A medida está ${this.centimetres(h-1.75)} cm ${h<1.75?'abaixo':'acima'} da referência de 1,75 m. Quanto maior esse afastamento em relação à largura de 10 cm, menor a compatibilidade com “média”.`;
    }
    if(h<=1.55||h>=1.95){
      const edge=h<=1.55?1.55:1.95;
      return `${meaning} A região com grau positivo vai de 1,55 a 1,95 m, sem incluir os extremos. A medida está ${this.centimetres(h-edge)} cm ${h<=1.55?'abaixo':'acima'} do limite de ${this.decimal(edge)} m.`;
    }
    if(shape==='triangular'){
      if(Math.abs(h-1.75)<1e-10)return `${meaning} Sua medida coincide com 1,75 m, a única altura que essa triangular considera plenamente média.`;
      return `${meaning} A medida se afasta ${this.centimetres(h-1.75)} cm da referência de 1,75 m. A triangular perde todo o pertencimento ao se afastar 20 cm dessa referência; nessa posição, o grau restante é ${this.formatDegree(value)}.`;
    }
    if(h>=1.65&&h<=1.85)return `${meaning} A definição aceita integralmente todas as alturas de 1,65 a 1,85 m, e ${label} m está dentro dessa faixa.`;
    const edge=h<1.65?1.65:1.85;
    return `${meaning} A medida está ${this.centimetres(h-edge)} cm ${h<edge?'abaixo':'acima'} da faixa de aceitação plena, de 1,65 a 1,85 m. Nessa transição de 10 cm até o grau zero, o pertencimento restante é ${this.formatDegree(value)}.`;
  }
  mapX(height:number){return 35+(height-UNIVERSE[0])*350/(UNIVERSE[1]-UNIVERSE[0]);}
  private path(fn:(h:number)=>number){
    return Array.from({length:141},(_,i)=>{
      const h=UNIVERSE[0]+i*.005;
      return `${i?'L':'M'}${this.mapX(h)},${170-fn(h)*140}`;
    }).join(' ');
  }
  curve(shape:Shape){return this.path(h=>this.value(shape,h));}
  area(shape:Shape){return this.curve(shape)+' L385,170 L35,170 Z';}
  readonly tallCurve=this.path(tall);
}
