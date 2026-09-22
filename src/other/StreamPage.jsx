import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Typography, IconButton, Toolbar, Paper, TextField, MenuItem } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useTranslation } from '../common/components/LocalizationProvider';
import BackIcon from '../common/components/BackIcon';
import usePersistedState from '../common/util/usePersistedState';
import StreamPlayer from './StreamPlayer';

const maxChannels = 9;
const startInterval = 800;

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    flexWrap: 'wrap',
    rowGap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      paddingBlockEnd: theme.spacing(1),
    },
  },
  title: {
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  controls: {
    display: 'flex',
    gap: theme.spacing(1),
    marginInlineStart: theme.spacing(1),
    // on narrow screens the controls drop to their own full-width row so the
    // back button, device name and play button always stay visible
    [theme.breakpoints.down('sm')]: {
      order: 1,
      flexBasis: '100%',
      marginInlineStart: 0,
    },
  },
  control: {
    width: 120,
    flexShrink: 0,
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      flex: '1 1 0',
      minWidth: 0,
    },
  },
  grid: {
    flexGrow: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--stream-columns, 2), minmax(0, 1fr))',
    gridAutoRows: '1fr',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    background: theme.palette.common.black,
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
      gridAutoRows: 'auto',
      overflowY: 'auto',
    },
  },
}));

const StreamPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const [searchParams] = useSearchParams();
  const deviceId = searchParams.get('deviceId');
  const device = useSelector((state) => state.devices.items[deviceId]);

  const [mode, setMode] = usePersistedState('streamMode', 'single');
  const [channel, setChannel] = usePersistedState('streamChannel', 1);
  const [channelCount, setChannelCount] = usePersistedState('streamChannelCount', 4);
  const [layout, setLayout] = usePersistedState('streamLayout', 2);

  const [activeChannels, setActiveChannels] = useState(null);
  const [maximized, setMaximized] = useState(null);

  const playing = activeChannels !== null;
  const multi = mode === 'multi';

  const columns = playing ? Math.min(layout, activeChannels.length) : layout;

  const handleToggle = () => {
    if (playing) {
      setActiveChannels(null);
      setMaximized(null);
    } else if (multi) {
      setActiveChannels(Array.from({ length: channelCount }, (_, index) => index + 1));
    } else {
      setActiveChannels([channel]);
    }
  };

  const clamp = (value) => Math.min(Math.max(Number(value) || 1, 1), maxChannels);

  return (
    <div className={classes.root}>
      <Paper square>
        <Toolbar className={classes.toolbar}>
          <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {device?.name || t('linkLiveVideo')}
          </Typography>
          <div className={classes.controls}>
            <TextField
              select
              size="small"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              label={t('streamMode')}
              disabled={playing}
              className={classes.control}
            >
              <MenuItem value="single">{t('streamModeSingle')}</MenuItem>
              <MenuItem value="multi">{t('streamModeMulti')}</MenuItem>
            </TextField>
            <TextField
              size="small"
              type="number"
              value={multi ? channelCount : channel}
              onChange={(event) =>
                multi
                  ? setChannelCount(clamp(event.target.value))
                  : setChannel(clamp(event.target.value))
              }
              label={multi ? t('streamChannelCount') : t('commandIndex')}
              disabled={playing}
              className={classes.control}
            />
            {multi && (
              <TextField
                select
                size="small"
                value={layout}
                onChange={(event) => setLayout(Number(event.target.value))}
                label={t('streamLayout')}
                className={classes.control}
              >
                <MenuItem value={1}>1x1</MenuItem>
                <MenuItem value={2}>2x2</MenuItem>
                <MenuItem value={3}>3x3</MenuItem>
              </TextField>
            )}
          </div>
          <IconButton
            edge="end"
            sx={{ ml: 1 }}
            color={playing ? 'error' : 'primary'}
            onClick={handleToggle}
          >
            {playing ? <StopIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Toolbar>
      </Paper>
      {playing && (
        <div
          className={classes.grid}
          style={{ '--stream-columns': maximized !== null ? 1 : columns }}
        >
          {activeChannels.map((item, index) => (
            <StreamPlayer
              key={`${deviceId}-${item}`}
              deviceId={deviceId}
              channel={item}
              startDelay={index * startInterval}
              hidden={maximized !== null && maximized !== item}
              maximized={maximized === item}
              onToggleMaximize={() => setMaximized((value) => (value === item ? null : item))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamPage;
