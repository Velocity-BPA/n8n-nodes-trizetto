/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import {
	TriZettoSftpClient,
	createSftpClient,
	withSftpConnection,
	generateEdiFileName,
	parseEdiFileName,
} from '../../transport/sftpClient';
import { createSafeLogEntry } from '../../utils/hipaaUtils';

/**
 * SFTP Resource
 * 
 * Handles secure file transfer operations with TriZetto's clearinghouse.
 * Used for batch EDI file submission and retrieval.
 */

export const sftpOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['sftp'],
			},
		},
		options: [
			{
				name: 'Upload File',
				value: 'uploadFile',
				description: 'Upload an EDI file to the clearinghouse',
				action: 'Upload file',
			},
			{
				name: 'Download File',
				value: 'downloadFile',
				description: 'Download a file from the clearinghouse',
				action: 'Download file',
			},
			{
				name: 'List Files',
				value: 'listFiles',
				description: 'List files in a directory',
				action: 'List files',
			},
			{
				name: 'Get File Status',
				value: 'getFileStatus',
				description: 'Get status information about a file',
				action: 'Get file status',
			},
			{
				name: 'Delete File',
				value: 'deleteFile',
				description: 'Delete a file from the clearinghouse',
				action: 'Delete file',
			},
			{
				name: 'Get Directory',
				value: 'getDirectory',
				description: 'Get directory listing with details',
				action: 'Get directory',
			},
			{
				name: 'Archive File',
				value: 'archiveFile',
				description: 'Move a file to the archive directory',
				action: 'Archive file',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test SFTP connection to the clearinghouse',
				action: 'Test connection',
			},
		],
		default: 'uploadFile',
	},
];

export const sftpFields: INodeProperties[] = [
	// Upload File fields
	{
		displayName: 'File Content',
		name: 'fileContent',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['uploadFile'],
			},
		},
		default: '',
		description: 'The EDI file content to upload',
	},
	{
		displayName: 'Remote Path',
		name: 'remotePath',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['uploadFile', 'downloadFile', 'deleteFile', 'getFileStatus', 'archiveFile'],
			},
		},
		default: '',
		placeholder: '/outbound/claim_837p_20240115.edi',
		description: 'The remote file path',
	},
	{
		displayName: 'Transaction Type',
		name: 'transactionType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['uploadFile'],
			},
		},
		options: [
			{ name: '270 - Eligibility Inquiry', value: '270' },
			{ name: '276 - Claim Status Inquiry', value: '276' },
			{ name: '837P - Professional Claim', value: '837P' },
			{ name: '837I - Institutional Claim', value: '837I' },
			{ name: '837D - Dental Claim', value: '837D' },
			{ name: '278 - Prior Authorization', value: '278' },
			{ name: '275 - Attachment', value: '275' },
			{ name: 'Other', value: 'OTHER' },
		],
		default: '837P',
		description: 'The type of EDI transaction in the file',
	},
	{
		displayName: 'Auto-Generate Filename',
		name: 'autoGenerateFilename',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['uploadFile'],
			},
		},
		default: true,
		description: 'Whether to automatically generate a unique filename based on transaction type and timestamp',
	},

	// Download File fields
	{
		displayName: 'Return Binary',
		name: 'returnBinary',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['downloadFile'],
			},
		},
		default: false,
		description: 'Whether to return file as binary data instead of text',
	},

	// List Files fields
	{
		displayName: 'Directory',
		name: 'directory',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['listFiles', 'getDirectory'],
			},
		},
		options: [
			{ name: 'Inbound (Responses)', value: 'inbound' },
			{ name: 'Outbound (Submissions)', value: 'outbound' },
			{ name: 'Archive', value: 'archive' },
			{ name: 'Custom Path', value: 'custom' },
		],
		default: 'inbound',
		description: 'The directory to list files from',
	},
	{
		displayName: 'Custom Directory Path',
		name: 'customDirectory',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['listFiles', 'getDirectory'],
				directory: ['custom'],
			},
		},
		default: '',
		placeholder: '/custom/path',
		description: 'Custom directory path to list',
	},
	{
		displayName: 'File Pattern',
		name: 'filePattern',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['listFiles'],
			},
		},
		default: '*.edi',
		description: 'File pattern to filter (e.g., *.edi, 837*.txt)',
	},

	// Archive fields
	{
		displayName: 'Archive Directory',
		name: 'archiveDirectory',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['archiveFile'],
			},
		},
		default: '/archive',
		description: 'Directory to move archived files to',
	},

	// Additional options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['sftp'],
				operation: ['uploadFile', 'downloadFile', 'listFiles'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Create Directory If Missing',
				name: 'createDirectory',
				type: 'boolean',
				default: true,
				description: 'Whether to create the directory if it does not exist',
			},
			{
				displayName: 'Overwrite Existing',
				name: 'overwrite',
				type: 'boolean',
				default: false,
				description: 'Whether to overwrite existing files',
			},
			{
				displayName: 'Include Hidden Files',
				name: 'includeHidden',
				type: 'boolean',
				default: false,
				description: 'Whether to include hidden files in listings',
			},
			{
				displayName: 'Retry Count',
				name: 'retryCount',
				type: 'number',
				default: 3,
				description: 'Number of retry attempts on failure',
			},
		],
	},
];

/**
 * Execute SFTP operations
 */
