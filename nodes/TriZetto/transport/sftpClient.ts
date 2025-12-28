/**
 * TriZetto SFTP Client - Secure File Transfer Operations
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import { IExecuteFunctions, IDataObject, NodeApiError } from 'n8n-workflow';
import SftpClient from 'ssh2-sftp-client';

/**
 * SFTP Connection configuration
 */
export interface ISftpConfig {
	host: string;
	port: number;
	username: string;
	password?: string;
	privateKey?: string;
	passphrase?: string;
	inboundDirectory: string;
	outboundDirectory: string;
	archiveDirectory: string;
	retryAttempts: number;
	retryDelay: number;
}

/**
 * SFTP File info
 */
export interface ISftpFileInfo {
	name: string;
	path: string;
	type: 'd' | '-' | 'l';
	size: number;
	modifyTime: number;
	accessTime: number;
	owner: number;
	group: number;
	rights: {
		user: string;
		group: string;
		other: string;
	};
}

/**
 * SFTP Transfer result
 */
export interface ISftpTransferResult {
	success: boolean;
	fileName: string;
	remotePath: string;
	localPath?: string;
	size?: number;
	transferTime?: number;
	error?: string;
}

/**
 * TriZetto SFTP Client class
 */
export class TriZettoSftpClient {
	private config: ISftpConfig;
	private client: SftpClient;

	constructor(config: ISftpConfig) {
		this.config = config;
		this.client = new SftpClient();
	}

	/**
	 * Connect to SFTP server
	 */
	async connect(): Promise<void> {
		const connectionConfig: SftpClient.ConnectOptions = {
			host: this.config.host,
			port: this.config.port,
			username: this.config.username,
			readyTimeout: 30000,
			retries: this.config.retryAttempts,
			retry_minTimeout: this.config.retryDelay,
		};

		if (this.config.privateKey) {
			connectionConfig.privateKey = this.config.privateKey;
			if (this.config.passphrase) {
				connectionConfig.passphrase = this.config.passphrase;
			}
		} else if (this.config.password) {
			connectionConfig.password = this.config.password;
		}

		await this.client.connect(connectionConfig);
	}

	/**
	 * Disconnect from SFTP server
	 */
	async disconnect(): Promise<void> {
		await this.client.end();
	}

