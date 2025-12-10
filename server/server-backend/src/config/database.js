// Backward-compatible export of primary database pool
// This file maintains compatibility with all existing imports
const { primary } = require('./databases');

module.exports = primary;

