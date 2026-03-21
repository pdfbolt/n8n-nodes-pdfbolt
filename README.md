# n8n-nodes-pdfbolt

This is an [n8n](https://n8n.io/) community node for [PDFBolt](https://pdfbolt.com) – a scalable and privacy-first PDF generation API.

Convert HTML content, URLs, and templates to high-quality PDFs directly from your n8n workflows.

## Installation

Follow the [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

In your n8n instance:
1. Go to **Settings** > **Community Nodes**
2. Enter `n8n-nodes-pdfbolt`
3. Click **Install**

## Operations

| Operation | Description |
|-----------|-------------|
| **Convert HTML to PDF** | Paste your HTML code and get a PDF file |
| **Convert URL to PDF** | Enter a webpage URL and get a PDF of that page |
| **Convert Template to PDF** | Use a PDFBolt template with your JSON data to generate a PDF |
| **Get Usage** | Check your plan, remaining conversions, and expiry date |

### Endpoints

Each conversion operation supports three endpoints:

| Endpoint | Description |
|----------|-------------|
| **Direct (PDF in Response)** | Get the PDF file immediately in the response. The simplest option. |
| **Sync (PDF via URL)** | Get a download URL for the PDF (valid 24h) with conversion details. |
| **Async (PDF via Webhook)** | Convert in the background and send the result to your webhook when ready. Best for large volumes. |

### Additional Options

Fine-tune your PDF output with 30+ parameters:

- **Page Layout** – format, orientation, dimensions, margins, scale, page ranges
- **Output** – filename, compression, content disposition
- **Header & Footer** – custom HTML templates with dynamic page numbers
- **Rendering** – background graphics, media type, JavaScript, timeout, wait conditions
- **Viewport & Device** – viewport size, mobile emulation, device scale factor
- **HTTP** – cookies, custom headers, basic authentication
- **Print Production** – PDF/X standards, color space (RGB/CMYK), ICC profiles

## Credentials

You need a PDFBolt API key. Get one at [app.pdfbolt.com](https://app.pdfbolt.com/api-keys).

## Resources

- [PDFBolt API Documentation](https://pdfbolt.com/docs)
- [Conversion Parameters](https://pdfbolt.com/docs/parameters)
- [PDFBolt Dashboard](https://app.pdfbolt.com)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
