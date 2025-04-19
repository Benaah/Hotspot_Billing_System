import assert from 'assert';
import { Configuration } from '../src/configuration.js';

describe('Configuration', function () {
  describe('#toURL()', function () {
    const config = new Configuration({
      apiKey: '123456789',
      publicKey: '123456789',
      origin: '*',
      userAgent: 'MPesa',
      host: 'sandbox.safaricom.co.ke', // Safaricom's sandbox domain
    });

    it('should auto-complete scheme', function () {
      assert.equal(config.environment.toURL(), 'https://sandbox.safaricom.co.ke');
    });
  });
});