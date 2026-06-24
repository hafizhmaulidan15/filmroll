import type { FilmStockType } from "@/types";

export function getFilmCSSFilter(stock: FilmStockType): string {
  const contrast = 1 + (stock.contrastLevel - 50) / 100;
  const saturate = 1 + (stock.saturationLevel - 50) / 100;
  const brightness = 1 - stock.fadeAmount / 200;
  const sepia = Math.abs(stock.temperatureShift) / 200;
  const hueRotate = stock.temperatureShift;

  return [
    `contrast(${contrast})`,
    `saturate(${saturate})`,
    `brightness(${brightness})`,
    stock.temperatureShift !== 0 ? `sepia(${sepia}) hue-rotate(${hueRotate}deg)` : "",
  ].filter(Boolean).join(" ");
}
