import assert from 'assert';
import { Environment } from '../src/environment.js';

describe('Environment', function () {
  describe('#fromURL()', function () {
    it('should parse url without error', function () {
      const environment = Environment.fromURL('sandbox.safaricom.co.ke');
      assert.equal(environment.scheme, 'https');
      assert.equal(environment.domain, 'sandbox.safaricom.co.ke');
    });
  });

  describe('#toURL()', function () {
    it('should complete scheme', function () {
      const environment = Environment.fromURL('sandbox.safaricom.co.ke');
      assert.equal(environment.toURL(), 'https://sandbox.safaricom.co.ke');
    });
  });
});