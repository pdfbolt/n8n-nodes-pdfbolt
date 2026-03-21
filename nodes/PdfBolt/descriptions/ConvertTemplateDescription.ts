import type { INodeProperties } from 'n8n-workflow';

export const convertTemplateFields: INodeProperties[] = [
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'c2b5f574-19bc-4e34-9049-566176e6dc48',
		description: 'UUID of a published template. Templates must be created and published in the <a href="https://app.pdfbolt.com/templates" target="_blank">Templates Dashboard</a> before use. <a href="https://pdfbolt.com/docs/parameters#templateid" target="_blank">Learn&nbsp;more</a>',
		displayOptions: {
			show: {
				operation: ['convertTemplate'],
			},
		},
	},
	{
		displayName: 'Template Data',
		name: 'templateData',
		type: 'json',
		required: true,
		default: '{}',
		placeholder: '{"customerName": "John Doe", "invoiceNumber": "INV-001"}',
		description: 'JSON object with data for your template. Property names must match the {{variableName}} placeholders in your template. <a href="https://pdfbolt.com/docs/parameters#templatedata" target="_blank">Learn&nbsp;more</a>',
		displayOptions: {
			show: {
				operation: ['convertTemplate'],
			},
		},
	},
];
