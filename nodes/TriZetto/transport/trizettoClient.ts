/**
 * TriZetto REST API Client
 * 
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	NodeApiError,
} from 'n8n-workflow';
import { ENVIRONMENTS, API_VERSION, ENDPOINTS } from '../constants/endpoints';

export interface ITriZettoApiCredentials {
	environment: 'production' | 'staging' | 'custom';
	customUrl?: string;
	username: string;
	password: string;
	clientId: string;
	clientSecret: string;
	submitterId: string;
	siteId?: string;
	vendorId?: string;
}

export interface IApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
	meta?: {
		requestId: string;
		timestamp: string;
		pagination?: {
			page: number;
			pageSize: number;
			totalPages: number;
			totalRecords: number;
		};
	};
}

interface TokenCache {
	accessToken: string;
	expiresAt: number;
}

// Token cache per credential set (keyed by clientId)
const tokenCache: Map<string, TokenCache> = new Map();

/**
 * Get the base URL for API requests based on environment
 */
export function getBaseUrl(credentials: ITriZettoApiCredentials): string {
	if (credentials.environment === 'custom' && credentials.customUrl) {
		return credentials.customUrl.replace(/\/$/, '');
	}
	return ENVIRONMENTS[credentials.environment] || ENVIRONMENTS.production;
}

/**
 * Get OAuth2 access token with caching
 */
async function getAccessToken(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	credentials: ITriZettoApiCredentials,
): Promise<string> {
	const cacheKey = credentials.clientId;
	const cached = tokenCache.get(cacheKey);
	
	// Return cached token if still valid (with 60-second buffer)
	if (cached && cached.expiresAt > Date.now() + 60000) {
		return cached.accessToken;
	}
	
	const baseUrl = getBaseUrl(credentials);
	
	const options: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: `${baseUrl}${ENDPOINTS.auth.token}`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			grant_type: 'password',
			client_id: credentials.clientId,
			client_secret: credentials.clientSecret,
			username: credentials.username,
			password: credentials.password,
			scope: 'openid profile healthcare',
		}).toString(),
		json: false,
	};
	
	try {
		const response = await this.helpers.httpRequest(options);
		const tokenData = typeof response === 'string' ? JSON.parse(response) : response;
		
		const accessToken = tokenData.access_token;
		const expiresIn = tokenData.expires_in || 3600;
		
		// Cache the token
		tokenCache.set(cacheKey, {
			accessToken,
			expiresAt: Date.now() + expiresIn * 1000,
		});
		
		return accessToken;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as Error, {
			message: 'Failed to obtain access token from TriZetto',
		});
	}
}

/**
 * Make an authenticated API request to TriZetto
 */
