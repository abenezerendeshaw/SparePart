// Suppress expo winter runtime import-outside-scope error
// This is needed because expo/src/winter/runtime.native.ts tries to import
// files using import.meta which is not supported in Jest's CommonJS environment.
global.__ExpoImportMetaRegistry = {};

// Polyfill structuredClone if not available (needed by expo winter runtime)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