	/**
	 * Upload file to SFTP server
	 */
	async uploadFile(
		localPath: string | Buffer,
		remotePath?: string,
		fileName?: string
	): Promise<ISftpTransferResult> {
		const startTime = Date.now();

		try {
			const remoteFilePath = remotePath
				? `${remotePath}/${fileName || 'upload.edi'}`
				: `${this.config.outboundDirectory}/${fileName || 'upload.edi'}`;

			// Ensure directory exists
			const remoteDir = remoteFilePath.substring(0, remoteFilePath.lastIndexOf('/'));
			await this.ensureDirectory(remoteDir);

			if (Buffer.isBuffer(localPath)) {
				await this.client.put(localPath, remoteFilePath);
			} else {
				await this.client.fastPut(localPath, remoteFilePath);
			}

			const stats = await this.client.stat(remoteFilePath);

			return {
				success: true,
				fileName: fileName || 'upload.edi',
				remotePath: remoteFilePath,
				size: stats.size,
				transferTime: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				fileName: fileName || 'upload.edi',
				remotePath: remotePath || this.config.outboundDirectory,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Download file from SFTP server
	 */
	async downloadFile(remotePath: string, localPath?: string): Promise<ISftpTransferResult> {
		const startTime = Date.now();
		const fileName = remotePath.split('/').pop() || 'download.edi';

		try {
			let data: Buffer | string;

			if (localPath) {
				await this.client.fastGet(remotePath, localPath);
				data = localPath;
			} else {
				data = (await this.client.get(remotePath)) as Buffer;
			}

			const stats = await this.client.stat(remotePath);

			return {
				success: true,
				fileName,
				remotePath,
				localPath: localPath || undefined,
				size: stats.size,
				transferTime: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				fileName,
				remotePath,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Download file content as buffer
	 */
	async downloadFileContent(remotePath: string): Promise<Buffer> {
		const content = await this.client.get(remotePath);
		if (Buffer.isBuffer(content)) {
			return content;
		}
		return Buffer.from(content as string);
	}

	/**
	 * List files in directory
	 */
	async listFiles(directory?: string, pattern?: string): Promise<ISftpFileInfo[]> {
		const targetDir = directory || this.config.inboundDirectory;
		const files = await this.client.list(targetDir);

		let result = files.map(
			(file): ISftpFileInfo => ({
				name: file.name,
				path: `${targetDir}/${file.name}`,
				type: file.type,
				size: file.size,
				modifyTime: file.modifyTime,
				accessTime: file.accessTime,
				owner: file.owner,
				group: file.group,
				rights: file.rights,
			})
		);

		if (pattern) {
			const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
			result = result.filter((file) => regex.test(file.name));
		}

		return result;
	}

	/**
	 * List inbound files (files received from clearinghouse)
	 */
	async listInboundFiles(pattern?: string): Promise<ISftpFileInfo[]> {
		return this.listFiles(this.config.inboundDirectory, pattern);
	}

	/**
	 * List outbound files (files sent to clearinghouse)
	 */
	async listOutboundFiles(pattern?: string): Promise<ISftpFileInfo[]> {
		return this.listFiles(this.config.outboundDirectory, pattern);
	}

	/**
	 * Check if file exists
	 */
	async fileExists(remotePath: string): Promise<boolean> {
		try {
			await this.client.stat(remotePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get file info
	 */
	async getFileInfo(remotePath: string): Promise<ISftpFileInfo | null> {
		try {
			const stats = await this.client.stat(remotePath);
			const fileName = remotePath.split('/').pop() || '';

			return {
				name: fileName,
				path: remotePath,
				type: stats.isDirectory ? 'd' : '-',
				size: stats.size,
				modifyTime: stats.modifyTime,
				accessTime: stats.accessTime,
				owner: stats.uid,
				group: stats.gid,
				rights: {
					user: '',
					group: '',
					other: '',
				},
			};
		} catch {
			return null;
		}
	}

	/**
	 * Delete file from SFTP server
	 */
	async deleteFile(remotePath: string): Promise<boolean> {
		try {
			await this.client.delete(remotePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Move file to archive directory
	 */
	async archiveFile(remotePath: string): Promise<ISftpTransferResult> {
		const fileName = remotePath.split('/').pop() || '';
		const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
		const archivePath = `${this.config.archiveDirectory}/${timestamp}_${fileName}`;

		try {
			// Ensure archive directory exists
			await this.ensureDirectory(this.config.archiveDirectory);

			// Rename/move file
			await this.client.rename(remotePath, archivePath);

			return {
				success: true,
				fileName,
				remotePath: archivePath,
			};
		} catch (error) {
			return {
				success: false,
				fileName,
				remotePath,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Rename file on SFTP server
	 */
	async renameFile(oldPath: string, newPath: string): Promise<boolean> {
		try {
			await this.client.rename(oldPath, newPath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Create directory on SFTP server
	 */
	async createDirectory(remotePath: string): Promise<boolean> {
		try {
			await this.client.mkdir(remotePath, true);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Ensure directory exists (create if not)
	 */
	async ensureDirectory(remotePath: string): Promise<void> {
		try {
			await this.client.stat(remotePath);
		} catch {
			await this.client.mkdir(remotePath, true);
		}
	}

	/**
	 * Get directory listing
	 */
	async getDirectory(remotePath?: string): Promise<ISftpFileInfo[]> {
		return this.listFiles(remotePath);
	}

	/**
	 * Upload EDI file to outbound directory
	 */
	async uploadEdiFile(content: string | Buffer, fileName: string): Promise<ISftpTransferResult> {
		const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
		return this.uploadFile(buffer, this.config.outboundDirectory, fileName);
	}

	/**
	 * Download all new inbound files
	 */
	async downloadInboundFiles(pattern?: string): Promise<Array<{ file: ISftpFileInfo; content: Buffer }>> {
		const files = await this.listInboundFiles(pattern);
		const results: Array<{ file: ISftpFileInfo; content: Buffer }> = [];

		for (const file of files) {
			if (file.type === '-') {
				const content = await this.downloadFileContent(file.path);
				results.push({ file, content });
			}
		}

		return results;
	}

	/**
	 * Process inbound files (download and archive)
	 */
	async processInboundFiles(
		pattern?: string,
		archive: boolean = true
	): Promise<Array<{ file: ISftpFileInfo; content: Buffer; archived: boolean }>> {
		const files = await this.downloadInboundFiles(pattern);
		const results: Array<{ file: ISftpFileInfo; content: Buffer; archived: boolean }> = [];

		for (const { file, content } of files) {
			let archived = false;
			if (archive) {
				const archiveResult = await this.archiveFile(file.path);
				archived = archiveResult.success;
			}
			results.push({ file, content, archived });
		}

		return results;
	}

	/**
	 * Test SFTP connection
	 */
	async testConnection(): Promise<{ success: boolean; message: string; directories?: object }> {
		try {
			await this.connect();

			// Test directory access
			const directories: Record<string, boolean> = {};

			try {
				await this.client.stat(this.config.inboundDirectory);
				directories.inbound = true;
			} catch {
				directories.inbound = false;
			}

			try {
				await this.client.stat(this.config.outboundDirectory);
				directories.outbound = true;
			} catch {
				directories.outbound = false;
			}

			try {
				await this.client.stat(this.config.archiveDirectory);
				directories.archive = true;
			} catch {
				directories.archive = false;
			}

			await this.disconnect();

			return {
				success: true,
				message: 'SFTP connection successful',
				directories,
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : 'Connection failed',
			};
		}
	}
}

/**
 * Create SFTP client from n8n credentials
 */
export async function createSftpClient(
	executeFunctions: IExecuteFunctions,
	credentialsName: string = 'triZettoSftpApi'
): Promise<TriZettoSftpClient> {
	const credentials = await executeFunctions.getCredentials(credentialsName);

	const config: ISftpConfig = {
		host: credentials.host as string,
		port: credentials.port as number,
		username: credentials.username as string,
		password: credentials.authMethod === 'password' ? (credentials.password as string) : undefined,
		privateKey: credentials.authMethod === 'privateKey' ? (credentials.privateKey as string) : undefined,
		passphrase: credentials.passphrase as string | undefined,
		inboundDirectory: credentials.inboundDirectory as string,
		outboundDirectory: credentials.outboundDirectory as string,
		archiveDirectory: credentials.archiveDirectory as string,
		retryAttempts: credentials.retryAttempts as number,
		retryDelay: credentials.retryDelay as number,
	};

	return new TriZettoSftpClient(config);
}

/**
 * Execute SFTP operation with automatic connect/disconnect
 */
export async function withSftpConnection<T>(
	client: TriZettoSftpClient,
	operation: (client: TriZettoSftpClient) => Promise<T>
): Promise<T> {
	try {
		await client.connect();
		const result = await operation(client);
		return result;
	} finally {
		await client.disconnect();
	}
}

/**
 * Generate unique filename for EDI file
 */
export function generateEdiFileName(transactionType: string, extension: string = 'edi'): string {
	const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
	const random = Math.random().toString(36).substring(2, 8).toUpperCase();
	return `${transactionType}_${timestamp}_${random}.${extension}`;
}

/**
 * Parse EDI filename to extract transaction info
 */
export function parseEdiFileName(fileName: string): {
	transactionType?: string;
	timestamp?: string;
	identifier?: string;
	extension?: string;
} {
	const parts = fileName.split('.');
	const extension = parts.pop();
	const baseName = parts.join('.');

	// Common patterns:
	// TYPE_YYYYMMDDHHMMSS_ID.edi
	// TYPE_YYYYMMDD_ID.edi
	// ID.TYPE.edi
	const underscoreParts = baseName.split('_');

	if (underscoreParts.length >= 2) {
		return {
			transactionType: underscoreParts[0],
			timestamp: underscoreParts[1],
			identifier: underscoreParts[2],
			extension,
		};
	}

	const dotParts = baseName.split('.');
	if (dotParts.length >= 2) {
		return {
			identifier: dotParts[0],
			transactionType: dotParts[1],
			extension,
		};
	}

	return {
		identifier: baseName,
		extension,
	};
}

export default {
	TriZettoSftpClient,
	createSftpClient,
	withSftpConnection,
	generateEdiFileName,
	parseEdiFileName,
};
