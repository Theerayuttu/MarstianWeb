// TEMPORARY DIAGNOSTIC - remove once the WebView socket issue is resolved.
//
// WebViews are awkward to attach devtools to, so this records what the
// WebSocket actually does and paints it on screen for a screenshot. It also
// forwards each line to the native bridge, so the host app can log it too.
import { useEffect, useState } from 'react';
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
  const [lines, setLines] = useState([...entries]);

  useEffect(() => {
    const listener = (next) => setLines(next);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

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
        padding: '4px 6px',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {lines.map((line, index) => (
        <div key={index}>{`${line.at}s ${line.label} ${line.detail}`}</div>
      ))}
    </div>
  );
};
