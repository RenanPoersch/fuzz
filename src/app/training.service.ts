import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_MEDIUM_MODEL, UNIVERSE } from './fuzzy-engine';
import { RATING_HEIGHTS, fitMediumModel, isHeight, isRating } from './training-model';

interface TrainingData {
  heights: number[];
  assessments: number[][];
  center: number | null;
  fittedRatings: number[] | null;
}

const STORAGE_KEY = 'fuzzy-lab-training-v1';

function isAssessment(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === RATING_HEIGHTS.length && value.every(isRating);
}

function readTrainingData(): TrainingData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const data = JSON.parse(saved) as Partial<TrainingData> | null;
      if (
        data &&
        Array.isArray(data.heights) && data.heights.every(isHeight) &&
        Array.isArray(data.assessments) && data.assessments.every(isAssessment) &&
        (data.center === null || isHeight(data.center)) &&
        (data.fittedRatings === null || isAssessment(data.fittedRatings))
      ) {
        return {
          heights: data.heights,
          assessments: data.assessments,
          center: data.center,
          fittedRatings: data.fittedRatings,
        };
      }
    }
  } catch {
    // The classroom demo can run in memory when browser storage is unavailable.
  }

  return {
    heights: [],
    assessments: [],
    center: null,
    fittedRatings: null,
  };
}

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly data = signal(readTrainingData());

  readonly heights = computed(() => {
    return this.data().heights;
  });
  readonly assessmentCount = computed(() => {
    return this.data().assessments.length;
  });
  readonly appliedCenter = computed(() => {
    return this.data().center;
  });
  readonly fittedRatings = computed(() => {
    return this.data().fittedRatings;
  });
  readonly heightScale = computed(() => {
    const center = this.appliedCenter() ?? DEFAULT_MEDIUM_MODEL.center;
    let min = Math.min(UNIVERSE[0], center);
    let max = Math.max(UNIVERSE[1], center);
    for (const height of this.heights()) {
      min = Math.min(min, height);
      max = Math.max(max, height);
    }

    const stepsPerMetre = 1_000;
    const roundedMax = Math.ceil(max * stepsPerMetre) / stepsPerMetre;
    return {
      min: Math.floor(min * stepsPerMetre) / stepsPerMetre,
      max: Number.isFinite(roundedMax) ? roundedMax : max,
      step: 1 / stepsPerMetre,
    };
  });
  readonly model = computed(() => {
    const center = this.appliedCenter();
    const ratings = this.fittedRatings();
    if (center === null && ratings === null) {
      return DEFAULT_MEDIUM_MODEL;
    }

    return fitMediumModel(center ?? DEFAULT_MEDIUM_MODEL.center, ratings);
  });

  includeHeight(height: number): void {
    this.save({
      ...this.data(),
      heights: [...this.heights(), height],
    });
  }

  calculateCenter(): void {
    const heights = this.heights();
    if (heights.length === 0) {
      return;
    }

    const center = heights.reduce((average, height, index) => {
      return average + (height - average) / (index + 1);
    }, 0);

    this.save({
      ...this.data(),
      center,
    });
  }

  includeAssessment(ratings: number[]): void {
    this.save({
      ...this.data(),
      assessments: [...this.data().assessments, ratings],
    });
  }

  fitWidths(): void {
    const assessments = this.data().assessments;
    if (assessments.length === 0) {
      return;
    }

    const fittedRatings = RATING_HEIGHTS.map((_, index) => {
      const sum = assessments.reduce((total, ratings) => {
        return total + ratings[index];
      }, 0);
      return sum / assessments.length;
    });

    this.save({
      ...this.data(),
      fittedRatings,
    });
  }

  private save(data: TrainingData): void {
    this.data.set(data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Retain the current session's answers in memory.
    }
  }
}
