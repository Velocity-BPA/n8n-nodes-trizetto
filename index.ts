/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * n8n-nodes-trizetto
 * 
 * A comprehensive n8n community node for TriZetto healthcare platform
 * providing eligibility verification, claims processing, remittance advice,
 * prior authorization, and EDI transaction management.
 */

// Credential exports
export * from './credentials/TriZettoApi.credentials';
export * from './credentials/TriZettoGateway.credentials';
export * from './credentials/TriZettoSftp.credentials';

// Node exports
export * from './nodes/TriZetto/TriZetto.node';
export * from './nodes/TriZetto/TriZettoTrigger.node';

// Log licensing notice (non-blocking, informational only)
const hasLoggedLicenseNotice = Symbol.for('n8n-nodes-trizetto.licenseNotice');
if (!(global as Record<symbol, boolean>)[hasLoggedLicenseNotice]) {
  console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
  (global as Record<symbol, boolean>)[hasLoggedLicenseNotice] = true;
}
