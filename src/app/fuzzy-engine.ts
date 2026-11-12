/** Funções de pertinência. Dados e parâmetros didáticos explícitos. */
export type Shape = 'triangular' | 'trapezoidal' | 'gaussian';
export type HeightSet = 'short' | 'medium' | 'tall';

export interface Definition {
  id: Shape;
  name: string;
  parameters: string;
  formula: string;
  description: string;
}

export const SET_LABELS: Record<HeightSet, string> = {
  short: 'baixa',
  medium: 'média',
  tall: 'alta',
};

/**
 * Versões com ombro que saturam nas extremidades. A gaussiana com ombro
 * é uma adaptação por partes: uma cauda gaussiana conectada a um platô.
 */
export const SHOULDERS = {
  short: {
    triangular: [1.55, 1.75],
    trapezoidal: [1.65, 1.85],
    center: 1.55,
  },
  tall: {
    triangular: [1.75, 1.95],
    trapezoidal: [1.65, 1.85],
    center: 1.95,
  },
} as const;

export const FOCUS = 1.78;
export const UNIVERSE = [1.40, 2.10] as const;

export interface MediumModel {
  readonly center: number;
  readonly widths: Readonly<Record<Shape, number>>;
}

export const DEFAULT_MEDIUM_MODEL: MediumModel = {
  center: 1.75,
  widths: {
    triangular: 0.20,
    trapezoidal: 0.20,
    gaussian: 0.10,
  },
};

export function mediumParameters(model: MediumModel) {
  const { center, widths } = model;
  const plateauRadius = widths.trapezoidal / 2;

  return {
    triangular: [
      center - widths.triangular,
      center,
      center + widths.triangular,
    ],
    trapezoidal: [
      center - widths.trapezoidal,
      center - plateauRadius,
      center + plateauRadius,
      center + widths.trapezoidal,
    ],
    gaussian: [center, widths.gaussian],
  } as const;
}

function finite(...values: number[]): void {
  if (!values.every(Number.isFinite)) {
    throw new Error('Use apenas números finitos.');
  }
}

export function triangular(x: number, a: number, b: number, c: number): number {
  finite(x, a, b, c);
  if (!(a < b && b < c)) {
    throw new Error('A triangular exige a < b < c.');
  }

  return Math.max(0, Math.min((x - a) / (b - a), (c - x) / (c - b)));
}

export function trapezoidal(x: number, a: number, b: number, c: number, d: number): number {
  finite(x, a, b, c, d);
  if (!(a < b && b <= c && c < d)) {
    throw new Error('A trapezoidal exige a < b ≤ c < d.');
  }

  return Math.max(0, Math.min((x - a) / (b - a), 1, (d - x) / (d - c)));
}

export function gaussian(x: number, center: number, sigma: number): number {
  finite(x, center, sigma);
  if (sigma <= 0) {
    throw new Error('A largura σ deve ser positiva.');
  }

  return Math.exp(-((x - center) ** 2) / (2 * sigma * sigma));
}

export function membership(
  shape: Shape,
  x: number,
  set: HeightSet = 'medium',
  mediumModel: MediumModel = DEFAULT_MEDIUM_MODEL,
): number {
  if (set !== 'medium') {
    finite(x);
    const model = SHOULDERS[set];

    if (shape === 'gaussian') {
      const isOnPlateau = set === 'short' ? x <= model.center : x >= model.center;
      if (isOnPlateau) {
        return 1;
      }

      return gaussian(x, model.center, 0.10);
    }

    if (shape !== 'triangular' && shape !== 'trapezoidal') {
      throw new Error('Função desconhecida.');
    }

    const [a, b] = model[shape];
    const ramp = set === 'short' ? (b - x) / (b - a) : (x - a) / (b - a);
    return Math.max(0, Math.min(1, ramp));
  }

  const parameters = mediumParameters(mediumModel);
  switch (shape) {
    case 'triangular': {
      const [start, center, end] = parameters.triangular;
      if (start === center || center === end) {
        const radius = mediumModel.widths.triangular;
        return triangular(x - center, -radius, 0, radius);
      }
      return triangular(x, start, center, end);
    }
    case 'trapezoidal': {
      const [start, plateauStart, plateauEnd, end] = parameters.trapezoidal;
      if (start === plateauStart || plateauEnd === end) {
        const radius = mediumModel.widths.trapezoidal;
        return trapezoidal(x - mediumModel.center, -radius, -radius / 2, radius / 2, radius);
      }
      return trapezoidal(x, start, plateauStart, plateauEnd, end);
    }
    case 'gaussian': {
      return gaussian(x, ...parameters.gaussian);
    }
    default: {
      throw new Error('Função desconhecida.');
    }
  }
}

