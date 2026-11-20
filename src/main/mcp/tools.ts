import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { tm, tmn } from '../i18n';

/** Result that the app window returns for a tool call. */
export interface WindowResult {
  data?: unknown;
  /** PNG image, base64 without the data URL prefix. */
  image?: string;
}

export interface ToolBridge {
  /** Runs a tool in the app window. */
  call(tool: string, args: unknown, timeoutMs?: number): Promise<WindowResult>;
  /** Asks the user. Resolves true if the user accepts. */
  confirm(message: string, detail: string): Promise<boolean>;
  confirmPrint(): boolean;
}

/**
 * Label text for the print approval dialog. The name comes from a label file,
 * so it is put on one line and made short, and cannot look like more dialog text.
 */
export function dialogName(name: unknown): string {
  const line = String(name ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return line.length > 60 ? `${line.slice(0, 59)}…` : line || 'Untitled';
}

export const SERVER_INSTRUCTIONS = `OwnYourNiimbot designs and prints labels on a NIIMBOT label printer that is connected to this computer.

Typical flow:
1. Call get_status to see the printer, the loaded label roll and the fonts.
2. Make a label with create_label (your own layout) or create_from_template (a ready-made design from list_templates).
3. Call preview_label and look at the image. It shows the exact dots that the printer prints.
4. Call print_label. The user may be asked to approve the print in the app.

Print area: the print head can be narrower than the label, most often on printers that feed the label sideways (for example the D110 and H1S with 15 mm rolls). get_status, list_label_sizes and every label result give print_area_mm: the rectangle that prints, in mm from the top-left corner of the label. Keep all text, codes and shapes inside it. The automatic layout for "lines" and "code" already stays inside it. With "elements", place them inside print_area_mm yourself. A result with outside_print_area lists elements that will be cut off: fix them before you print. Grey parts of a preview image do not print.

Sizes are in millimetres. Width and height are the label as the user sees it on screen. Prefer the loaded roll size (use_loaded_roll) when a roll is detected. Text that does not set size_pt is sized automatically to fill its box. Thermal labels print black only, so avoid tiny text (under 5 pt) and thin lines (under 0.3 mm).`;

const mm = z.number().min(-50).max(500);
const size = z.number().positive().max(500);
const textStyle = {
  font: z.string().max(60).optional().describe('Font family. get_status lists the fonts that ship with the app.'),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  size_pt: z.number().min(3).max(200).optional().describe('Font size in points. Leave out to fit the text to the box.'),
  invert: z.boolean().optional().describe('White text on a black box.'),
};
const box = { x: mm.describe('Left edge in mm'), y: mm.describe('Top edge in mm'), width: size, height: size };
const ONE_D = ['code128', 'code39', 'code93', 'ean13', 'ean8', 'upca', 'upce', 'itf14', 'interleaved2of5', 'codabar', 'gs1-128', 'msi'] as const;

const element = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().max(2000), ...box, ...textStyle }),
  z.object({ type: z.literal('barcode'), value: z.string().min(1).max(200), format: z.enum(ONE_D).optional(), show_text: z.boolean().optional(), ...box }),
  z.object({ type: z.literal('qrcode'), value: z.string().min(1).max(2000), x: mm, y: mm, size }),
  z.object({ type: z.literal('datamatrix'), value: z.string().min(1).max(1000), x: mm, y: mm, size }),
  z.object({ type: z.literal('rect'), ...box, fill: z.boolean().optional(), stroke_mm: z.number().min(0).max(5).optional(), radius_mm: z.number().min(0).max(50).optional() }),
  z.object({ type: z.literal('ellipse'), ...box, fill: z.boolean().optional(), stroke_mm: z.number().min(0).max(5).optional() }),
  z.object({ type: z.literal('line'), x1: mm, y1: mm, x2: mm, y2: mm, width_mm: z.number().min(0.1).max(5).optional(), dashed: z.boolean().optional() }),
  z.object({ type: z.literal('icon'), name: z.string().max(40).describe('Symbol name, for example warning, recycle, wifi, star.'), x: mm, y: mm, size }),
  z.object({
    type: z.literal('date'),
    format: z.string().max(40).optional().describe('For example DD/MM/YYYY, D MMM YYYY, ddd D MMM, HH:mm.'),
    offset_days: z.number().int().min(-3650).max(3650).optional(),
    ...box,
    ...textStyle,
  }),
  z.object({
    type: z.literal('serial'),
    prefix: z.string().max(20).optional(),
    suffix: z.string().max(20).optional(),
    start: z.number().int().min(-1e9).max(1e9).optional(),
    step: z.number().int().min(-1e6).max(1e6).optional(),
    digits: z.number().int().min(1).max(12).optional(),
    ...box,
    ...textStyle,
  }),
  z.object({
    type: z.literal('table'),
    ...box,
    cells: z.array(z.array(z.string().max(200)).max(12)).min(1).max(30),
    size_pt: z.number().min(3).max(60).optional(),
    bold: z.boolean().optional(),
    align: z.enum(['left', 'center', 'right']).optional(),
  }),
]);

