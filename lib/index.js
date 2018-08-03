const Ajv = require('ajv');
const version4Schema = require('ajv/lib/refs/json-schema-draft-04.json');
const JsonFile = require('jsonfile');
const path = require('path');
const { filter, find } = require('lodash');

/**
 * Remove duplicate items from passed collections.
 * @param {*} collection1
 * @param {*} collection2
 */
function removeDuplicates(collection1, collection2) {
  return filter(collection1, (obj) => {
    return !find(collection2, obj);
  });
}

/**
   * Extract schema version from code.json
   * @param {object} codeJson
   */
function getCodeJsonVersion(codeJson) {
  if(codeJson.version) {
    return codeJson.version;
  } else {
    if(codeJson.agency && codeJson.projects) {
      return '1.0.1';
    } else {
      return '2.0.0';
    }
  }
}

/**
 * Get schema validator functions for a given schema path.
 * @param {string} schemaPath
 */
function getSchemaValidators(schemaPath) {
  const ajv = new Ajv({ async: true, allErrors: true, schemaId: 'id', logger: false });
  ajv.addMetaSchema(version4Schema);

  return {
    relaxed: ajv.compile(JsonFile.readFileSync(path.join(schemaPath, '/relaxed.json'))),
    strict: ajv.compile(JsonFile.readFileSync(path.join(schemaPath, '/strict.json'))),
    enhanced: ajv.compile(JsonFile.readFileSync(path.join(schemaPath, '/enhanced.json')))
  };
}

function getCleaner(schemaPath) {
  const ajv = new Ajv({ removeAdditional: true, schemaId: 'id', logger: false });
  ajv.addMetaSchema(version4Schema);

  return ajv.compile(JsonFile.readFileSync(path.join(schemaPath, '/strict.json')));
}

module.exports = {
  removeDuplicates,
  getCodeJsonVersion,
  getSchemaValidators,
  getCleaner
};
