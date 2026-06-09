export type ID = string;

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface ProductOptionChoice {
  label: string;
  value: string;
}

export interface ProductOption {
  /** e.g. "size" | "color" */
  name: string;
  label: string;
  choices: ProductOptionChoice[];
}