export async function executeSftpOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('triZettoSftp');

	const sftpConfig = {
		host: credentials.host as string,
		port: (credentials.port as number) || 22,
		username: credentials.username as string,
		password: credentials.password as string | undefined,
		privateKey: credentials.privateKey as string | undefined,
		passphrase: credentials.passphrase as string | undefined,
		directories: {
			inbound: (credentials.inboundDirectory as string) || '/inbound',
			outbound: (credentials.outboundDirectory as string) || '/outbound',
			archive: (credentials.archiveDirectory as string) || '/archive',
		},
	};

	const client = new TriZettoSftpClient(sftpConfig);

	try {
		await client.connect();

		switch (operation) {
			case 'uploadFile': {
				const fileContent = this.getNodeParameter('fileContent', index) as string;
				const transactionType = this.getNodeParameter('transactionType', index) as string;
				const autoGenerateFilename = this.getNodeParameter('autoGenerateFilename', index) as boolean;
				let remotePath = this.getNodeParameter('remotePath', index) as string;

				if (autoGenerateFilename) {
					remotePath = `${sftpConfig.directories.outbound}/${generateEdiFileName(transactionType)}`;
				}

				const result = await client.uploadFile(remotePath, Buffer.from(fileContent, 'utf8'));

				return [
					{
						json: {
							success: true,
							operation: 'uploadFile',
							remotePath,
							fileName: remotePath.split('/').pop(),
							transactionType,
							fileSize: fileContent.length,
							uploadedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'downloadFile': {
				const remotePath = this.getNodeParameter('remotePath', index) as string;
				const returnBinary = this.getNodeParameter('returnBinary', index) as boolean;

				const content = await client.downloadFileContent(remotePath);
				const fileName = remotePath.split('/').pop() || 'download';
				const parsedName = parseEdiFileName(fileName);

				if (returnBinary) {
					return [
						{
							json: {
								success: true,
								operation: 'downloadFile',
								remotePath,
								fileName,
								...parsedName,
							},
							binary: {
								data: await this.helpers.prepareBinaryData(
									Buffer.from(content, 'utf8'),
									fileName,
								),
							},
						},
					];
				}

				return [
					{
						json: {
							success: true,
							operation: 'downloadFile',
							remotePath,
							fileName,
							content,
							fileSize: content.length,
							...parsedName,
						},
					},
				];
			}

			case 'listFiles': {
				const directory = this.getNodeParameter('directory', index) as string;
				let directoryPath: string;

				if (directory === 'custom') {
					directoryPath = this.getNodeParameter('customDirectory', index) as string;
				} else {
					directoryPath = sftpConfig.directories[directory as keyof typeof sftpConfig.directories] || directory;
				}

				const filePattern = this.getNodeParameter('filePattern', index, '*.edi') as string;
				const files = await client.listFiles(directoryPath);

				// Filter by pattern
				const pattern = filePattern.replace(/\*/g, '.*').replace(/\?/g, '.');
				const regex = new RegExp(`^${pattern}$`, 'i');
				const filteredFiles = files.filter((f) => regex.test(f.name));

				return filteredFiles.map((file) => ({
					json: {
						name: file.name,
						size: file.size,
						modifyTime: file.modifyTime,
						accessTime: file.accessTime,
						type: file.type,
						path: `${directoryPath}/${file.name}`,
						...parseEdiFileName(file.name),
					},
				}));
			}

			case 'getFileStatus': {
				const remotePath = this.getNodeParameter('remotePath', index) as string;
				const fileInfo = await client.getFileInfo(remotePath);

				return [
					{
						json: {
							success: true,
							operation: 'getFileStatus',
							remotePath,
							exists: true,
							...fileInfo,
							...parseEdiFileName(remotePath.split('/').pop() || ''),
						},
					},
				];
			}

			case 'deleteFile': {
				const remotePath = this.getNodeParameter('remotePath', index) as string;
				await client.deleteFile(remotePath);

				return [
					{
						json: {
							success: true,
							operation: 'deleteFile',
							remotePath,
							deletedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'getDirectory': {
				const directory = this.getNodeParameter('directory', index) as string;
				let directoryPath: string;

				if (directory === 'custom') {
					directoryPath = this.getNodeParameter('customDirectory', index) as string;
				} else {
					directoryPath = sftpConfig.directories[directory as keyof typeof sftpConfig.directories] || directory;
				}

				const files = await client.listFiles(directoryPath);

				const fileCount = files.filter((f) => f.type === '-').length;
				const dirCount = files.filter((f) => f.type === 'd').length;
				const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

				return [
					{
						json: {
							success: true,
							operation: 'getDirectory',
							path: directoryPath,
							fileCount,
							directoryCount: dirCount,
							totalSize,
							files: files.map((f) => ({
								name: f.name,
								size: f.size,
								type: f.type,
								modifyTime: f.modifyTime,
							})),
						},
					},
				];
			}

			case 'archiveFile': {
				const remotePath = this.getNodeParameter('remotePath', index) as string;
				const archiveDirectory = this.getNodeParameter('archiveDirectory', index) as string;

				const fileName = remotePath.split('/').pop() || '';
				const archivePath = await client.archiveFile(remotePath, archiveDirectory);

				return [
					{
						json: {
							success: true,
							operation: 'archiveFile',
							originalPath: remotePath,
							archivePath,
							fileName,
							archivedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'testConnection': {
				const isConnected = await client.testConnection();

				return [
					{
						json: {
							success: isConnected,
							operation: 'testConnection',
							host: sftpConfig.host,
							port: sftpConfig.port,
							username: sftpConfig.username,
							directories: sftpConfig.directories,
							testedAt: new Date().toISOString(),
						},
					},
				];
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}
	} catch (error) {
		const safeError = createSafeLogEntry('SFTP operation failed', {
			operation,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw new NodeOperationError(this.getNode(), safeError.message);
	} finally {
		await client.disconnect();
	}
}
