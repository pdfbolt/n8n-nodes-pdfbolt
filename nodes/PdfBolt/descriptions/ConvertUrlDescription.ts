import type { INodeProperties } from 'n8n-workflow';

export const convertUrlFields: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com',
		description: 'URL of the webpage to convert to PDF. Must be a publicly accessible URL. <a href="https://pdfbolt.com/docs/parameters#url" target="_blank">Learn&nbsp;more</a>',
		displayOptions: {
			show: {
				operation: ['convertUrl'],
			},
		},
	},
];
