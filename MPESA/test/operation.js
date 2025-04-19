import assert from 'assert';
import { Operation } from '../src/operation.js';

describe('Operation', function () {
  describe('#constructor', function () {
    it('should create an operation with required properties', function () {
      const operation = new Operation({
        name: 'B2C_PAYMENT',
        method: 'POST',
        port: '18345',
        path: '/ipg/v1x/b2cPayment/',
        mapping: {
          to: 'input_CustomerMSISDN',
          from: 'input_ServiceProviderCode',
          amount: 'input_Amount',
          transaction: 'input_TransactionReference',
          reference: 'input_ThirdPartyReference',
        },
        validation: {
          from: /^[0-9]{5,6}$/,
          to: /^((00|\+)?254)?7([0-9]{8})$/,
          amount: /^[1-9][0-9]*(\.[0-9]+)?$/,
          transaction: /^\w+$/,
          reference: /^\w+$/,
        },
        required: ['to', 'from', 'amount', 'transaction', 'reference'],
        optional: ['from'],
      });

      assert.equal(operation.name, 'B2C_PAYMENT');
      assert.equal(operation.method, 'POST');
      assert.equal(operation.port, '18345');
      assert.equal(operation.path, '/ipg/v1x/b2cPayment/');
      assert.deepEqual(operation.mapping, {
        to: 'input_CustomerMSISDN',
        from: 'input_ServiceProviderCode',
        amount: 'input_Amount',
        transaction: 'input_TransactionReference',
        reference: 'input_ThirdPartyReference',
      });
      assert.deepEqual(operation.validation, {
        from: /^[0-9]{5,6}$/,
        to: /^((00|\+)?254)?7([0-9]{8})$/,
        amount: /^[1-9][0-9]*(\.[0-9]+)?$/,
        transaction: /^\w+$/,
        reference: /^\w+$/,
      });
      assert.deepEqual(operation.required, ['to', 'from', 'amount', 'transaction', 'reference']);
      assert.deepEqual(operation.optional, ['from']);
    });
  });

  describe('#toURL', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
    });

    it('should generate the correct URL path with port', function () {
      assert.equal(operation.toURL(), ':18345/ipg/v1x/b2cPayment/');
    });
  });

  describe('#isValid', function () {
    it('should return true for a valid operation', function () {
      const operation = new Operation({
        name: 'B2C_PAYMENT',
        method: 'POST',
        port: '18345',
        path: '/ipg/v1x/b2cPayment/',
      });
      assert.equal(operation.isValid(), true);
    });

    it('should return false for an invalid operation', function () {
      const operation = new Operation({
        name: 'B2C_PAYMENT',
        method: 'POST',
      });
      assert.equal(operation.isValid(), false);
    });
  });

  describe('#buildRequestBody', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
      mapping: {
        to: 'input_CustomerMSISDN',
        from: 'input_ServiceProviderCode',
        amount: 'input_Amount',
        transaction: 'input_TransactionReference',
        reference: 'input_ThirdPartyReference',
      },
    });

    it('should correctly map transaction data to API parameters', function () {
      const intent = {
        to: '712345678',
        from: '123456',
        amount: '10',
        transaction: 'T12345',
        reference: 'REF12345',
      };

      const requestBody = operation.buildRequestBody('B2C_PAYMENT', intent);
      assert.deepEqual(requestBody, {
        input_CustomerMSISDN: '254712345678',
        input_ServiceProviderCode: '123456',
        input_Amount: '10',
        input_TransactionReference: 'T12345',
        input_ThirdPartyReference: 'REF12345',
      });
    });
  });

  describe('#buildRequestHeaders', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
    });

    it('should generate the correct headers for the request', function () {
      const headers = operation.buildRequestHeaders('B2C_PAYMENT', {
        userAgent: 'MPesa/0.1.0',
        origin: '*',
        authorization: 'Bearer some_token',
      });
      assert.deepEqual(headers, {
        'User-Agent': 'MPesa/0.1.0',
        Origin: '*',
        Authorization: 'Bearer some_token',
        'Content-Type': 'application/json',
      });
    });
  });

  describe('#detectErrors', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
      validation: {
        from: /^[0-9]{5,6}$/,
        to: /^((00|\+)?254)?7([0-9]{8})$/,
        amount: /^[1-9][0-9]*(\.[0-9]+)?$/,
        transaction: /^\w+$/,
        reference: /^\w+$/,
      },
      required: ['to', 'from', 'amount', 'transaction', 'reference'],
    });

    it('should detect validation errors in transaction data', function () {
      const intent = {
        to: 'invalid_number',
        from: '12345',
        amount: '10',
        transaction: 'T12345',
        reference: 'REF12345',
      };

      const errors = operation.detectErrors('B2C_PAYMENT', intent);
      assert.deepEqual(errors, ['to']);
    });
  });

  describe('#detectMissingProperties', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
      required: ['to', 'from', 'amount', 'transaction', 'reference'],
    });

    it('should detect missing required properties in transaction data', function () {
      const intent = {
        from: '123456',
        amount: '10',
        transaction: 'T12345',
        reference: 'REF12345',
      };

      const missing = operation.detectMissingProperties('B2C_PAYMENT', intent);
      assert.deepEqual(missing, ['to']);
    });
  });

  describe('#fillOptionalProperties', function () {
    const operation = new Operation({
      name: 'B2C_PAYMENT',
      method: 'POST',
      port: '18345',
      path: '/ipg/v1x/b2cPayment/',
      optional: ['from'],
    });

    it('should fill optional properties from configuration data', function () {
      const intent = {
        to: '712345678',
        amount: '10',
        transaction: 'T12345',
        reference: 'REF12345',
      };

      const filledIntent = operation.fillOptionalProperties('B2C_PAYMENT', intent, {
        serviceProviderCode: '123456',
      });
      assert.deepEqual(filledIntent, {
        to: '712345678',
        from: '123456',
        amount: '10',
        transaction: 'T12345',
        reference: 'REF12345',
      });
    });
  });

  describe('#normalizePhoneNumber', function () {
    it('should normalize Kenyan phone numbers to E.164 format', function () {
      const operation = new Operation({
        name: 'B2C_PAYMENT',
        method: 'POST',
        port: '18345',
        path: '/ipg/v1x/b2cPayment/',
      });

      assert.equal(operation.normalizePhoneNumber('712345678'), '254712345678');
      assert.equal(operation.normalizePhoneNumber('+254712345678'), '254712345678');
      assert.equal(operation.normalizePhoneNumber('0712345678'), '254712345678');
      assert.equal(operation.normalizePhoneNumber('00254712345678'), '254712345678');
    });
  });
});