const path = require('path');
const JsonFile = require('jsonfile');
const { getValidator } = require('../index');

describe('Validator', function() {
  let codeJson;
  let agency;

  before(function() {
    codeJson = JsonFile.readFileSync(path.join(__dirname, 'test-data/test-code.json'));
    agency = {
      'id': 19,
      'name': 'General Services Administration',
      'acronym': 'GSA',
      'website': 'https://gsa.gov/',
      'codeUrl': 'https://www.gsa.gov/code.json',
      'fallback_file': 'GSA.json',
      'requirements': {
        'agencyWidePolicy': 1,
        'openSourceRequirement': 1,
        'inventoryRequirement': 1,
        'schemaFormat': 0.5,
        'overallCompliance': 0
      },
      'complianceDashboard': true
    };
  });
  it('should return a validator for schema version 1.0.1', function() {
    const validator = getValidator(require('./test-data/test-code.1.0.1.json'));

    validator._version.should.be.equal('1.0.1');

    Object.keys(validator.validators).length.should.be.equal(1);
    Object.keys(validator.validators.repo).length.should.be.equal(3);

    validator.validators.repo.relaxed.should.be.a('function');
    validator.validators.repo.strict.should.be.a('function');
    validator.validators.repo.enhanced.should.be.a('function');
    validator.cleaner.should.be.a('function');
  });
  it('should return a validator for schema version 2.0.0', function() {
    const validator = getValidator(require('./test-data/test-code.2.0.0.json'));

    validator._version.should.be.equal('2.0.0');

    Object.keys(validator.validators).length.should.be.equal(1);
    Object.keys(validator.validators.repo).length.should.be.equal(3);

    validator.validators.repo.relaxed.should.be.a('function');
    validator.validators.repo.strict.should.be.a('function');
    validator.validators.repo.enhanced.should.be.a('function');
    validator.cleaner.should.be.a('function');
  });
  it('should return a validator for schema version 2.0.0 using code.json _version field', function() {
    const validator = getValidator(codeJson);

    validator._version.should.be.equal('2.0.0');

    Object.keys(validator.validators).length.should.be.equal(1);
    Object.keys(validator.validators.repo).length.should.be.equal(3);

    validator.validators.repo.relaxed.should.be.a('function');
    validator.validators.repo.strict.should.be.a('function');
    validator.validators.repo.enhanced.should.be.a('function');
    validator.cleaner.should.be.a('function');
  });
  it('should not return errors after validating repository', async function() {
    const agency = {
      'id': 19,
      'name': 'General Services Administration',
      'acronym': 'GSA',
      'website': 'https://gsa.gov/',
      'codeUrl': 'https://www.gsa.gov/code.json',
      'fallback_file': 'GSA.json',
      'requirements': {
        'agencyWidePolicy': 1,
        'openSourceRequirement': 1,
        'inventoryRequirement': 1,
        'schemaFormat': 0.5,
        'overallCompliance': 0
      },
      'complianceDashboard': true
    };

    const validator = getValidator(codeJson);
    const repo = codeJson.releases[0];

    const result = await validator.validateRepo(repo, agency);
    result.issues.errors.length.should.be.equal(0);
  });
  it('should return one error for data type string after validating repository', async function() {
    const validator = getValidator(codeJson);
    const repo = codeJson.releases[4];

    const result = await validator.validateRepo(repo, agency);
    result.issues.errors.length.should.be.equal(1);
    result.issues.errors[0].params.type.should.be.equal('string');
  });
  it('should return one error for missing property after validating repository', async function() {
    const validator = getValidator(codeJson);
    const repo = codeJson.releases[3];

    const result = await validator.validateRepo(repo, agency);
    result.issues.errors.length.should.be.equal(2);
    result.issues.errors[0].params.hasOwnProperty('missingProperty');
  });
  it('should not return warnings after validating repository', async function() {
    const validator = getValidator(codeJson);
    const repo = codeJson.releases[1];

    const result = await validator.validateRepo(repo, agency);
    result.issues.warnings.length.should.be.equal(0);
  });
  it('should return warnings after validating repository', async function() {
    const validator = getValidator(codeJson);
    const repo = codeJson.releases[2];

    const result = await validator.validateRepo(repo, agency);
    result.issues.warnings.length.should.be.equal(1);
    result.issues.warnings[0].params.format.should.be.equal('uri');
  });
  it('should return enhancements', async function() {
    const validator = getValidator(codeJson);
    const repo = codeJson.releases[3];

    const result = await validator.validateRepo(repo, agency);
    result.issues.enhancements.length.should.be.equal(2);
  });
});
