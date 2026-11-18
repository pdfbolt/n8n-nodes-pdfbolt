# PDFBolt node for n8n

n8n community node for [PDFBolt](https://pdfbolt.com), an HTML to PDF API. Generate PDFs from HTML, web pages, or reusable templates in your workflows, then email the files, upload them to storage, or let an AI agent share a download link.

## Install

### n8n Cloud

In the workflow editor, open the nodes panel, search for **PDFBolt**, and install the verified node. If you don't have permission to install nodes, ask your instance owner or admin.

### Self-hosted n8n

As an instance owner or admin, open **Settings > Community nodes**. Enter `n8n-nodes-pdfbolt` as the package name, acknowledge the risks, and confirm the installation. See the [n8n installation guide](https://docs.n8n.io/integrations/community-nodes/installation-and-management/gui-installation) for details.

## Generate your first PDF

1. If you don't have a PDFBolt account, [sign up](https://app.pdfbolt.com/register). The free plan includes 50 document conversions per month. No credit card is required.
2. Open [API Credentials](https://app.pdfbolt.com/api-keys) in your PDFBolt dashboard and copy a key from **Conversion API Keys**.
3. In n8n, create a workflow, open the workflow menu, and select **Import from URL**. Paste the URL below to load an example workflow that converts sample HTML to PDF.

   ```text
   https://raw.githubusercontent.com/pdfbolt/n8n-nodes-pdfbolt/main/examples/first-pdf.json
   ```

4. Open the **PDFBolt** node and add a new credential. Paste your conversion API key into the **API Key** field and save.
5. Run the workflow, then open the **PDFBolt** node. In the output panel, download `document.pdf` from the `data` field.

To generate a PDF with your own content, edit the HTML in the **PDFBolt** node and run the workflow again.

## Operations

| Operation | Description |
| --- | --- |
| Convert HTML to PDF | Render HTML and CSS as a PDF. Enter HTML directly or use HTML from a previous node. |
| Convert URL to PDF | Save a web page as a PDF. |
| Convert Template to PDF | Generate a PDF from a published PDFBolt template and JSON data. |
| Get Usage | Check your plan, remaining credits, and when those credits expire. |

## Endpoints

| Endpoint | What the node returns |
| --- | --- |
| Direct (PDF in Response) **(default)** | The PDF file in the `data` binary field. Use this option when the next node needs the file, for example as an email attachment. |
| Sync (PDF via URL) | JSON with a download link in `documentUrl`, valid for 24 hours. On paid plans, set **Custom S3 Presigned URL** to upload the PDF to your own bucket instead. |
| Async (PDF via Webhook) | The node immediately returns JSON with a `requestId`. When the conversion finishes, PDFBolt sends the result to your HTTPS webhook as a signed JSON payload. Available on paid plans. |

See the [PDFBolt API endpoint documentation](https://pdfbolt.com/docs/api-endpoints) for request and response examples.

## PDF options

Use **Additional Options** to customize the PDF for any conversion.

- **Page layout:** paper format or custom dimensions, orientation, margins, scale, and page ranges
- **Headers and footers:** HTML templates with page numbers and total page counts
- **Rendering:** background colors and images, CSS media type (print or screen), JavaScript, wait conditions, and timeout
- **Output:** filename, compression, content disposition (inline or attachment), and structural tags for screen readers
- **Viewport:** viewport size, device scale factor, and mobile emulation
- **Page access:** cookies, extra HTTP headers, and HTTP basic authentication
- **Print production (Growth plan and above):** PDF/X standards, CMYK color space, ICC profiles, and pure black preservation

See the [conversion parameters reference](https://pdfbolt.com/docs/parameters) for details.

## Use PDFBolt with an AI Agent

Connect **PDFBolt Tool** to the **Tool** input on the **AI Agent** node. Select **Sync (PDF via URL)** so the agent can share the download link from `documentUrl` in its reply.

## Resources

- [PDFBolt n8n integration guide](https://pdfbolt.com/docs/automation-platform-integrations/n8n-integration-guide/pdfbolt-community-node)
- [PDFBolt API Credentials](https://app.pdfbolt.com/api-keys)
- [PDFBolt API documentation](https://pdfbolt.com/docs)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](https://github.com/pdfbolt/n8n-nodes-pdfbolt/blob/main/LICENSE)
