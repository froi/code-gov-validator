require('chai').should();
const expect = require('chai').expect;
const JsonFile = require('jsonfile');
const path = require('path');

const {
  removeDuplicates,
  getCodeJsonVersion,
  getSchemaValidators,
  getCleaner
} = require('../lib');

describe('Libs tests', function() {
  let codeJson;
  let schemaPath;

  before(function() {
    codeJson = JsonFile.readFileSync(path.join(__dirname, 'test-data/test-code.json'));
    schemaPath = path.join(path.dirname(__dirname), 'lib/schemas/repo/2.0.1');
  });
  it('should return codeJson version from codeJson', function() {
    const version = getCodeJsonVersion(codeJson);

    version.should.be.equal('2.0.0');
  });
  it('should return code.json schema validators', function() {
    const validators = getSchemaValidators(schemaPath);

    validators.should.have.property('relaxed');
    validators.should.have.property('strict');
    validators.should.have.property('enhanced');

    validators.relaxed.should.be.a('function');
    validators.strict.should.be.a('function');
    validators.enhanced.should.be.a('function');
  });
  it('should return a code.json cleaner validator', function() {
    const cleanerValidator = getCleaner(schemaPath);

    cleanerValidator.should.be.a('function');
    expect(cleanerValidator.errors).to.be.null;
  });
  it('should remove duplicated errors after schema validatioin', function() {
    const collection1 = [
      {
        repo_name: 'code-gov-web',
        url: 'https://github.com/GSA/code-gov-web'
      },
      {
        repo_name: 'code-gov-api',
        url: 'https://github.com/GSA/code-gov-api'
      },
      {
        repo_name: 'code-gov-validator',
        url: 'https://github.com/GSA/code-gov-validator'
      }
    ];
    const collection2 = [
      {
        repo_name: 'code-gov-web',
        url: 'https://github.com/GSA/code-gov-web'
      },
      {
        repo_name: 'code-gov-api',
        url: 'https://github.com/GSA/code-gov-api'
      }
    ];

    const dedupped = removeDuplicates(collection1, collection2);

    dedupped.length.should.be.equal(1);
  });
});
