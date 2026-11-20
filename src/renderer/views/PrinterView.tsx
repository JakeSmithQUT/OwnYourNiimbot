import { useEffect, useRef, useState } from 'react';
import { Battery, Bluetooth, Crosshair, Info, Power, RefreshCw, ScrollText, Tag, Unplug, Usb, Volume2 } from 'lucide-react';
import { usePrinter, printer } from '../state/printer';
import { appStore, toast } from '../state/app';
import { batteryPercent } from '../../printer/client';
import { AUTO_SHUTDOWN_OPTIONS, labelTypeName } from '../../printer/protocol';
import { defaultVariant, MODELS, PRINT_VARIANTS } from '../../printer/models';
import { forgetRoll, rollLabel, rollStore } from '../state/roll';
import { SOURCE_TEXT } from '../components/LabelPicker';
import { t, tn } from '../i18n';

function yesNo(v: boolean | undefined, yes: string, no: string) {
  if (v === undefined) return <span className="muted">{t('printer.unknown')}</span>;
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
  const { roll } = rollStore.use();
  const [showLog, setShowLog] = useState(false);
  const [calType, setCalType] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showLog && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  });

  if (!p.connected) {
    return (
      <div className="page">
        <h2>{t('printer.title')}</h2>
        <p className="lead">{t('printer.lead')}</p>
        <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Unplug size={28} className="muted" />
          <div style={{ flex: 1 }}>
            <strong>{t('printer.none')}</strong>
            <div className="muted">{t('printer.noneHint')}</div>
          </div>
          <button className="btn primary" onClick={() => appStore.set({ connectOpen: true })}>
            {t('printer.connect')}
          </button>
        </div>
        <h2 style={{ marginTop: 28 }}>{t('printer.models.title')}</h2>
        <p className="lead">{tn('printer.models.lead', MODELS.filter((m) => m.protocol === 'niimbot').length)}</p>
        <div className="table-wrap" style={{ maxHeight: 420 }}>
          <table className="data">
            <thead>
              <tr>
                <th>{t('printer.model')}</th>
                <th>{t('printer.resolution')}</th>
                <th>{t('printer.printWidth')}</th>
                <th>{t('printer.density')}</th>
                <th>{t('printer.commandSet')}</th>
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
                  <td>{m.protocol === 'niimbot' ? ((v) => (v ? t(v.labelKey) : ''))(PRINT_VARIANTS.find((v) => v.value === defaultVariant(m))) : t('printer.models.other')}</td>
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
          <h2>{info.model?.name ?? t('printer.unknownModel')}</h2>
          <p className="lead" style={{ margin: 0 }}>
            {t(p.transport?.kind === 'bluetooth' ? 'printer.connectedBluetooth' : 'printer.connectedSerial', { name: p.transport?.name ?? '' })}
          </p>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => void run(t('printer.refreshed'), async () => {
            await printer.refreshInfo();
            await printer.readRfid().catch(() => undefined);
          })}>
            <RefreshCw size={15} /> {t('printer.refresh')}
          </button>
          <button className="btn danger" onClick={() => void printer.disconnect()}>
            <Unplug size={15} /> {t('printer.disconnect')}
          </button>
        </div>
      </div>

      {info.model && info.model.protocol !== 'niimbot' && (
        <div className="notice warn">{t('printer.unsupported')}</div>
      )}
      {!info.model && (
        <div className="notice warn">
          {info.modelId !== undefined ? t('printer.unknownId', { id: info.modelId }) : t('printer.unknownIdMissing')}
        </div>
      )}

      <div className="grid-cards">
        <div className="card">
          <h3>
            <Info size={16} /> {t('printer.device')}
          </h3>
          <dl className="kv">
            <dt>{t('printer.model')}</dt>
            <dd>{info.model?.name ?? '–'}</dd>
            <dt>{t('printer.modelId')}</dt>
            <dd>{info.modelId ?? '–'}</dd>
            <dt>{t('printer.firmware')}</dt>
            <dd>{info.firmware ?? '–'}</dd>
            <dt>{t('printer.hardware')}</dt>
            <dd>{info.hardware ?? '–'}</dd>
            <dt>{t('printer.serialNumber')}</dt>
            <dd>{info.serialNumber ?? '–'}</dd>
            {info.bluetoothAddress && (
              <>
                <dt>{t('printer.bluetoothAddress')}</dt>
                <dd>{info.bluetoothAddress}</dd>
              </>
            )}
            <dt>{t('printer.connection')}</dt>
            <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {p.transport?.kind === 'bluetooth' ? <Bluetooth size={14} /> : <Usb size={14} />}
              {p.transport?.kind === 'bluetooth' ? 'Bluetooth LE' : t('printer.serial')}
            </dd>
            {info.model && (
              <>
                <dt>{t('printer.resolution')}</dt>
                <dd>{info.model.dpi} dpi</dd>
                <dt>{t('printer.printWidth')}</dt>
                <dd>{info.model.printWidthMm.max} mm</dd>
              </>
            )}
          </dl>
        </div>

        <div className="card">
          <h3>
            <Battery size={16} /> {t('printer.status')}
          </h3>
          <dl className="kv">
            <dt>{t('printer.battery')}</dt>
            <dd>{battery !== undefined ? `${battery}%` : '–'}</dd>
            <dt>{t('printer.cover')}</dt>
            <dd>{yesNo(p.status.lidClosed, t('printer.coverClosed'), t('printer.coverOpen'))}</dd>
            <dt>{t('printer.labels')}</dt>
            <dd>{yesNo(p.status.paperLoaded, t('printer.labelsLoaded'), t('printer.labelsNotLoaded'))}</dd>
            <dt>{t('printer.labelTag')}</dt>
            <dd>{yesNo(p.status.rfidRead, t('printer.tagRead'), t('printer.tagNotRead'))}</dd>
            <dt>{t('printer.updated')}</dt>
            <dd>{p.status.updatedAt ? new Date(p.status.updatedAt).toLocaleTimeString() : '–'}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>
            <Tag size={16} /> {t('printer.roll.title')}
          </h3>
          {roll && (
            <dl className="kv" style={{ marginBottom: 10 }}>
              <dt>{t('printer.roll.size')}</dt>
              <dd>
                {roll.widthMm && roll.lengthMm ? <strong>{rollLabel(roll)}</strong> : t('printer.unknown')}
                {roll.widthMm && roll.lengthMm ? <span className="muted"> {t('printer.roll.widthLength')}</span> : null}
                <div className="muted">{roll.gapMm ? t('printer.roll.sourceGap', { source: SOURCE_TEXT[roll.source], gap: roll.gapMm }) : SOURCE_TEXT[roll.source]}</div>
              </dd>
            </dl>
          )}
          {!rfid ? (
            <p className="muted">{t('printer.roll.noData')}</p>
          ) : !rfid.present ? (
            <p className="muted">{t('printer.roll.noTag')}</p>
          ) : (
            <dl className="kv">
              <dt>{t('printer.roll.barcode')}</dt>
              <dd>{rfid.barcode || '–'}</dd>
              <dt>{t('printer.roll.serial')}</dt>
              <dd>{rfid.serial || '–'}</dd>
              <dt>{t('printer.roll.total')}</dt>
              <dd>{rfid.totalLabels ?? '–'}</dd>
              <dt>{t('printer.roll.used')}</dt>
              <dd>{rfid.usedLabels ?? '–'}</dd>
              <dt>{t('printer.roll.remaining')}</dt>
              <dd>{remaining !== undefined ? <strong>{remaining}</strong> : '–'}</dd>
              <dt>{t('printer.roll.type')}</dt>
              <dd>{rfid.type !== undefined ? (labelTypeName(rfid.type) ?? rfid.type) : '–'}</dd>
            </dl>
          )}
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn small" onClick={() => void run(t('printer.roll.detected'), () => printer.refreshRoll())}>
              {t('printer.roll.detect')}
            </button>
            {roll?.source === 'remembered' && roll.barcode && (
              <button className="btn small ghost" onClick={() => void forgetRoll(roll.barcode!)}>
                {t('printer.roll.forget')}
              </button>
            )}
          </div>
          {p.paperInfoSupported === false && (
            <p className="muted" style={{ marginBottom: 0 }}>
              {t('printer.roll.noSizeReport')}
            </p>
          )}
        </div>

        <div className="card">
          <h3>
            <Power size={16} /> {t('printer.settings')}
          </h3>
          <div className="field">
            <label>{t('printer.autoOff')}</label>
            <select
              value={info.autoShutdown ?? ''}
              onChange={(e) => void run(t('printer.autoOffChanged'), () => printer.setAutoShutdown(Number(e.target.value)))}
            >
              {info.autoShutdown === undefined && <option value="">{t('printer.unknown')}</option>}
              {AUTO_SHUTDOWN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              <Volume2 size={12} /> {t('printer.sounds')}
            </label>
            <div className="btn-row">
              <button className="btn small" onClick={() => void run(t('printer.sound.connectOnDone'), () => printer.setSound(1, true))}>
                {t('printer.sound.connectOn')}
              </button>
              <button className="btn small" onClick={() => void run(t('printer.sound.connectOffDone'), () => printer.setSound(1, false))}>
                {t('printer.sound.off')}
              </button>
              <button className="btn small" onClick={() => void run(t('printer.sound.powerOnDone'), () => printer.setSound(2, true))}>
                {t('printer.sound.powerOn')}
              </button>
              <button className="btn small" onClick={() => void run(t('printer.sound.powerOffDone'), () => printer.setSound(2, false))}>
                {t('printer.sound.off')}
              </button>
            </div>
          </div>
          <div className="field">
            <label>
              <Crosshair size={12} /> {t('printer.calibration')}
            </label>
            <div className="btn-row">
              <select value={calType} onChange={(e) => setCalType(Number(e.target.value))} style={{ width: 'auto', flex: 1 }}>
                {(info.model?.paperTypes.length ? info.model.paperTypes : [1, 2, 3]).map((type) => (
                  <option key={type} value={type}>
                    {labelTypeName(type) ?? type}
                  </option>
                ))}
              </select>
              <button className="btn" onClick={() => void run(t('printer.calibrated'), () => printer.calibrate(calType))}>
                {t('printer.calibrate')}
              </button>
            </div>
            <small className="muted">{t('printer.calibrationHint')}</small>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ScrollText size={16} /> {t('printer.log.title')}
          </span>
          <span className="btn-row">
            <button className="btn small" onClick={() => setShowLog(!showLog)}>
              {showLog ? t('common.hide') : t('common.show')}
            </button>
            {showLog && (
              <button
                className="btn small"
                onClick={() => void navigator.clipboard.writeText(p.log.map((l) => `${new Date(l.time).toISOString()} ${l.dir} ${l.text}`).join('\n'))}
              >
                {t('common.copy')}
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
            {t('printer.log.hint')}
          </p>
        )}
      </div>
    </div>
  );
}
