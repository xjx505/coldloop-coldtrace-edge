import fs from 'node:fs';
import assert from 'node:assert/strict';
import { evaluateWindow, extractFeatures, score } from '../src/index.js';

const productionModel = JSON.parse(fs.readFileSync(new URL('../model/edge_model.json', import.meta.url)));
const productionVectors = JSON.parse(fs.readFileSync(new URL('./all_six_parity_vectors.json', import.meta.url)));
const evaluationModel = JSON.parse(fs.readFileSync(new URL('../evaluation_only/edge_model_s2_loso.json', import.meta.url)));
const evaluationVectors = JSON.parse(fs.readFileSync(new URL('../evaluation_only/s2_heldout_parity_vectors.json', import.meta.url)));
const tolerance = 1e-10;

function verify(model, vectors) {
  for (const vector of vectors) {
    const actualFeatures = extractFeatures(vector.raw_window, model.sensor_configuration, model.feature_schema);
    for (const [name, expected] of Object.entries(vector.expected_features)) {
      const actual = actualFeatures[name];
      if (expected === null) assert.equal(actual, null, `${vector.case_id}:${name}`);
      else assert.ok(Math.abs(actual - expected) <= tolerance, `${vector.case_id}:${name}: ${actual} != ${expected}`);
    }
    const actualScore = score(actualFeatures, model);
    assert.ok(Math.abs(actualScore - vector.expected_score) <= tolerance,
      `${vector.case_id}: score ${actualScore} != ${vector.expected_score}`);
  }
}

verify(productionModel, productionVectors);
verify(evaluationModel, evaluationVectors);

const first = productionVectors[0].raw_window;
const warmup = evaluateWindow(first.slice(0, 6).map((row, i) => ({ ...row, timestamp_ms: i * 600_000 })), productionModel);
assert.equal(warmup.status, 'MODEL WARM-UP');
const ready = evaluateWindow(first.map((row, i) => ({ ...row, timestamp_ms: i * 600_000 })), productionModel);
assert.equal(ready.status, 'READY');
assert.ok(Math.abs(ready.score - productionVectors[0].expected_score) <= tolerance);
const gap = evaluateWindow(first.map((row, i) => ({ ...row, timestamp_ms: i * 600_000 + (i === 6 ? 1 : 0) })), productionModel);
assert.equal(gap.status, 'MODEL WARM-UP');

console.log(JSON.stringify({
  result: 'PASS',
  production_vectors: productionVectors.length,
  evaluation_only_s2_vectors: evaluationVectors.length,
  warmup_gate: warmup.status,
  gap_gate: gap.status,
  ready_score: ready.score,
  threshold: productionModel.decision_threshold,
}, null, 2));
