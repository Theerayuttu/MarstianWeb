import { useEffect, useRef, useState } from 'react';
import { Typography, IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { default as Hls, Events } from 'hls.js/light';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  tile: {
    position: 'relative',
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.common.black,
    cursor: 'pointer',
    [theme.breakpoints.down('md')]: {
      aspectRatio: '16 / 9',
    },
  },
  tileHidden: {
    display: 'none',
  },
  player: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  label: {
    position: 'absolute',
    top: theme.spacing(0.5),
    insetInlineStart: theme.spacing(1),
    color: theme.palette.common.white,
    textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    background: 'rgba(0, 0, 0, 0.6)',
    color: theme.palette.common.white,
  },
}));

const StreamPlayer = ({ deviceId, channel, startDelay, hidden, maximized, onToggleMaximize }) => {
  const { classes, cx } = useStyles();
  const t = useTranslation();

  const videoRef = useRef(null);

  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  const sendCommand = useCatchCallback(
    async (type) => {
      await fetchOrThrow('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, type, attributes: { index: channel } }),
      });
    },
    [deviceId, channel],
  );

  useEffect(() => {
    setError(false);
    const video = videoRef.current;
    let hls = null;
    let started = false;

    // starts are staggered so the device is not hit with every videoStart at once
    // and the server has time to produce the first segments of each playlist
    const timer = setTimeout(() => {
      started = true;
      sendCommand('videoStart');
      const source = `/api/stream/${deviceId}/${channel}/live.m3u8`;
      if (Hls.isSupported()) {
        hls = new Hls({
          backBufferLength: 10,
          maxBufferLength: 10,
          maxMaxBufferLength: 20,
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Events.ERROR, (_, data) => {
          if (data.fatal) setError(true);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source; // iOS Safari has no MSE, but plays HLS natively
        video.play().catch(() => {});
      } else {
        setError(true);
      }
    }, startDelay);

    return () => {
      clearTimeout(timer);
      hls?.destroy();
      if (started) sendCommand('videoStop');
    };
  }, [deviceId, channel, startDelay, retry, sendCommand]);

  return (
    <div
      className={cx(classes.tile, hidden && classes.tileHidden)}
      onClick={onToggleMaximize}
      role="presentation"
    >
      <video
        ref={videoRef}
        className={classes.player}
        autoPlay
        muted
        playsInline
        controls={maximized}
      />
      {error && (
        <div className={classes.overlay}>
          <Typography variant="body2">{t('errorConnection')}</Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={(event) => {
              event.stopPropagation();
              setRetry((value) => value + 1);
            }}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      )}
    </div>
  );
};

export default StreamPlayer;
