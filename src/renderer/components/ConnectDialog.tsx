import { useEffect, useState } from 'react';
import { Bluetooth, Loader2, Printer as PrinterIcon, Usb } from 'lucide-react';
import { Modal, Check } from './ui';
import { api } from '../api';
import { connectBluetooth, connectSerial, printer } from '../state/printer';
import { toast } from '../state/app';
import { looksLikeNiimbot } from '../../printer/models';
import type { DeviceEntry, SerialEntry } from '../../main/preload';

type Mode = 'choose' | 'bluetooth' | 'serial' | 'connecting';

export function ConnectDialog(props: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const [devices, setDevices] = useState<DeviceEntry[]>([]);
  const [ports, setPorts] = useState<SerialEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const offBt = api.bluetooth.onDevices(setDevices);
    const offSerial = api.serial.onPorts(setPorts);
    return () => {
      offBt();
      offSerial();
    };
  }, []);

  const finish = () => {
    const name = printer.info.model?.name ?? printer.transport?.name ?? 'printer';
    toast(`Connected to ${name}`, 'success');
    props.onClose();
  };

  const fail = (err: unknown) => {
    const e = err as Error;
    if (e?.name === 'NotFoundError' || /cancel/i.test(e?.message ?? '')) {
      setMode('choose');
      return;
    }
    setError(e?.message ?? String(err));
    setMode('choose');
  };

  const startBluetooth = () => {
    setError(undefined);
    setDevices([]);
    setMode('bluetooth');
    connectBluetooth().then(finish, fail);
  };

  const startSerial = () => {
    setError(undefined);
    setPorts([]);
    setMode('serial');
    connectSerial().then(finish, fail);
  };

  const cancel = () => {
    if (mode === 'bluetooth') api.bluetooth.select('');
    if (mode === 'serial') api.serial.select('');
    setMode('choose');
  };

  const close = () => {
    cancel();
    props.onClose();
  };

  const visibleDevices = devices
    .filter((d) => showAll || looksLikeNiimbot(d.name))
    .sort((a, b) => Number(looksLikeNiimbot(b.name)) - Number(looksLikeNiimbot(a.name)) || a.name.localeCompare(b.name));

  return (
    <Modal title="Connect a printer" icon={<PrinterIcon size={18} />} onClose={close}>
      {error && <div className="notice error">{error}</div>}

      {mode === 'choose' && (
        <div className="choice-grid">
          <button className="choice" onClick={startBluetooth}>
            <Bluetooth size={26} />
            <strong>Bluetooth</strong>
            <span>Turn on the printer. You do not need to pair it in the system settings first.</span>
          </button>
          <button className="choice" onClick={startSerial}>
            <Usb size={26} />
            <strong>USB cable or serial port</strong>
            <span>Connect the printer with a USB data cable. Older models that pair as a Bluetooth serial port also show here.</span>
          </button>
        </div>
      )}

      {mode === 'bluetooth' && (
        <>
          <div className="scanning">
            <Loader2 size={18} className="spin" /> Looking for printers nearby…
          </div>
          <div className="device-list">
            {visibleDevices.length === 0 && <div className="empty">No printers found yet. Make sure that the printer is on and not connected to a phone.</div>}
            {visibleDevices.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setMode('connecting');
                  api.bluetooth.select(d.id);
                }}
              >
                <Bluetooth size={18} />
                <div>
                  <div>{d.name || 'Unnamed device'}</div>
                  <small>{d.id}</small>
                </div>
              </button>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <Check checked={showAll} onChange={setShowAll}>
              Show all Bluetooth devices
            </Check>
            <button className="btn" onClick={cancel}>
              Back
            </button>
          </div>
        </>
      )}

      {mode === 'serial' && (
        <>
          <div className="scanning">
            <Loader2 size={18} className="spin" /> Looking for serial ports…
          </div>
          <div className="device-list">
            {ports.length === 0 && <div className="empty">No serial ports found. Connect the printer and turn it on.</div>}
            {ports.map((port) => (
              <button
                key={port.id}
                onClick={() => {
                  setMode('connecting');
                  api.serial.select(port.id);
                }}
              >
                <Usb size={18} />
                <div>
                  <div>{port.name}</div>
                  <small>
                    {port.portName}
                    {port.vendorId ? ` · USB ${port.vendorId}:${port.productId}` : ''}
                  </small>
                </div>
              </button>
            ))}
          </div>
          <div className="btn-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={cancel}>
              Back
            </button>
          </div>
        </>
      )}

      {mode === 'connecting' && (
        <div className="scanning">
          <Loader2 size={18} className="spin" /> Connecting and reading printer details…
        </div>
      )}
    </Modal>
  );
}