export async function trizettoApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: object,
	query?: Record<string, string | number | boolean>,
	options: {
		returnFullResponse?: boolean;
		skipAuth?: boolean;
		customHeaders?: Record<string, string>;
	} = {},
): Promise<unknown> {
	const credentials = await this.getCredentials('trizettoApi') as unknown as ITriZettoApiCredentials;
	const baseUrl = getBaseUrl(credentials);
	
	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${API_VERSION}${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'X-Submitter-ID': credentials.submitterId,
			...(credentials.siteId && { 'X-Site-ID': credentials.siteId }),
			...(credentials.vendorId && { 'X-Vendor-ID': credentials.vendorId }),
			...options.customHeaders,
		},
		json: true,
	};
	
	// Add authentication header unless skipped
	if (!options.skipAuth) {
		const accessToken = await getAccessToken.call(this, credentials);
		requestOptions.headers!['Authorization'] = `Bearer ${accessToken}`;
	}
	
	// Add query parameters
	if (query && Object.keys(query).length > 0) {
		requestOptions.qs = query;
	}
	
	// Add request body
	if (body && Object.keys(body).length > 0) {
		requestOptions.body = body;
	}
	
	try {
		const response = await this.helpers.httpRequest(requestOptions);
		
		if (options.returnFullResponse) {
			return response;
		}
		
		// Handle standardized API response format
		if (response && typeof response === 'object' && 'data' in response) {
			return response.data;
		}
		
		return response;
	} catch (error: unknown) {
		const err = error as { response?: { body?: { error?: { message?: string; code?: string } }; status?: number }; message?: string };
		
		// Parse TriZetto-specific error responses
		if (err.response?.body?.error) {
			const apiError = err.response.body.error;
			throw new NodeApiError(this.getNode(), error as Error, {
				message: apiError.message || 'TriZetto API Error',
				description: `Error Code: ${apiError.code || 'UNKNOWN'}`,
			});
		}
		
		// Handle HTTP status codes
		if (err.response?.status) {
			const status = err.response.status;
			let message = 'TriZetto API Error';
			
			switch (status) {
				case 400:
					message = 'Bad Request - Invalid parameters or malformed request';
					break;
				case 401:
					message = 'Unauthorized - Invalid or expired credentials';
					// Clear cached token on auth failure
					tokenCache.delete(credentials.clientId);
					break;
				case 403:
					message = 'Forbidden - Insufficient permissions for this operation';
					break;
				case 404:
					message = 'Not Found - Resource does not exist';
					break;
				case 409:
					message = 'Conflict - Resource already exists or version mismatch';
					break;
				case 422:
					message = 'Unprocessable Entity - Validation failed';
					break;
				case 429:
					message = 'Rate Limited - Too many requests, please retry later';
					break;
				case 500:
					message = 'Internal Server Error - TriZetto service unavailable';
					break;
				case 503:
					message = 'Service Unavailable - TriZetto is temporarily down';
					break;
			}
			
			throw new NodeApiError(this.getNode(), error as Error, { message });
		}
		
		throw new NodeApiError(this.getNode(), error as Error);
	}
}

/**
 * Make a paginated API request and return all results
 */
export async function trizettoApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: object,
	query: Record<string, string | number | boolean> = {},
	propertyName = 'items',
): Promise<unknown[]> {
	const allItems: unknown[] = [];
	let page = 1;
	const pageSize = 100;
	let hasMore = true;
	
	while (hasMore) {
		const response = await trizettoApiRequest.call(
			this,
			method,
			endpoint,
			body,
			{ ...query, page, pageSize },
			{ returnFullResponse: true },
		) as IApiResponse;
		
		const items = response.data as Record<string, unknown>;
		if (items && items[propertyName]) {
			allItems.push(...(items[propertyName] as unknown[]));
		}
		
		// Check pagination metadata
		const pagination = response.meta?.pagination;
		if (pagination) {
			hasMore = page < pagination.totalPages;
			page++;
		} else {
			// No pagination info, assume single page
			hasMore = false;
		}
		
		// Safety limit to prevent infinite loops
		if (page > 1000) {
			break;
		}
	}
	
	return allItems;
}

/**
 * Test API connectivity
 */
export async function testConnection(
	this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<{ success: boolean; message: string }> {
	try {
		await trizettoApiRequest.call(this, 'GET', ENDPOINTS.utility.status);
		return { success: true, message: 'Connection successful' };
	} catch (error) {
		return { 
			success: false, 
			message: `Connection failed: ${(error as Error).message}` 
		};
	}
}

/**
 * Format healthcare-specific identifiers (NPI, Tax ID, etc.)
 */
export function formatIdentifier(type: string, value: string): string {
	switch (type) {
		case 'npi':
			// NPI is 10 digits
			return value.replace(/\D/g, '').padStart(10, '0').slice(0, 10);
		case 'taxId':
			// Tax ID is 9 digits
			return value.replace(/\D/g, '').slice(0, 9);
		case 'memberId':
			// Remove spaces, uppercase
			return value.replace(/\s/g, '').toUpperCase();
		default:
			return value;
	}
}

/**
 * Build HIPAA-compliant audit log entry (no PHI)
 */
export function buildAuditEntry(
	operation: string,
	resource: string,
	transactionId?: string,
): Record<string, unknown> {
	return {
		timestamp: new Date().toISOString(),
		operation,
		resource,
		transactionId: transactionId || `TXN-${Date.now()}`,
		// Note: Never include PHI in audit logs
	};
}
