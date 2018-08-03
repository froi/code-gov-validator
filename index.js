const path = require('path');
const {
  removeDuplicates,
  getCodeJsonVersion,
  getSchemaValidators,
  getCleaner
} = require('./lib');

/**
 * Return validator for specified schema indicated in the version field found in the codeJson.
 * @param {object} codeJson
 */
function getValidator(codeJson) {
  const version = getCodeJsonVersion(codeJson);
  return new Validator(version);
}

class Validator {

  constructor(version) {
    this._version = version;
    this.validators = {};
    this.PATH_TO_SCHEMAS = path.join(__dirname, 'lib/schemas');
    this.SCHEMAS = ['repo'];

    this.SCHEMAS.forEach((schemaName) => {
      const pathToSchemas = path.join(this.PATH_TO_SCHEMAS, schemaName, this._version);
      this.validators[schemaName] = getSchemaValidators(pathToSchemas);
    });
    this.cleaner = getCleaner(path.join(this.PATH_TO_SCHEMAS, 'repo', this._version));
  }

  _validateRepo(repo, validatorType) {
    let valid = this.validators.repo[validatorType](repo);
    return Promise.resolve(
      valid ? [] : this.validators.repo[validatorType].errors);
  }

  /**
   * Validate the passed repo with a relaxed json schema.
   * @param {Array} errors
   * @param {object} repo
   */
  _processErrors(errors, repo) {
    if(errors.length > 0) {
      return this._removeSpecialCases(repo, errors);
    }
    return [];
  }

  /**
   * Validate the passed repo with a strict json schema.
   * @param {Array} warnings
   * @param {object} repo
   * @param {Array} errors
   */
  _processWarnings(warnings, repo, errors) {
    if(warnings.length > 0) {
      let cleanedWarnings = removeDuplicates(warnings, errors);
      return this._removeSpecialCases(repo, cleanedWarnings);
    }
    return [];
  }

  /**
   * Validate the repo with a enhaced json schema.
   * @param {Array} enhancements
   * @param {object} repo
   * @param {Array} errors
   * @param {Array} warnings
   */
  _processEnhancements(enhancements, repo, errors, warnings) {
    if(enhancements.length > 0) {
      let cleanedEnhancements = removeDuplicates(enhancements, errors);
      cleanedEnhancements = removeDuplicates(enhancements, warnings);
      return this._removeSpecialCases(repo, cleanedEnhancements);
    }
    return [];
  }
  _isNotOpenSource(repo) {
    if (repo.hasOwnProperty('permissions')) {
      return repo.permissions.usageType !== 'openSource';
    }
    return false;
  }
  _propertyMissing(property, obj) {
    if (obj.params && obj.params.hasOwnProperty('missingProperty')) {
      return obj.params.missingProperty === property;
    }
    return false;
  }

  /**
   * Remove errors that fall under specific special cases for warnings.
   * @param {object} repo
   * @param {object} validationItems
   */
  _removeSpecialCases(repo, validationItems) {

    return validationItems.filter((validationItem) => {
      if (this._isNotOpenSource(repo)) {
        const repoUrlMissingWaring = this._propertyMissing('repositoryURL', validationItem) ||
          this._propertyMissing('repository', validationItem);

        if (repoUrlMissingWaring) {
          return false;
        }
        if(validationItem.dataPath === '.repositoryURL') {
          return repo.repositoryURL === null || repo.repositoryURL === undefined
            ? false
            : true;
        }

        const licencesMissing = this._propertyMissing('licences', validationItem);
        if(licencesMissing) {
          return false;
        }

        if(validationItem.dataPath === '.permissions') {
          return repo.permissions.licenses === null || repo.permissions.licenses === undefined
            ? false
            : true;
        }
      }

      return true;
    });
  }

  /**
   * Validate a given repo's structure.
   * @param {object} repo
   * @param {object} agency
   */
  async validateRepo(repo, agency) {
    // logger.debug(`Validating repo data for ${repo.name} (${repo.repoID})...`);

    let result = {
      'repoID': repo.repoID,
      'agency': agency.name,
      'organization': repo.organization,
      'project_name': repo.name,
      issues: {
        enhancements: [],
        warnings: [],
        errors: []
      }
    };

    try {
      const relaxedValidationErrors = await this._validateRepo(repo, 'relaxed');
      result.issues.errors = this._processErrors(relaxedValidationErrors, repo);

      const strictValidationErrors = await this._validateRepo(repo, 'strict');
      result.issues.warnings = this._processWarnings(strictValidationErrors, repo, result.issues.errors);

      const enhancedValidationErrors = await this._validateRepo(repo, 'enhanced');
      result.issues.enhancements = this._processEnhancements(
        enhancedValidationErrors, repo, result.issues.errors, result.issues.warnings);
    } catch (error) {
      return Promise.reject(error);
    }

    return Promise.resolve(result);
  }
}

module.exports = {
  getValidator
};
