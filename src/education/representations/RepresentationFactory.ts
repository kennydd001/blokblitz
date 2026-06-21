import type { Representation } from "../types";
import { REPRESENTATIONS } from "../types";
import type { RenderOptions, RenderedRepresentation } from "./types";
import { renderRepresentationSvg } from "./svgGenerators";

export class RepresentationFactory {
  static render(representation: Representation, quantity: number, options: RenderOptions = {}): RenderedRepresentation {
    return {
      representation,
      quantity,
      label: options.label ?? `${representation} ${quantity}`,
      svg: renderRepresentationSvg(representation, quantity, options)
    };
  }

  static renderSvg(representation: Representation, quantity: number, options: RenderOptions = {}): string {
    return renderRepresentationSvg(representation, quantity, options);
  }

  static renderAll(quantity: number): RenderedRepresentation[] {
    return REPRESENTATIONS.map((representation) => RepresentationFactory.render(representation, quantity));
  }
}

