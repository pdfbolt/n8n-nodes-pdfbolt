import type { INodeProperties } from 'n8n-workflow';

export const convertHtmlFields: INodeProperties[] = [
	{
		displayName: 'HTML',
		name: 'html',
		type: 'string',
		typeOptions: { rows: 8 },
		required: true,
		default: '',
		placeholder: '<html><body><h1>Hello World</h1></body></html>',
		description: 'HTML content to convert to PDF. Paste raw HTML – it will be base64-encoded automatically. <a href="https://pdfbolt.com/docs/parameters#html" target="_blank">Learn&nbsp;more</a>',
		displayOptions: {
			show: {
				operation: ['convertHtml'],
			},
		},
	},
];
