import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PdfBoltApi implements ICredentialType {
	name = 'pdfBoltApi';

	displayName = 'PDFBolt API';

	documentationUrl = 'https://pdfbolt.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API key from your <a href="https://app.pdfbolt.com/api-keys" target="_blank">PDFBolt dashboard</a>',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.pdfbolt.com',
			url: '/v1/usage',
			method: 'GET',
		},
	};
}
