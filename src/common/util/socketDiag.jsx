// TEMPORARY DIAGNOSTIC - remove once the WebView socket issue is resolved.
//
// WebViews are awkward to attach devtools to, so this records what the
// WebSocket actually does and paints it on screen for a screenshot. It also
// forwards each line to the native bridge, so the host app can log it too.
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { nativePostMessage } from '../components/NativeInterface';

const entries = [];
const listeners = new Set();
const started = Date.now();

export const socketDiag = (label, detail) => {
  const line = {
    at: ((Date.now() - started) / 1000).toFixed(1),
    label,
    detail: detail === undefined ? '' : String(detail),
  };
  entries.push(line);
  if (entries.length > 14) entries.shift();
  listeners.forEach((listener) => listener([...entries]));
  try {
    nativePostMessage(`diag|${line.at}s ${label} ${line.detail}`);
  } catch {
    // the bridge is absent in a plain browser
  }
};

const readyStateName = (socket) =>
  ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket?.readyState] ?? 'none';

export const socketDiagEnvironment = () => {
  socketDiag('href', window.location.href);
  socketDiag('protocol', window.location.protocol);
  socketDiag('host', window.location.host);
  socketDiag('online', navigator.onLine);
  socketDiag('visibility', document.visibilityState);
  socketDiag('cookieLen', document.cookie.length);
  socketDiag('webSocket', typeof WebSocket);
  socketDiag('ua', navigator.userAgent.slice(0, 80));
};

export const socketDiagAttach = (socket, url) => {
  socketDiag('NEW', `${url} state=${readyStateName(socket)}`);
  const opened = Date.now();
  socket.addEventListener('open', () => {
    socketDiag('OPEN', `after ${Date.now() - opened}ms`);
  });
  socket.addEventListener('error', () => {
    socketDiag('ERROR', `state=${readyStateName(socket)} after ${Date.now() - opened}ms`);
  });
  socket.addEventListener('close', (event) => {
    socketDiag(
      'CLOSE',
      `code=${event.code} clean=${event.wasClean} after ${Date.now() - opened}ms reason=${
        event.reason || '(empty)'
      }`,
    );
  });
};

export const SocketDiagOverlay = () => {
  const administrator = useSelector((state) => Boolean(state.session.user?.administrator));
  const [lines, setLines] = useState([...entries]);
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem('socketDiagClosed') !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const listener = (next) => setLines(next);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const setOpenPersisted = (value) => {
    setOpen(value);
    try {
      window.localStorage.setItem('socketDiagClosed', value ? 'false' : 'true');
    } catch {
      // private mode, keep it in memory only
    }
  };

  // Regular users must never see this, so nothing renders for them at all.
  if (!administrator) return null;

  const button = (label, onClick, style) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        pointerEvents: 'auto',
        background: '#0f0',
        color: '#000',
        border: 0,
        borderRadius: 4,
        font: 'bold 11px/1 monospace',
        padding: '6px 10px',
        cursor: 'pointer',
        ...style,
      }}
    >
      {label}
    </button>
  );

  if (!open) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 8,
          bottom: 8,
          zIndex: 2147483647,
          pointerEvents: 'none',
        }}
      >
        {button('diag', () => setOpenPersisted(true), { opacity: 0.75 })}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2147483647,
        maxHeight: '45vh',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        font: '10px/1.35 monospace',
        padding: '4px 6px 8px',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
        {button('copy', () => {
          const text = lines.map((line) => `${line.at}s ${line.label} ${line.detail}`).join('\n');
          navigator.clipboard?.writeText(text);
        })}
        {button('close', () => setOpenPersisted(false))}
      </div>
      {lines.map((line, index) => (
        <div key={index}>{`${line.at}s ${line.label} ${line.detail}`}</div>
      ))}
    </div>
  );
};
