import { Component, computed, inject, linkedSignal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FOCUS, SET_LABELS, SHOULDERS, membership, tall, definitionsFor, mediumParameters } from './fuzzy-engine';
import type { Shape, HeightSet } from './fuzzy-engine';
import { TrainingService } from './training.service';
import { MembershipCardComponent } from './membership-card.component';
import { MathEquationComponent, type EquationTerm } from './math-equation.component';

function fraction(minuend: number, subtrahend: number, denominator: number): EquationTerm {
  return {
    kind: 'fraction',
    numerator: [minuend, subtrahend],
    denominator,
  };
}

@Component({
  selector:'app-demonstration',standalone:true,
  imports: [
    DecimalPipe,
    FormsModule,
    MatSliderModule,
    MatButtonToggleModule,
    MembershipCardComponent,
    MathEquationComponent,
  ],
  templateUrl:'./app.component.html'
})
export class AppComponent {
  protected readonly training = inject(TrainingService);
  private readonly medium = computed(() => {
    return mediumParameters(this.training.model());
  });

  height=FOCUS;
  protected readonly selectedSet = linkedSignal({
    source: this.training.model,
    computation: (): HeightSet => {
      return 'medium';
    },
  });
  get setLabel() {
    return SET_LABELS[this.selectedSet()];
  }
  get definitions() {
    return definitionsFor(this.selectedSet(), this.training.model());
  }
  value(shape: Shape, height = this.height): number {
    return membership(shape, height, this.selectedSet(), this.training.model());
  }
  get tallFocus(){return tall(this.height);}
  get markerX(){return this.mapX(this.height);}
  private decimal(value:number,digits=2){
    return value.toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  }
  private modelValue(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  formatDegree(value:number){return value>0&&value<.0005?'< 0,001':this.decimal(value,3);}
  private centimetres(value:number){return this.decimal(Math.abs(value)*100,0);}
  get reading(){
    const h=this.height,label=this.modelValue(h),set=this.setLabel;
    const results=this.definitions.map(d=>({...d,value:this.value(d.id)}));
    const full=results.filter(d=>d.value>=1-1e-10);
    if(full.length===3){
      if (this.selectedSet() === 'medium') {
        const [, plateauStart, plateauEnd] = this.medium().trapezoidal;
        const center = this.training.model().center;

        return {
          title: `As três funções consideram uma pessoa de ${label} m plenamente compatível com “estatura média”.`,
          explanation: `A medida coincide com o centro de ${this.modelValue(center)} m da triangular e da gaussiana e está na faixa de ${this.modelValue(plateauStart)} a ${this.modelValue(plateauEnd)} m da trapezoidal. As três funções atribuem grau 1.`,
        };
      }
      const tallSet=this.selectedSet()==='tall';
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
    if (linearZero) {
      const gaussianDegree = this.value('gaussian');
      if (gaussianDegree === 0) {
        return {
          title: `As três funções retornam grau 0 para ${label} m no conjunto “${set}”.`,
          explanation: 'A medida está fora da faixa de pertinência positiva da triangular e da trapezoidal. Na gaussiana, a distância é tão grande que o valor calculado também chega a zero na precisão do aplicativo.',
        };
      }
      return {
        title: `A triangular e a trapezoidal atribuem grau 0 a ${label} m no conjunto “${set}”.`,
        explanation: `A medida está fora da faixa de pertinência positiva dessas duas curvas. A cauda da gaussiana ainda atribui grau ${this.formatDegree(gaussianDegree)}.`,
      };
    }
    const ordered=[...results].sort((a,b)=>b.value-a.value);
    const top=ordered[0];
    return {
      title:`Uma pessoa de ${label} m tem pertencimento parcial a “${set}”, com maior grau na ${top.name.toLowerCase()}.`,
      explanation:`Nenhuma função considera essa altura plenamente ${set}. A ${top.name.toLowerCase()} atribui ${this.formatDegree(top.value)}, enquanto a ${ordered[1].name.toLowerCase()} atribui ${this.formatDegree(ordered[1].value)} e a ${ordered[2].name.toLowerCase()} atribui ${this.formatDegree(ordered[2].value)}. A comparação mostra quanto cada definição aceita essa mesma altura como “${set}”.`
    };
  }
  get tallCalculation(): EquationTerm | null {
    if (this.height > 1.60 && this.height < 1.90) {
      return fraction(this.height, 1.60, 0.30);
    }
    return null;
  }

  calculation(shape: Shape): string | EquationTerm {
    const height = this.height;
    const label = this.modelValue(height);
    const selectedSet = this.selectedSet();
    if (selectedSet !== 'medium') {
      const model = SHOULDERS[selectedSet];
      const short = selectedSet === 'short';
      if (shape === 'gaussian') {
        if (short ? height <= model.center : height >= model.center) {
          return 'Altura na faixa de grau 1';
        }
        return {
          kind: 'gaussian',
          height,
          center: model.center,
          sigma: 0.10,
        };
      }
      const [a, b] = model[shape];
      if (height <= a || height >= b) {
        return this.value(shape) === 1 ? 'Altura na faixa de grau 1' : 'Altura na faixa de grau 0';
      }
      return short ? fraction(b, height, b - a) : fraction(height, a, b - a);
    }
    if (shape === 'gaussian') {
      const [center, sigma] = this.medium().gaussian;
      return {
        kind: 'gaussian',
        height,
        center,
        sigma,
      };
    }

    const [start, firstPeak, nextPoint, trapezoidEnd] = this.medium()[shape];
    const end = trapezoidEnd ?? nextPoint;
    if (this.value(shape) === 1) {
      if (shape === 'trapezoidal') {
        return `${label} está na faixa de ${this.modelValue(firstPeak)} a ${this.modelValue(nextPoint)} m`;
      }
      return `${label} coincide com o pico de ${this.modelValue(firstPeak)} m`;
    }
    if (height <= start || height >= end) {
      return 'Grau 0 no limite ou fora do suporte';
    }
    if (height < firstPeak) {
      return fraction(height, start, firstPeak - start);
    }
    const descendingPeak = shape === 'triangular' ? firstPeak : nextPoint;
    return fraction(end, height, end - descendingPeak);
  }
  interpretation(shape:Shape){
    const h=this.height,label=this.modelValue(h),value=this.value(shape);
    const meaning=value>=1-1e-10
      ?`Uma pessoa de ${label} m satisfaz plenamente a descrição “${this.setLabel}” nesta função.`
      :value===0
        ?`Uma pessoa de ${label} m não pertence ao conjunto “${this.setLabel}” nesta função.`
        :`Uma pessoa de ${label} m recebe grau ${this.formatDegree(value)} de pertencimento a “${this.setLabel}” nesta função.`;
    const selectedSet = this.selectedSet();
    if(selectedSet!=='medium'){
      const model=SHOULDERS[selectedSet],left=selectedSet==='short';
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
    const center = this.training.model().center;
    if (shape === 'gaussian') {
      const sigma = this.training.model().widths.gaussian;
      if (Math.abs(h - center) < 1e-10) {
        return `${meaning} A medida coincide com o centro de ${this.modelValue(center)} m.`;
      }

      return `${meaning} A medida está a ${this.modelValue(Math.abs(h - center) * 100)} cm do centro de ${this.modelValue(center)} m. A pertinência cai suavemente conforme a distância aumenta. O parâmetro σ é de ${this.centimetres(sigma)} cm.`;
    }

    const [start, firstPeak, nextPoint, trapezoidEnd] = this.medium()[shape];
    const end = trapezoidEnd ?? nextPoint;
    if (value === 0) {
      return `${meaning} Nesta curva, o grau é positivo somente entre ${this.modelValue(start)} e ${this.modelValue(end)} m.`;
    }
    if (shape === 'triangular') {
      if (Math.abs(h - center) < 1e-10) {
        return `${meaning} A medida coincide com o pico de ${this.modelValue(center)} m.`;
      }

      return `${meaning} A medida está a ${this.modelValue(Math.abs(h - center) * 100)} cm do pico de ${this.modelValue(center)} m. A pertinência diminui em linha reta até chegar a zero a ${this.centimetres(this.training.model().widths.triangular)} cm do pico.`;
    }
    const plateau = `de ${this.modelValue(firstPeak)} a ${this.modelValue(nextPoint)} m`;
    if (value === 1) {
      return `${meaning} A medida está dentro da faixa de grau 1, ${plateau}.`;
    }

    const edge = h < firstPeak ? firstPeak : nextPoint;
    return `${meaning} A medida está a ${this.modelValue(Math.abs(h - edge) * 100)} cm da faixa de grau 1, ${plateau}. Nesse trecho, a pertinência diminui em linha reta em direção ao limite.`;
  }
  mapX(height: number): number {
    const { min, max } = this.training.heightScale();
    return 35 + ((height - min) / (max - min)) * 350;
  }
  private path(fn: (height: number) => number, breakpoints: readonly number[] = []): string {
    const { min, max } = this.training.heightScale();
    const heights = Array.from({ length: 141 }, (_, index) => {
      return min + (index / 140) * (max - min);
    });
    heights.push(...breakpoints.filter((height) => {
      return height > min && height < max;
    }));
    heights.sort((first, second) => first - second);

    return heights.map((height, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${this.mapX(height)},${170 - fn(height) * 140}`;
    }).join(' ');
  }
  curve(shape: Shape): string {
    let breakpoints: readonly number[] = [];
    if (this.selectedSet() === 'medium') {
      breakpoints = shape === 'gaussian' ? [this.medium().gaussian[0]] : this.medium()[shape];
    }

    return this.path((height) => this.value(shape, height), breakpoints);
  }
  protected readonly tallCurve = computed(() => {
    return this.path(tall, [1.60, 1.90]);
  });
}
