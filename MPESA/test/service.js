import assert from 'assert';
import { Service } from '../src/service.js';

describe('Service', function () {
  const service = new Service({
    apiKey: '123456789',
    publicKey: '123456789',
    serviceProviderCode: '123456',
  });

  describe('#normalizePhoneNumber', function () {
    const phoneNumber1 = '712345678'; // Kenyan phone number without country code
    const phoneNumber2 = '00254712345678'; // International format with 00
    const phoneNumber3 = '+254712345678'; // International format with +
    const phoneNumber4 = '0712345678'; // Local format with 0

    it('Should prepend `254` to phone number without country code', function () {
      assert.equal('254712345678', service.normalizePhoneNumber(phoneNumber1));
    });

    it('Should replace `00` with `254` in phone number', function () {
      assert.equal('254712345678', service.normalizePhoneNumber(phoneNumber2));
    });

    it('Should replace `+` with `254` in phone number', function () {
      assert.equal('254712345678', service.normalizePhoneNumber(phoneNumber3));
    });

    it('Should replace `0` with `254` in phone number', function () {
      assert.equal('254712345678', service.normalizePhoneNumber(phoneNumber4));
    });
  });
});