const metres = (x: number): string => {
  return x.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

function mediumDefinitions(model: MediumModel): Definition[] {
  const parameters = mediumParameters(model);
  const [triangleStart, center, triangleEnd] = parameters.triangular;
  const [trapezoidStart, plateauStart, plateauEnd, trapezoidEnd] = parameters.trapezoidal;
  const sigma = model.widths.gaussian;

  return [
    {
      id: 'triangular',
      name: 'Triangular',
      parameters: `a = ${metres(triangleStart)} · b = ${metres(center)} · c = ${metres(triangleEnd)} m`,
      formula: 'μ(h) = max(min((h−a)/(b−a), (c−h)/(c−b)), 0)',
      description: `A estatura média tem um único ponto de pertinência máxima em ${metres(center)} m.`,
    },
    {
      id: 'trapezoidal',
      name: 'Trapezoidal',
      parameters:
        `a = ${metres(trapezoidStart)} · b = ${metres(plateauStart)} · c = ${metres(plateauEnd)} · d = ${metres(trapezoidEnd)} m`,
      formula: 'μ(h) = max(min((h−a)/(b−a), 1, (d−h)/(d−c)), 0)',
      description: `As alturas de ${metres(plateauStart)} a ${metres(plateauEnd)} m recebem grau 1.`,
    },
    {
      id: 'gaussian',
      name: 'Gaussiana',
      parameters: `c = ${metres(center)} m · σ = ${metres(sigma)} m`,
      formula: 'μ(h) = exp(−(h−c)² / (2σ²))',
      description: `A adequação é máxima em ${metres(center)} m e diminui suavemente com o afastamento.`,
    },
  ];
}

export const DEFINITIONS = mediumDefinitions(DEFAULT_MEDIUM_MODEL);

export function definitionsFor(
  set: HeightSet,
  mediumModel: MediumModel = DEFAULT_MEDIUM_MODEL,
): Definition[] {
  if (set === 'medium') {
    return mediumModel === DEFAULT_MEDIUM_MODEL ? DEFINITIONS : mediumDefinitions(mediumModel);
  }

  const model = SHOULDERS[set];
  const left = set === 'short';

  return DEFINITIONS.map((definition) => {
    if (definition.id === 'gaussian') {
      const plateauDirection = left ? 'até' : 'a partir de';

      return {
        id: definition.id,
        name: 'Gaussiana com ombro',
        parameters: `c = ${metres(model.center)} m · σ = 0,10 m`,
        formula: `μ(h) = 1 se h ${left ? '≤' : '≥'} c; exp(−(h−c)² / (2σ²)) caso contrário`,
        description:
          `A cauda gaussiana encontra um platô de grau 1 para alturas ${plateauDirection} ${metres(model.center)} m.`,
      };
    }

    const [a, b] = model[definition.id];
    const plateauRange = left ? `até ${metres(a)}` : `a partir de ${metres(b)}`;

    return {
      id: definition.id,
      name: `${definition.name} com ombro`,
      parameters: `a = ${metres(a)} · b = ${metres(b)} m`,
      formula: `μ(h) = max(0, min(1, ${left ? '(b−h)' : '(h−a)'} / (b−a)))`,
      description: `Rampa ${left ? 'decrescente' : 'crescente'}, com grau 1 ${plateauRange} m.`,
    };
  });
}

/**
 * Exemplo didático inspirado na pergunta de Russell sobre uma pessoa de 1,78 m.
 * Os limites 1,60/1,90 e o grau calculado não são fornecidos pelo livro.
 */
export function tall(height: number): number {
  finite(height);
  return Math.max(0, Math.min(1, (height - 1.60) / 0.30));
}

/** Corte alfa fechado, na reta real, para as funções definidas acima. */
export function alphaCut(
  shape: Shape,
  alpha: number,
  set: HeightSet = 'medium',
): [number, number] {
  if (!Number.isFinite(alpha) || alpha <= 0 || alpha > 1) {
    throw new Error('Use 0 < α ≤ 1.');
  }

  if (set !== 'medium') {
    const model = SHOULDERS[set];
    const left = set === 'short';
    let edge: number;

    if (shape === 'gaussian') {
      const radius = 0.10 * Math.sqrt(-2 * Math.log(alpha));
      edge = model.center + (left ? radius : -radius);
    } else if (shape === 'triangular' || shape === 'trapezoidal') {
      const [a, b] = model[shape];
      edge = left ? b - (b - a) * alpha : a + (b - a) * alpha;
    } else {
      throw new Error('Função desconhecida.');
    }

    return left ? [-Infinity, edge] : [edge, Infinity];
  }

  if (shape === 'triangular') {
    return [1.55 + 0.20 * alpha, 1.95 - 0.20 * alpha];
  }
  if (shape === 'trapezoidal') {
    return [1.55 + 0.10 * alpha, 1.95 - 0.10 * alpha];
  }
  if (shape === 'gaussian') {
    const radius = 0.10 * Math.sqrt(-2 * Math.log(alpha));
    return [1.75 - radius, 1.75 + radius];
  }

  throw new Error('Função desconhecida.');
}

export const SUMMARY = {
  concept: 'Estatura média',
  universe: UNIVERSE,
  focus: FOCUS,
  tallFocus: tall(FOCUS),
  definitions: DEFINITIONS,
  focusValues: DEFINITIONS.map((definition) => {
    return {
      shape: definition.id,
      value: membership(definition.id, FOCUS),
    };
  }),
  alpha: 0.5,
  cuts: DEFINITIONS.map((definition) => {
    return {
      shape: definition.id,
      interval: alphaCut(definition.id, 0.5),
    };
  }),
};
