import {
  DEFAULT_MEDIUM_MODEL,
  UNIVERSE,
  membership,
  type MediumModel,
  type Shape,
} from './fuzzy-engine.ts';

export const RATING_HEIGHTS = [1.55, 1.65, 1.75, 1.85, 1.95] as const;

export function parseDecimal(value: string, decimalPlaces?: number): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return NaN;
  }
  const fraction = normalized.split('.')[1] ?? '';
  if (decimalPlaces !== undefined && fraction.length > decimalPlaces) {
    return NaN;
  }

  return Number(normalized);
}

export function isHeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isRating(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

function fitWidth(shape: Shape, center: number, ratings: readonly number[]): number {
  const defaultWidth = DEFAULT_MEDIUM_MODEL.widths[shape];

  function squaredError(width: number): number {
    const candidate: MediumModel = {
      center,
      widths: {
        ...DEFAULT_MEDIUM_MODEL.widths,
        [shape]: width,
      },
    };

    return RATING_HEIGHTS.reduce((error, height, index) => {
      const difference = membership(shape, height, 'medium', candidate) - ratings[index];
      return error + difference ** 2;
    }, 0);
  }

  let bestWidth = defaultWidth;
  let bestError = squaredError(defaultWidth);
  const maxCentimeters = Math.round((UNIVERSE[1] - UNIVERSE[0]) * 100);

  for (let centimeters = 1; centimeters <= maxCentimeters; centimeters++) {
    const width = centimeters / 100;
    const error = squaredError(width);
    const sameError = Math.abs(error - bestError) < 1e-12;
    const closerToDefault = Math.abs(width - defaultWidth) < Math.abs(bestWidth - defaultWidth);

    if (error < bestError - 1e-12 || (sameError && closerToDefault)) {
      bestWidth = width;
      bestError = error;
    }
  }

  return bestWidth;
}

export function fitMediumModel(center: number, ratings: readonly number[] | null): MediumModel {
  if (ratings === null) {
    return {
      center,
      widths: DEFAULT_MEDIUM_MODEL.widths,
    };
  }

  return {
    center,
    widths: {
      triangular: fitWidth('triangular', center, ratings),
      trapezoidal: fitWidth('trapezoidal', center, ratings),
      gaussian: fitWidth('gaussian', center, ratings),
    },
  };
}
