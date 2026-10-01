/** Unit conversion. Each unit converts to and from its category's base unit; most are a simple factor. */

export interface Unit { id: string; name: string; symbol: string; toBase: (v: number) => number; fromBase: (v: number) => number }
export interface UnitCategory { id: string; name: string; units: Unit[] }

const factor = (id: string, name: string, symbol: string, size: number): Unit => ({ id, name, symbol, toBase: (v) => v * size, fromBase: (v) => v / size });

export const UNIT_CATEGORIES: UnitCategory[] = [
  { id: "length", name: "Length", units: [
    factor("mm", "Millimetre", "mm", 0.001), factor("cm", "Centimetre", "cm", 0.01), factor("m", "Metre", "m", 1), factor("km", "Kilometre", "km", 1000),
    factor("in", "Inch", "in", 0.0254), factor("ft", "Foot", "ft", 0.3048), factor("yd", "Yard", "yd", 0.9144), factor("mi", "Mile", "mi", 1609.344), factor("nmi", "Nautical mile", "nmi", 1852),
  ] },
  { id: "weight", name: "Weight", units: [
    factor("mg", "Milligram", "mg", 1e-6), factor("g", "Gram", "g", 0.001), factor("kg", "Kilogram", "kg", 1), factor("quintal", "Quintal", "q", 100), factor("t", "Tonne", "t", 1000),
    factor("oz", "Ounce", "oz", 0.028349523125), factor("lb", "Pound", "lb", 0.45359237), factor("st", "Stone", "st", 6.35029318), factor("tola", "Tola", "tola", 0.0116638038), factor("ct", "Carat", "ct", 0.0002),
  ] },
  { id: "area", name: "Area", units: [
    factor("mm2", "Square millimetre", "mm²", 1e-6), factor("cm2", "Square centimetre", "cm²", 1e-4), factor("m2", "Square metre", "m²", 1), factor("km2", "Square kilometre", "km²", 1e6),
    factor("in2", "Square inch", "in²", 0.00064516), factor("ft2", "Square foot", "ft²", 0.09290304), factor("yd2", "Square yard (gaj)", "yd²", 0.83612736),
    factor("cent", "Cent", "cent", 40.468564224), factor("guntha", "Guntha", "guntha", 101.17141056), factor("acre", "Acre", "ac", 4046.8564224), factor("ha", "Hectare", "ha", 10_000),
  ] },
  { id: "volume", name: "Volume", units: [
    factor("ml", "Millilitre", "ml", 0.001), factor("l", "Litre", "L", 1), factor("m3", "Cubic metre", "m³", 1000), factor("tsp", "Teaspoon (US)", "tsp", 0.00492892159375), factor("tbsp", "Tablespoon (US)", "tbsp", 0.01478676478125),
    factor("floz", "Fluid ounce (US)", "fl oz", 0.0295735295625), factor("cup", "Cup (US)", "cup", 0.2365882365), factor("galus", "Gallon (US)", "gal", 3.785411784), factor("galuk", "Gallon (UK)", "gal (UK)", 4.54609), factor("ft3", "Cubic foot", "ft³", 28.316846592),
  ] },
  { id: "temperature", name: "Temperature", units: [
    { id: "c", name: "Celsius", symbol: "°C", toBase: (v) => v, fromBase: (v) => v },
    { id: "f", name: "Fahrenheit", symbol: "°F", toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
    { id: "k", name: "Kelvin", symbol: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ] },
  { id: "speed", name: "Speed", units: [
    factor("mps", "Metre per second", "m/s", 1), factor("kmph", "Kilometre per hour", "km/h", 1 / 3.6), factor("mph", "Mile per hour", "mph", 0.44704), factor("knot", "Knot", "kn", 1852 / 3600), factor("fps", "Foot per second", "ft/s", 0.3048),
  ] },
  { id: "time", name: "Time", units: [
    factor("ms", "Millisecond", "ms", 0.001), factor("s", "Second", "s", 1), factor("min", "Minute", "min", 60), factor("h", "Hour", "h", 3600), factor("day", "Day", "d", 86_400),
    factor("week", "Week", "wk", 604_800), factor("month", "Month (average)", "mo", 2_629_746), factor("year", "Year (average)", "yr", 31_556_952),
  ] },
  { id: "pressure", name: "Pressure", units: [
    factor("pa", "Pascal", "Pa", 1), factor("kpa", "Kilopascal", "kPa", 1000), factor("bar", "Bar", "bar", 100_000), factor("atm", "Atmosphere", "atm", 101_325),
    factor("psi", "Pound per sq inch", "psi", 6894.757293168), factor("mmhg", "Millimetre of mercury", "mmHg", 133.322387415),
  ] },
  { id: "energy", name: "Energy", units: [
    factor("j", "Joule", "J", 1), factor("kj", "Kilojoule", "kJ", 1000), factor("cal", "Calorie", "cal", 4.184), factor("kcal", "Kilocalorie", "kcal", 4184),
    factor("wh", "Watt-hour", "Wh", 3600), factor("kwh", "Kilowatt-hour (unit)", "kWh", 3.6e6), factor("btu", "BTU", "BTU", 1055.05585262),
  ] },
  { id: "power", name: "Power", units: [
    factor("w", "Watt", "W", 1), factor("kw", "Kilowatt", "kW", 1000), factor("ps", "Horsepower (metric)", "PS", 735.49875),
    factor("hp", "Horsepower (mechanical)", "hp", 745.6998715822702), factor("tr", "Ton of refrigeration (AC)", "TR", 3516.8528420667),
  ] },
  { id: "fuel", name: "Fuel economy", units: [
    { id: "kmpl", name: "Kilometres per litre", symbol: "km/L", toBase: (v) => v, fromBase: (v) => v },
    { id: "l100", name: "Litres per 100 km", symbol: "L/100 km", toBase: (v) => 100 / v, fromBase: (v) => 100 / v },
    factor("mpgus", "Miles per gallon (US)", "mpg", 1.609344 / 3.785411784),
    factor("mpguk", "Miles per gallon (UK)", "mpg (UK)", 1.609344 / 4.54609),
  ] },
  { id: "angle", name: "Angle", units: [
    factor("deg", "Degree", "°", 1), factor("rad", "Radian", "rad", 180 / Math.PI), factor("grad", "Gradian", "grad", 0.9),
    factor("arcmin", "Arcminute", "arcmin", 1 / 60), factor("arcsec", "Arcsecond", "arcsec", 1 / 3600),
  ] },
];

export function getUnit(categoryId: string, unitId: string) {
  return UNIT_CATEGORIES.find((c) => c.id === categoryId)?.units.find((u) => u.id === unitId);
}

export function convertUnit(value: number, from: Unit, to: Unit) {
  return to.fromBase(from.toBase(value));
}

/** Up to `digits` significant figures, without exponent noise for everyday magnitudes. */
export function formatUnitValue(value: number, digits = 10) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-9) return value.toExponential(6).replace(/\.?0+e/, "e");
  return Number(value.toPrecision(digits)).toLocaleString("en-US", { maximumFractionDigits: 12 });
}
