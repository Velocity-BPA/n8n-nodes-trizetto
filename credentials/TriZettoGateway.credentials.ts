/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * TriZetto Gateway Credentials
 * 
 * Supports mutual TLS (mTLS) authentication for TriZetto Gateway
 * services. The Gateway handles secure EDI transaction routing
 * and trading partner connectivity.
 */
export class TriZettoGateway implements ICredentialType {
  name = 'trizettoGateway';
  displayName = 'TriZetto Gateway';
  documentationUrl = 'https://velobpa.com/docs/n8n-nodes-trizetto/gateway';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Gateway URL',
      name: 'gatewayUrl',
      type: 'string',
      default: 'https://gateway.trizetto.com',
      required: true,
      description: 'TriZetto Gateway endpoint URL',
    },
    {
      displayName: 'Partner ID',
      name: 'partnerId',
      type: 'string',
      default: '',
      required: true,
      description: 'Your Trading Partner ID assigned by TriZetto. This identifies your organization in EDI transactions.',
    },
    {
      displayName: 'Certificate',
      name: 'certificate',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 10,
      },
      default: '',
      required: true,
      description: 'Client certificate in PEM format for mTLS authentication. Include the full certificate chain.',
      placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 10,
      },
      default: '',
      required: true,
      description: 'Private key in PEM format for mTLS authentication',
      placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
    },
    {
      displayName: 'Private Key Passphrase',
      name: 'passphrase',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Passphrase for the private key (if encrypted)',
    },
    {
      displayName: 'CA Certificate',
      name: 'caCertificate',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 10,
      },
      default: '',
      description: 'Certificate Authority (CA) certificate in PEM format for server verification',
      placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
    },
    {
      displayName: 'Sender ID',
      name: 'senderId',
      type: 'string',
      default: '',
      description: 'EDI Sender ID (ISA06) for transaction identification. Usually your organization identifier.',
    },
    {
      displayName: 'Receiver ID',
      name: 'receiverId',
      type: 'string',
      default: '',
      description: 'EDI Receiver ID (ISA08) - typically TriZetto\'s identifier',
    },
    {
      displayName: 'Connection Timeout',
      name: 'timeout',
      type: 'number',
      default: 60000,
      description: 'Gateway connection timeout in milliseconds',
    },
  ];
}
