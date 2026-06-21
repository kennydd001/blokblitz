import type { Representation } from "../types";

export interface RenderOptions {
  label?: string;
  selected?: boolean;
  muted?: boolean;
  compact?: boolean;
}

export interface RenderedRepresentation {
  representation: Representation;
  quantity: number;
  svg: string;
  label: string;
}

