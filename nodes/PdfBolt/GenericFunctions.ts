import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export function base64Encode(str: string): string {
	return Buffer.from(str).toString('base64');
}

function extractApiError(error: unknown): { errorCode?: string; errorMessage?: string } | undefined {
	const err = error as JsonObject & { context?: { data?: unknown } };

	const data = err.context?.data;
	if (!data) return undefined;

	// Already parsed JSON object (n8n 2.x)
	if (typeof data === 'object' && !Buffer.isBuffer(data)) {
		const obj = data as { errorCode?: string; errorMessage?: string; type?: string; data?: number[] };
		if (obj.errorCode || obj.errorMessage) {
			return { errorCode: obj.errorCode, errorMessage: obj.errorMessage };
		}
		// Serialized Buffer format
		if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
			try {
				return JSON.parse(Buffer.from(obj.data).toString('utf-8')) as { errorCode?: string; errorMessage?: string };
			} catch { /* not JSON */ }
		}
		return undefined;
	}

	// Buffer or string
	try {
		const decoded = Buffer.isBuffer(data) ? data.toString('utf-8') : String(data);
		return JSON.parse(decoded) as { errorCode?: string; errorMessage?: string };
	} catch {
		return undefined;
	}
}

export async function pdfBoltApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	options?: Partial<IHttpRequestOptions>,
): Promise<IDataObject | Buffer> {
	const baseUrl = 'https://api.pdfbolt.com';

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		json: true,
		...options,
	};

	if (body && Object.keys(body).length > 0) {
		requestOptions.body = body;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(
			this,
			'pdfBoltApi',
			requestOptions,
		) as IDataObject | Buffer;
	} catch (error) {
		const apiError = extractApiError(error);
		if (apiError?.errorCode || apiError?.errorMessage) {
			throw new NodeApiError(this.getNode(), error as JsonObject, {
				message: (apiError.errorMessage as string) || 'API error',
				description: `Error code: ${apiError.errorCode as string || 'UNKNOWN'}`,
			});
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export function buildRequestBody(
	this: IExecuteFunctions,
	operation: string,
	endpointType: string,
	itemIndex: number,
): IDataObject {
	const body: IDataObject = {};

	// Source parameters
	if (operation === 'convertHtml') {
		const html = this.getNodeParameter('html', itemIndex, '') as string;
		if (html) {
			body.html = base64Encode(html);
		}
	} else if (operation === 'convertUrl') {
		const url = (this.getNodeParameter('url', itemIndex, '') as string).trim();
		if (url) {
			body.url = url;
		}
	} else if (operation === 'convertTemplate') {
		const templateId = (this.getNodeParameter('templateId', itemIndex, '') as string).trim();
		if (templateId) {
			body.templateId = templateId;
		}
		const templateDataRaw = this.getNodeParameter('templateData', itemIndex, '{}');
		let templateData: IDataObject;
		if (typeof templateDataRaw === 'string') {
			try {
				templateData = JSON.parse(templateDataRaw) as IDataObject;
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Template Data contains invalid JSON. Please check the format.',
					{ itemIndex },
				);
			}
		} else {
			templateData = templateDataRaw as IDataObject;
		}
		body.templateData = templateData ?? {};
	}

	// Endpoint-specific parameters
	if (endpointType === 'sync' || endpointType === 'async') {
		const customS3PresignedUrl = (this.getNodeParameter('customS3PresignedUrl', itemIndex, '') as string).trim();
		if (customS3PresignedUrl) {
			body.customS3PresignedUrl = customS3PresignedUrl;
		}
	}

	if (endpointType === 'async') {
		const webhook = (this.getNodeParameter('webhook', itemIndex, '') as string).trim();
		if (webhook) {
			body.webhook = webhook;
		}

		const additionalWebhookHeaders = this.getNodeParameter(
			'additionalWebhookHeaders.values',
			itemIndex,
			[],
		) as Array<{ key: string; value: string }>;
		const filteredWebhookHeaders = additionalWebhookHeaders.filter((h) => h.key);
		if (filteredWebhookHeaders.length > 0) {
			const headers: IDataObject = {};
			for (const header of filteredWebhookHeaders) {
				headers[header.key] = header.value;
			}
			body.additionalWebhookHeaders = headers;
		}

		const retryDelays = this.getNodeParameter('retryDelays', itemIndex, '') as string;
		if (retryDelays) {
			body.retryDelays = retryDelays
				.split(',')
				.map((s) => parseInt(s.trim(), 10))
				.filter((n) => !isNaN(n));
		}
	}

	// Additional Options
	const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {}) as IDataObject;

	// Page Layout
	if (additionalOptions.format) body.format = additionalOptions.format;
	if (additionalOptions.landscape) body.landscape = additionalOptions.landscape;
	if (additionalOptions.width) body.width = (additionalOptions.width as string).trim();
	if (additionalOptions.height) body.height = (additionalOptions.height as string).trim();
	if (additionalOptions.pageRanges) body.pageRanges = (additionalOptions.pageRanges as string).trim();
	if (additionalOptions.scale !== undefined && additionalOptions.scale !== 1) body.scale = additionalOptions.scale;
	if (additionalOptions.preferCssPageSize) body.preferCssPageSize = additionalOptions.preferCssPageSize;

	// Margin
	const marginTop = (additionalOptions.marginTop as string | undefined)?.trim();
	const marginRight = (additionalOptions.marginRight as string | undefined)?.trim();
	const marginBottom = (additionalOptions.marginBottom as string | undefined)?.trim();
	const marginLeft = (additionalOptions.marginLeft as string | undefined)?.trim();
	if (marginTop || marginRight || marginBottom || marginLeft) {
		const margin: IDataObject = {};
		if (marginTop) margin.top = marginTop;
		if (marginRight) margin.right = marginRight;
		if (marginBottom) margin.bottom = marginBottom;
		if (marginLeft) margin.left = marginLeft;
		body.margin = margin;
	}

	// Header & Footer (auto-enable displayHeaderFooter when templates are set)
	if (additionalOptions.headerTemplate) {
		body.headerTemplate = base64Encode(additionalOptions.headerTemplate as string);
	}
	if (additionalOptions.footerTemplate) {
		body.footerTemplate = base64Encode(additionalOptions.footerTemplate as string);
	}
	if (body.headerTemplate || body.footerTemplate) {
		body.displayHeaderFooter = true;
	}

	// Rendering
	if (additionalOptions.printBackground) body.printBackground = true;
	if (additionalOptions.emulateMediaType) body.emulateMediaType = additionalOptions.emulateMediaType;
	if (additionalOptions.javaScriptEnabled === false) body.javaScriptEnabled = false;
	if (additionalOptions.timeout) body.timeout = additionalOptions.timeout;
	if (additionalOptions.waitUntil) body.waitUntil = additionalOptions.waitUntil;
	if (additionalOptions.waitForFunction) body.waitForFunction = additionalOptions.waitForFunction;
	if (additionalOptions.tagged) body.tagged = true;

	// Wait For Selector
	const waitForSelectorValues = this.getNodeParameter(
		'additionalOptions.waitForSelector.values',
		itemIndex,
		{},
	) as { selector?: string; state?: string };
	if (waitForSelectorValues.state && !waitForSelectorValues.selector) {
		throw new NodeOperationError(
			this.getNode(),
			'Wait For Selector requires a CSS selector.',
			{ itemIndex },
		);
	}
	if (waitForSelectorValues.selector) {
		body.waitForSelector = {
			selector: waitForSelectorValues.selector,
			state: waitForSelectorValues.state || 'visible',
		};
	}

	// Viewport & Device
	const viewportValues = this.getNodeParameter(
		'additionalOptions.viewportSize.values',
		itemIndex,
		{},
	) as { width?: number; height?: number };
	if (viewportValues.width || viewportValues.height) {
		if (!viewportValues.width || !viewportValues.height) {
			throw new NodeOperationError(
				this.getNode(),
				'Viewport Size requires both Width and Height.',
				{ itemIndex },
			);
		}
		body.viewportSize = {
			width: viewportValues.width,
			height: viewportValues.height,
		};
	}
	if (additionalOptions.isMobile) body.isMobile = true;
	if (additionalOptions.deviceScaleFactor && additionalOptions.deviceScaleFactor !== 1) {
		body.deviceScaleFactor = additionalOptions.deviceScaleFactor;
	}

	// HTTP
	const httpCreds = this.getNodeParameter(
		'additionalOptions.httpCredentials.values',
		itemIndex,
		{},
	) as { username?: string; password?: string };
	if (httpCreds.username || httpCreds.password) {
		body.httpCredentials = {
			...(httpCreds.username ? { username: httpCreds.username } : {}),
			...(httpCreds.password ? { password: httpCreds.password } : {}),
		};
	}

	const extraHTTPHeaders = this.getNodeParameter(
		'additionalOptions.extraHTTPHeaders.values',
		itemIndex,
		[],
	) as Array<{ key: string; value: string }>;
	const filteredExtraHeaders = extraHTTPHeaders.filter((h) => h.key);
	if (filteredExtraHeaders.length > 0) {
		const headers: IDataObject = {};
		for (const header of filteredExtraHeaders) {
			headers[header.key] = header.value;
		}
		body.extraHTTPHeaders = headers;

		if (additionalOptions.applyExtraHTTPHeadersToAllResources === false) {
			body.applyExtraHTTPHeadersToAllResources = false;
		}
	}

	if (additionalOptions.cookies) {
		try {
			let parsed = additionalOptions.cookies;
			if (typeof parsed === 'string') {
				parsed = JSON.parse(parsed);
			}
			body.cookies = Array.isArray(parsed) ? parsed : [parsed];
		} catch {
			throw new NodeOperationError(
				this.getNode(),
				'Cookies contains invalid JSON. Please check the format.',
				{ itemIndex },
			);
		}
	}

	// Output
	if (additionalOptions.filename) body.filename = (additionalOptions.filename as string).trim();
	if (additionalOptions.contentDisposition) body.contentDisposition = additionalOptions.contentDisposition;
	if (additionalOptions.compression) body.compression = additionalOptions.compression;

	// Print Production
	const colorSpace = additionalOptions.colorSpace as string | undefined;
	const iccProfile = additionalOptions.iccProfile as string | undefined;
	const preserveBlack = additionalOptions.preserveBlack as boolean | undefined;
	const pdfStandard = additionalOptions.pdfStandard as string | undefined;
	if (colorSpace || iccProfile || preserveBlack !== undefined || pdfStandard) {
		const printProduction: IDataObject = {};
		if (pdfStandard) printProduction.pdfStandard = pdfStandard;
		if (colorSpace) printProduction.colorSpace = colorSpace;
		if (iccProfile) printProduction.iccProfile = iccProfile;
		if (preserveBlack !== undefined) printProduction.preserveBlack = preserveBlack;
		body.printProduction = printProduction;
	}

	return body;
}
