/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * TriZetto API Credentials
 * 
 * Supports authentication to TriZetto's REST and SOAP APIs
 * for healthcare transaction processing including eligibility,
 * claims, remittance, and prior authorization services.
 */
export class TriZettoApi implements ICredentialType {
  name = 'trizettoApi';
  displayName = 'TriZetto API';
  documentationUrl = 'https://velobpa.com/docs/n8n-nodes-trizetto';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Production',
          value: 'production',
        },
        {
          name: 'Test/Staging',
          value: 'staging',
        },
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      default: 'staging',
      description: 'The TriZetto environment to connect to',
    },
    {
      displayName: 'Custom API URL',
      name: 'customUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.trizetto.com/v1',
      description: 'Custom API endpoint URL (required when Environment is Custom)',
      displayOptions: {
        show: {
          environment: ['custom'],
        },
      },
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
      description: 'TriZetto API username',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'TriZetto API password',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      default: '',
      required: true,
      description: 'OAuth 2.0 Client ID for API access',
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'OAuth 2.0 Client Secret for API access',
    },
    {
      displayName: 'Submitter ID',
      name: 'submitterId',
      type: 'string',
      default: '',
      required: true,
      description: 'Your organization\'s Submitter ID assigned by TriZetto. This identifies your organization for EDI transactions.',
    },
    {
      displayName: 'Site ID',
      name: 'siteId',
      type: 'string',
      default: '',
      description: 'Optional Site ID for multi-site organizations. Used to route transactions to specific locations.',
    },
    {
      displayName: 'Vendor ID',
      name: 'vendorId',
      type: 'string',
      default: '',
      description: 'Optional Vendor ID if using a third-party integration. Required for some trading partner connections.',
    },
    {
      displayName: 'Request Timeout',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'API request timeout in milliseconds',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.environment === "production" ? "https://api.trizetto.com/v1" : $credentials.environment === "staging" ? "https://api-staging.trizetto.com/v1" : $credentials.customUrl}}',
      url: '/health',
      method: 'GET',
    },
  };
}
