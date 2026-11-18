import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PdfBoltApi implements ICredentialType {
	name = 'pdfBoltApi';

	displayName = 'PDFBolt API';

	documentationUrl = 'https://pdfbolt.com/docs/automation-platform-integrations/n8n-integration-guide/pdfbolt-community-node';

	icon = 'file:pdfbolt.svg' as const;

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			hint: 'Copy your conversion API key from <a href="https://app.pdfbolt.com/api-keys" target="_blank">API Credentials</a> in your PDFBolt dashboard.',
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
