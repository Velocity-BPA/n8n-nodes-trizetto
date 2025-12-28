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
 * TriZetto SFTP Credentials
 * 
 * Supports secure file transfer for batch EDI transactions
 * with TriZetto's SFTP servers. Used for bulk claims submission,
 * ERA retrieval, and batch acknowledgment processing.
 */
export class TriZettoSftp implements ICredentialType {
  name = 'trizettoSftp';
  displayName = 'TriZetto SFTP';
  documentationUrl = 'https://velobpa.com/docs/n8n-nodes-trizetto/sftp';
  
  properties: INodeProperties[] = [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: 'sftp.trizetto.com',
      required: true,
      description: 'SFTP server hostname',
    },
    {
      displayName: 'Port',
      name: 'port',
      type: 'number',
      default: 22,
      required: true,
      description: 'SFTP server port',
    },
    {
      displayName: 'Username',
      name: 'username',
      type: 'string',
      default: '',
      required: true,
      description: 'SFTP username provided by TriZetto',
    },
    {
      displayName: 'Authentication Type',
      name: 'authType',
      type: 'options',
      options: [
        {
          name: 'Password',
          value: 'password',
        },
        {
          name: 'SSH Key',
          value: 'sshKey',
        },
        {
          name: 'SSH Key + Password',
          value: 'sshKeyPassword',
        },
      ],
      default: 'password',
      description: 'Authentication method for SFTP connection',
    },
    {
      displayName: 'Password',
      name: 'password',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'SFTP password',
      displayOptions: {
        show: {
          authType: ['password', 'sshKeyPassword'],
        },
      },
    },
    {
      displayName: 'SSH Private Key',
      name: 'sshKey',
      type: 'string',
      typeOptions: {
        password: true,
        rows: 10,
      },
      default: '',
      description: 'SSH private key in PEM format',
      placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----',
      displayOptions: {
        show: {
          authType: ['sshKey', 'sshKeyPassword'],
        },
      },
    },
    {
      displayName: 'SSH Key Passphrase',
      name: 'sshKeyPassphrase',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Passphrase for the SSH private key (if encrypted)',
      displayOptions: {
        show: {
          authType: ['sshKey', 'sshKeyPassword'],
        },
      },
    },
    {
      displayName: 'Inbound Directory',
      name: 'inboundDir',
      type: 'string',
      default: '/inbound',
      description: 'Directory path for uploading files to TriZetto (claims, batches)',
    },
    {
      displayName: 'Outbound Directory',
      name: 'outboundDir',
      type: 'string',
      default: '/outbound',
      description: 'Directory path for downloading files from TriZetto (ERAs, acknowledgments)',
    },
    {
      displayName: 'Archive Directory',
      name: 'archiveDir',
      type: 'string',
      default: '/archive',
      description: 'Directory path for archived/processed files',
    },
    {
      displayName: 'Connection Timeout',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'SFTP connection timeout in milliseconds',
    },
    {
      displayName: 'Retry Attempts',
      name: 'retryAttempts',
      type: 'number',
      default: 3,
      description: 'Number of retry attempts for failed transfers',
    },
  ];
}
