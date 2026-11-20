import { useEffect, useRef, useState } from 'react';
import { Battery, Bluetooth, Crosshair, Info, Power, RefreshCw, ScrollText, Tag, Unplug, Usb, Volume2 } from 'lucide-react';
import { usePrinter, printer } from '../state/printer';
import { appStore, toast } from '../state/app';
import { batteryPercent } from '../../printer/client';
import { AUTO_SHUTDOWN_OPTIONS, LABEL_TYPE_NAMES } from '../../printer/protocol';
import { defaultVariant, MODELS, PRINT_VARIANTS } from '../../printer/models';

function yesNo(v: boolean | undefined, yes: string, no: string) {
  if (v === undefined) return <span className="muted">Unknown</span>;
  return <span className={`pill ${v ? 'ok' : 'warn'}`}>{v ? yes : no}</span>;
}

async function run(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    toast(label, 'success');
  } catch (err) {
    toast((err as Error).message, 'error');
  }
}

export function PrinterView() {
  const p = usePrinter();
  const [showLog, setShowLog] = useState(false);
  const [calType, setCalType] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showLog && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  });

  if (!p.connected) {
    return (
      <div className="page">
        <h2>Printer</h2>
        <p className="lead">Connect a printer over Bluetooth or a USB cable. No account and no internet connection are necessary.</p>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Unplug size={28} className="muted" />
          <div style={{ flex: 1 }}>
            <strong>No printer is connected</strong>
            <div className="muted">Turn on the printer. If a phone app is connected to it, close that app first.</div>
          </div>
          <button className="btn primary" onClick={() => appStore.set({ connectOpen: true })}>
            Connect
          </button>
        </div>
        <h2 style={{ marginTop: 28 }}>Supported models</h2>
        <p className="lead">
          {MODELS.filter((m) => m.protocol === 'niimbot').length} models use the NIIMBOT command set. Models marked as other use a different command set and do not work with this app.
        </p>
        <div className="table-wrap" style={{ maxHeight: 420 }}>
          <table className="data">
            <thead>
              <tr>
                <th>Model</th>
                <th>Resolution</th>
                <th>Print width</th>
                <th>Density</th>
                <th>Command set</th>
              </tr>
            </thead>
            <tbody>
              {MODELS.map((m) => (
                <tr key={m.name}>
                  <td>{m.name}</td>
                  <td>{m.dpi} dpi</td>
                  <td>{m.printWidthMm.max ? `${m.printWidthMm.max} mm` : '–'}</td>
                  <td>
                    {m.density.min}–{m.density.max}
                  </td>
                  <td>{m.protocol === 'niimbot' ? PRINT_VARIANTS.find((v) => v.value === defaultVariant(m))?.label : 'Other'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const info = p.info;
  const battery = batteryPercent(info.batteryLevel);
  const rfid = p.rfid;
  const remaining = rfid?.totalLabels !== undefined && rfid.usedLabels !== undefined ? Math.max(0, rfid.totalLabels - rfid.usedLabels) : undefined;

  return (
    <div className="page">
      <div className="btn-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2>{info.model?.name ?? 'Unknown model'}</h2>
          <p className="lead" style={{ margin: 0 }}>
            Connected to {p.transport?.name} over {p.transport?.kind === 'bluetooth' ? 'Bluetooth' : 'USB or serial'}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => void run('Printer details updated', async () => {
            await printer.refreshInfo();
            await printer.readRfid().catch(() => undefined);
          })}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn danger" onClick={() => void printer.disconnect()}>
            <Unplug size={15} /> Disconnect
          </button>
        </div>
      </div>

      {info.model && info.model.protocol !== 'niimbot' && (
        <div className="notice warn">This model uses a different command set. Printing is not supported.</div>
      )}
      {!info.model && (
        <div className="notice warn">
          The printer reported model ID {info.modelId ?? 'unknown'}, which is not in the model list. Select the nearest model in Settings and try each command set in the print options.
        </div>
      )}

      <div className="grid-cards">
        <div className="card">
          <h3>
            <Info size={16} /> Device
          </h3>
          <dl className="kv">
            <dt>Model</dt>
            <dd>{info.model?.name ?? '–'}</dd>
            <dt>Model ID</dt>
            <dd>{info.modelId ?? '–'}</dd>
            <dt>Firmware</dt>
            <dd>{info.firmware ?? '–'}</dd>
            <dt>Hardware</dt>
            <dd>{info.hardware ?? '–'}</dd>
            <dt>Serial number</dt>
            <dd>{info.serialNumber ?? '–'}</dd>
            {info.bluetoothAddress && (
              <>
                <dt>Bluetooth address</dt>
                <dd>{info.bluetoothAddress}</dd>
              </>
            )}
            <dt>Connection</dt>
            <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {p.transport?.kind === 'bluetooth' ? <Bluetooth size={14} /> : <Usb size={14} />}
              {p.transport?.kind === 'bluetooth' ? 'Bluetooth LE' : 'Serial'}
            </dd>
            {info.model && (
              <>
                <dt>Resolution</dt>
                <dd>{info.model.dpi} dpi</dd>
                <dt>Print width</dt>
                <dd>{info.model.printWidthMm.max} mm</dd>
              </>
            )}
          </dl>
        </div>

        <div className="card">
          <h3>
            <Battery size={16} /> Status
          </h3>
          <dl className="kv">
            <dt>Battery</dt>
            <dd>{battery !== undefined ? `${battery}%` : '–'}</dd>
            <dt>Cover</dt>
            <dd>{yesNo(p.status.lidClosed, 'Closed', 'Open')}</dd>
            <dt>Labels</dt>
            <dd>{yesNo(p.status.paperLoaded, 'Loaded', 'Not loaded')}</dd>
            <dt>Label tag</dt>
            <dd>{yesNo(p.status.rfidRead, 'Read', 'Not read')}</dd>
            <dt>Updated</dt>
            <dd>{p.status.updatedAt ? new Date(p.status.updatedAt).toLocaleTimeString() : '–'}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>
            <Tag size={16} /> Label roll
          </h3>
          {!rfid ? (
            <p className="muted">The printer did not report label roll data.</p>
          ) : !rfid.present ? (
            <p className="muted">No label tag was found. Genuine rolls have an RFID tag that holds the roll details.</p>
          ) : (
            <dl className="kv">
              <dt>Barcode</dt>
              <dd>{rfid.barcode || '–'}</dd>
              <dt>Roll serial</dt>
              <dd>{rfid.serial || '–'}</dd>
              <dt>Labels on roll</dt>
              <dd>{rfid.totalLabels ?? '–'}</dd>
              <dt>Used</dt>
              <dd>{rfid.usedLabels ?? '–'}</dd>
              <dt>Remaining</dt>
              <dd>{remaining !== undefined ? <strong>{remaining}</strong> : '–'}</dd>
              <dt>Label type</dt>
              <dd>{rfid.type !== undefined ? (LABEL_TYPE_NAMES[rfid.type] ?? rfid.type) : '–'}</dd>
            </dl>
          )}
        </div>

        <div className="card">
          <h3>
            <Power size={16} /> Settings
          </h3>
          <div className="field">
            <label>Turn off when idle after</label>
            <select
              value={info.autoShutdown ?? ''}
              onChange={(e) => void run('Auto power off changed', () => printer.setAutoShutdown(Number(e.target.value)))}
            >
              {info.autoShutdown === undefined && <option value="">Unknown</option>}
              {AUTO_SHUTDOWN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              <Volume2 size={12} /> Sounds
            </label>
            <div className="btn-row">
              <button className="btn small" onClick={() => void run('Connection sound on', () => printer.setSound(1, true))}>
                Connect sound on
              </button>
              <button className="btn small" onClick={() => void run('Connection sound off', () => printer.setSound(1, false))}>
                Off
              </button>
              <button className="btn small" onClick={() => void run('Power sound on', () => printer.setSound(2, true))}>
                Power sound on
              </button>
              <button className="btn small" onClick={() => void run('Power sound off', () => printer.setSound(2, false))}>
                Off
              </button>
            </div>
          </div>
          <div className="field">
            <label>
              <Crosshair size={12} /> Label position calibration
            </label>
            <div className="btn-row">
              <select value={calType} onChange={(e) => setCalType(Number(e.target.value))} style={{ width: 'auto', flex: 1 }}>
                {(info.model?.paperTypes.length ? info.model.paperTypes : [1, 2, 3]).map((t) => (
                  <option key={t} value={t}>
                    {LABEL_TYPE_NAMES[t] ?? t}
                  </option>
                ))}
              </select>
              <button className="btn" onClick={() => void run('Calibration complete', () => printer.calibrate(calType))}>
                Calibrate
              </button>
            </div>
            <small className="muted">The printer feeds a few labels to find the gap or mark.</small>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ScrollText size={16} /> Communication log
          </span>
          <span className="btn-row">
            <button className="btn small" onClick={() => setShowLog(!showLog)}>
              {showLog ? 'Hide' : 'Show'}
            </button>
            {showLog && (
              <button
                className="btn small"
                onClick={() => void navigator.clipboard.writeText(p.log.map((l) => `${new Date(l.time).toISOString()} ${l.dir} ${l.text}`).join('\n'))}
              >
                Copy
              </button>
            )}
          </span>
        </h3>
        {showLog ? (
          <div className="log" ref={logRef}>
            {p.log.slice(-300).map((l, i) => (
              <div key={i} className={l.dir}>
                {new Date(l.time).toLocaleTimeString()} {l.dir.toUpperCase().padEnd(5)} {l.text}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            The log shows the packets sent to and from the printer. Attach it to a bug report if a model does not print correctly.
          </p>
        )}
      </div>
    </div>
  );
}
