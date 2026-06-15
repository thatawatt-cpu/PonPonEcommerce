export type ID = string;

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface ProductOptionChoice {
  label: string;
  value: string;
  /** Optional variant thumbnail configured by the shop admin. */
  imageUrl?: string;
  /** Preview background used when variant photography is not available yet. */
  swatchColor?: string;
}

export interface ProductOption {
  /** e.g. "size" | "color" */
  name: string;
  label: string;
  choices: ProductOptionChoice[];
}
