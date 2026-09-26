/**
 * Optional nested Platt transform. This is secondary prototype output only;
 * it must not replace the raw 0.50 HIGH/LOW decision or be called a validated
 * spoilage, safety, shelf-life, or confidence probability.
 */
export function applyPlatt(rawScore, calibrator) {
  const probability = Math.min(1 - 1e-6, Math.max(1e-6, Number(rawScore)));
  const logit = Math.log(probability / (1 - probability));
  const value = calibrator.a * logit + calibrator.b;
  return value >= 0
    ? 1 / (1 + Math.exp(-value))
    : Math.exp(value) / (1 + Math.exp(value));
}
