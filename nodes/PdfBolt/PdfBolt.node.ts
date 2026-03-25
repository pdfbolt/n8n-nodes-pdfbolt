import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { pdfBoltApiRequest, buildRequestBody } from './GenericFunctions';
import { convertHtmlFields } from './descriptions/ConvertHtmlDescription';
import { convertUrlFields } from './descriptions/ConvertUrlDescription';
import { convertTemplateFields } from './descriptions/ConvertTemplateDescription';
import { sharedOptions } from './descriptions/SharedOptions';

export class PdfBolt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PDFBolt',
		name: 'pdfBolt',
		icon: 'file:pdfbolt.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{{"convertHtml":"HTML to PDF","convertUrl":"URL to PDF","convertTemplate":"Template to PDF","getUsage":"Get Usage"}[$parameter["operation"]]}}',
		description: 'Generate PDFs from HTML, URLs, and templates with PDFBolt API',
		defaults: {
			name: 'PDFBolt',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pdfBoltApi',
				required: true,
			},
		],
		properties: [
			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'convertHtml',
				options: [
					{
						name: 'Convert HTML to PDF',
						value: 'convertHtml',
						action: 'Convert HTML to PDF',
						description: 'Paste your HTML code and get a PDF file',
					},
					{
						name: 'Convert Template to PDF',
						value: 'convertTemplate',
						action: 'Convert template to PDF',
						description: 'Use a PDFBolt template with your JSON data to generate a PDF',
					},
					{
						name: 'Convert URL to PDF',
						value: 'convertUrl',
						action: 'Convert URL to PDF',
						description: 'Enter a webpage URL and get a PDF of that page',
					},
					{
						name: 'Get Usage',
						value: 'getUsage',
						action: 'Get API usage',
						description: 'Check your plan, remaining conversions, and expiry date',
					},
				],
			},

			// Endpoint Type (visible for convert operations)
			{
				displayName: 'Endpoint',
				name: 'endpointType',
				type: 'options',
				default: 'direct',
				options: [
					{
						name: 'Direct (PDF in Response)',
						value: 'direct',
						description: 'Get the PDF file immediately in the response. The simplest option',
					},
					{
						name: 'Sync (PDF via URL)',
						value: 'sync',
						description: 'Get a download URL for the PDF (valid 24h) with conversion details',
					},
					{
						name: 'Async (PDF via Webhook)',
						value: 'async',
						description: 'Convert in the background and send the result to your webhook when ready. Best for large volumes',
					},
				],
				displayOptions: {
					show: {
						operation: ['convertHtml', 'convertUrl', 'convertTemplate'],
					},
				},
			},

			// Per-operation fields
			...convertHtmlFields,
			...convertUrlFields,
			...convertTemplateFields,

			// Endpoint-specific fields
			{
				displayName: 'Webhook URL',
				name: 'webhook',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://your-app.com/webhook',
				description: 'Publicly accessible URL to receive the result when conversion completes. <a href="https://pdfbolt.com/docs/api-endpoints/async#webhook" target="_blank">Learn&nbsp;more</a>',
				displayOptions: {
					show: {
						operation: ['convertHtml', 'convertUrl', 'convertTemplate'],
						endpointType: ['async'],
					},
				},
			},
			{
				displayName: 'Custom S3 Presigned URL',
				name: 'customS3PresignedUrl',
				type: 'string',
				default: '',
				placeholder: 'https://s3-your-bucket.com?token=abcdef',
				description: 'Presigned URL for uploading the PDF directly to your own S3 bucket. If not set, PDFs are stored in PDFBolt S3 for 24 hours. <a href="https://pdfbolt.com/docs/s3-bucket-upload" target="_blank">Learn&nbsp;more</a>',
				displayOptions: {
					show: {
						operation: ['convertHtml', 'convertUrl', 'convertTemplate'],
						endpointType: ['sync', 'async'],
					},
				},
			},
			{
				displayName: 'Retry Delays (Minutes)',
				name: 'retryDelays',
				type: 'string',
				default: '',
				placeholder: '1,5,15',
				description: 'Comma-separated retry delays in minutes for failed conversions, in strictly ascending order (e.g. 1,5,15). Max 5 values, integers only, max 1440 per value. Webhook is sent only on final success or failure. <a href="https://pdfbolt.com/docs/api-endpoints/async#retrydelays" target="_blank">Learn&nbsp;more</a>',
				displayOptions: {
					show: {
						operation: ['convertHtml', 'convertUrl', 'convertTemplate'],
						endpointType: ['async'],
					},
				},
			},
			{
				displayName: 'Additional Webhook Headers',
				name: 'additionalWebhookHeaders',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				placeholder: 'Add Header',
				options: [
					{
						name: 'values',
						displayName: 'Header',
						values: [
							{
								displayName: 'Key',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
				displayOptions: {
					show: {
						operation: ['convertHtml', 'convertUrl', 'convertTemplate'],
						endpointType: ['async'],
					},
				},
				description: 'Custom headers (max 10) included in the webhook callback. Useful for adding context or tracking requests. <a href="https://pdfbolt.com/docs/api-endpoints/async#additionalwebhookheaders" target="_blank">Learn&nbsp;more</a>',
			},

			// Additional Options
			sharedOptions,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				// ── Get Usage ──
				if (operation === 'getUsage') {
					const response = await pdfBoltApiRequest.call(this, 'GET', '/v1/usage');
					returnData.push({
						json: response as IDataObject,
						pairedItem: { item: i },
					});
					continue;
				}

				// ── Convert operations ──
				const endpointType = this.getNodeParameter('endpointType', i) as string;
				const body = buildRequestBody.call(this, operation, endpointType, i);
				const filenameRaw = ((this.getNodeParameter('additionalOptions', i, {}) as IDataObject)
					.filename as string | undefined)?.trim();
				const filename = filenameRaw
					? (filenameRaw.endsWith('.pdf') ? filenameRaw : `${filenameRaw}.pdf`)
					: 'document.pdf';

				if (endpointType === 'direct') {
					const response = await pdfBoltApiRequest.call(this, 'POST', '/v1/direct', body, {
						encoding: 'arraybuffer',
						json: false,
					});

					const buffer = Buffer.isBuffer(response)
						? response
						: Buffer.from(response as unknown as ArrayBuffer);

					const binaryData = await this.helpers.prepareBinaryData(
						buffer,
						filename,
						'application/pdf',
					);

					returnData.push({
						json: { success: true, size: buffer.length },
						binary: { data: binaryData },
						pairedItem: { item: i },
					});

				} else if (endpointType === 'sync') {
					const response = await pdfBoltApiRequest.call(
						this,
						'POST',
						'/v1/sync',
						body,
					) as IDataObject;

					returnData.push({
						json: response,
						pairedItem: { item: i },
					});

				} else if (endpointType === 'async') {
					const response = await pdfBoltApiRequest.call(
						this,
						'POST',
						'/v1/async',
						body,
					) as IDataObject;

					returnData.push({
						json: response,
						pairedItem: { item: i },
					});
				}

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
