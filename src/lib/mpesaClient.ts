import { Client, Configuration, Environment } from '../../mpesa-js-sdk/src/index.js';

const config = new Configuration({
  host: process.env.MPESA_API_HOST || 'https://sandbox.safaricom.co.ke',
  apiKey: process.env.MPESA_API_KEY || '',
  publicKey: process.env.MPESA_PUBLIC_KEY || '',
  // Add other necessary configuration parameters here
  // e.g. serviceProviderCode, initiatorIdentifier, securityCredential, etc.
  debugging: true,
  environment: Environment.SANDBOX,
});

const mpesaClient = new Client(config);

export default mpesaClient;