const line = z.object({
  text: z.string().max(500),
  weight: z.number().min(0.2).max(5).optional().describe('Relative height of the line. Default 1.'),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  font: z.string().max(60).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  invert: z.boolean().optional(),
});

const labelId = z.string().max(120).describe('"open" for the label in the editor, or an ID from create_label, create_from_template or list_saved_labels.');
const record = z.record(z.string().max(100), z.string().max(2000));

function toContent(r: WindowResult) {
  const content: ({ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string })[] = [];
  if (r.image) content.push({ type: 'image', data: r.image, mimeType: 'image/png' });
  if (r.data !== undefined) content.push({ type: 'text', text: JSON.stringify(r.data, null, 2) });
  return { content };
}

async function run(fn: () => Promise<WindowResult>) {
  try {
    return toContent(await fn());
  } catch (err) {
    return { isError: true, content: [{ type: 'text' as const, text: (err as Error).message }] };
  }
}

export function registerTools(server: McpServer, bridge: ToolBridge): void {
  server.registerTool(
    'get_status',
    {
      title: 'Printer and label status',
      description: 'Shows the connected printer, the loaded label roll and its size, the label open in the editor, the fonts that ship with the app and the barcode types.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () => run(() => bridge.call('get_status', {})),
  );

  server.registerTool(
    'list_label_sizes',
    {
      title: 'Label sizes for the printer',
      description: 'Lists the NIIMBOT label rolls that fit the printer, with the size to use for width_mm and height_mm.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () => run(() => bridge.call('list_label_sizes', {})),
  );

  server.registerTool(
    'list_templates',
    {
      title: 'Find templates',
      description: 'Searches the built-in template library. Returns template IDs and the sizes that each design comes in.',
      inputSchema: {
        query: z.string().max(100).optional().describe('Words to search for, for example "server", "jam", "price".'),
        category: z.string().max(60).optional(),
        decorative_only: z.boolean().optional(),
        only_fits_printer: z.boolean().optional().describe('Default true. Only sizes that fit the printer.'),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => bridge.call('list_templates', args)),
  );

  server.registerTool(
    'create_label',
    {
      title: 'Make a label',
      description:
        'Makes a label from your own layout. Use "lines" (with an optional "code") for a quick stacked layout inside the print area, or "elements" with positions in mm for full control (keep them inside print_area_mm from get_status). Returns a label_id, the print area, any elements outside it and a preview image.',
      inputSchema: {
        name: z.string().max(120).optional(),
        use_loaded_roll: z.boolean().optional().describe('Use the size of the roll in the printer. Default true when no size is given.'),
        width_mm: z.number().min(5).max(300).optional(),
        height_mm: z.number().min(5).max(500).optional(),
        label_type: z.number().int().min(1).max(11).optional().describe('1 gap, 2 black mark, 3 continuous, 5 transparent.'),
        lines: z.array(line).max(12).optional().describe('Text lines stacked from top to bottom, sized to fill the label.'),
        code: z
          .object({ type: z.enum(['qrcode', 'datamatrix', ...ONE_D]), value: z.string().min(1).max(2000), side: z.enum(['left', 'right']).optional() })
          .optional()
          .describe('With "lines": a code on one side of the text.'),
        elements: z.array(element).max(200).optional(),
        open_in_editor: z.boolean().optional().describe('Show the label in the app. Skipped if the open label has changes that are not saved.'),
      },
    },
    (args) => run(() => bridge.call('create_label', args)),
  );

  server.registerTool(
    'create_from_template',
    {
      title: 'Make a label from a template',
      description: 'Makes a label from a library template at one of its sizes. Use "replace" to change the sample text, for example the hostname or the price.',
      inputSchema: {
        template_id: z.string().max(80),
        width_mm: z.number().min(5).max(300),
        height_mm: z.number().min(5).max(500),
        replace: z.array(z.object({ find: z.string().min(1).max(500), replace: z.string().max(2000) })).max(50).optional(),
        name: z.string().max(120).optional(),
        open_in_editor: z.boolean().optional(),
      },
    },
    (args) => run(() => bridge.call('create_from_template', args)),
  );

  server.registerTool(
    'edit_label_text',
    {
      title: 'Change text on a label',
      description: 'Makes a copy of a label with text replaced in text, barcodes, QR codes and tables. Returns a new label_id and a preview.',
      inputSchema: {
        label_id: labelId,
        replace: z.array(z.object({ find: z.string().min(1).max(500), replace: z.string().max(2000) })).min(1).max(50),
        open_in_editor: z.boolean().optional(),
      },
    },
    (args) => run(() => bridge.call('edit_label_text', args)),
  );

  server.registerTool(
    'preview_label',
    {
      title: 'Preview a label',
      description: 'Returns an image of a label as the printer will print it, with the parts outside the print area in grey, and lists elements that go outside print_area_mm. Pass "record" to fill {{fields}} with values.',
      inputSchema: { label_id: labelId, record: record.optional() },
      annotations: { readOnlyHint: true },
    },
    (args) => run(() => bridge.call('preview_label', args)),
  );

  server.registerTool(
    'list_saved_labels',
    {
      title: 'Saved labels',
      description: 'Lists the labels that the user saved in the app.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () => run(() => bridge.call('list_saved_labels', {})),
  );

  server.registerTool(
    'save_label',
    {
      title: 'Save a label',
      description: 'Saves a label to the user\'s label library in the app.',
      inputSchema: { label_id: labelId, name: z.string().max(120).optional() },
    },
    (args) => run(() => bridge.call('save_label', args)),
  );

  server.registerTool(
    'print_label',
    {
      title: 'Print a label',
      description:
        'Prints a label on the connected printer. "records" prints one label for each record, filling {{fields}}. "serial_count" prints that many labels with counting serial numbers. The user may be asked to approve the print.',
      inputSchema: {
        label_id: labelId,
        copies: z.number().int().min(1).max(99).optional(),
        density: z.number().int().min(1).max(20).optional(),
        records: z.array(record).max(500).optional(),
        serial_count: z.number().int().min(1).max(500).optional(),
      },
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    (args) =>
      run(async () => {
        const summary = (await bridge.call('print_summary', args)).data as { labels: number; name: string; size: string; model: string };
        if (bridge.confirmPrint()) {
          const ok = await bridge.confirm(
            tm('main.printApproval.message'),
            tmn('main.printApproval.detail', summary.labels, { name: dialogName(summary.name), size: summary.size, model: summary.model }),
          );
          if (!ok) throw new Error('The user did not allow this print.');
        }
        return bridge.call('print_label', args, 10 * 60 * 1000);
      }),
  );
}
