import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import ArrowBackIosNew from '@mui/icons-material/ArrowBackIosNew';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useEffectAsync, useCatch } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import CalendarLine from '../common/components/CalendarLine';
import TimelineMap from './TimelineMap';
import LineChartAttributes from '../common/components/LineChartAttributes';
import { formatNumericHours, formatPercentage, formatSpeed } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import TimelineIcon from '../resources/images/data/timeline.svg?react';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.default,
  },
  content: {
    overflow: 'auto',
    padding: theme.spacing(1.5),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gap: theme.spacing(1.5),
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    },
  },
  card: {
    borderRadius: theme.spacing(1.5),
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.25),
    background: theme.palette.background.paper,
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.75),
  },
  mapCard: {
    height: 360,
    [theme.breakpoints.down('md')]: {
      height: 300,
    },
  },
  chartCard: {
    height: 240,
  },
  emptyState: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
  },
}));

const TimelinePage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const { id } = useParams();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const speedUnit = useAttributePreference('speedUnit');

  const [from, setFrom] = useState(() => dayjs().startOf('day').toISOString());
  const [to, setTo] = useState(() => dayjs().endOf('day').toISOString());
  const [positions, setPositions] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [engineHours, setEngineHours] = useState(0);
  const [spentFuel, setSpentFuel] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);

  const deviceName = useSelector((state) => {
    const device = state.devices.items[id];
    return device?.name || null;
  });

  useEffectAsync(async () => {
    if (!id) {
      return;
    }

    const query = new URLSearchParams({
      deviceId: id,
      from,
      to,
    });

    const positionsResponse = await fetchOrThrow(`/api/positions?${query.toString()}`);
    const nextPositions = await positionsResponse.json();
    setPositions(nextPositions);

    const routeResponse = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    setRoutes(await routeResponse.json());

    const summaryResponse = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    const summaryRows = await summaryResponse.json();
    const summary = summaryRows.find(() => true) || {};
    setEngineHours(summary.engineHours || 0);
    setSpentFuel(summary.spentFuel || 0);
    setMaxSpeed(summary.maxSpeed || 0);
  }, [id, from, to]);

  const handleSubmit = useCatch(async ({ from: nextFrom, to: nextTo }) => {
    setFrom(nextFrom);
    setTo(nextTo);
  });

  const chartColumn = desktop ? 'span 4' : 'span 5';

  return (
    <div className={classes.root}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(4px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}1A 0%, ${theme.palette.background.default} 100%)`,
        }}
      >
        <Toolbar>
          <IconButton edge="start" sx={{ mr: 1 }} onClick={() => navigate(-1)}>
            <ArrowBackIosNew />
          </IconButton>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 1.25 }}>
            <TimelineIcon />
          </Avatar>
          <Typography variant="h6">{deviceName || t('reportReplay')}</Typography>
        </Toolbar>
      </AppBar>

      <CalendarLine handleSubmit={handleSubmit} dayslist={desktop ? 10 : 4} />

      <div className={classes.content}>
        <Box className={classes.grid}>
          <Paper className={classes.card} sx={{ gridColumn: desktop ? 'span 12' : 'span 5' }}>
            <Typography variant="h6" className={classes.title}>
              Timeline
            </Typography>
            <Box className={classes.mapCard}>
              {positions.length ? (
                <TimelineMap datapositions={positions} deviceId={id} />
              ) : (
                <Box className={classes.emptyState}>{t('sharedNoData')}</Box>
              )}
            </Box>
          </Paper>

          <Paper className={classes.card} sx={{ gridColumn: chartColumn }}>
            <Typography variant="h6" className={classes.title}>
              {`${t('reportEngineHours')} [${formatNumericHours(engineHours, t)}]`}
            </Typography>
            <Box className={classes.chartCard}>
              {routes.length ? (
                <LineChartAttributes
                  routesdata={routes}
                  attr="ignition"
                  min={0}
                  max={1.5}
                  interpola="step"
                  yaxistick={false}
                />
              ) : (
                <Box className={classes.emptyState}>{t('sharedNoData')}</Box>
              )}
            </Box>
          </Paper>

          <Paper className={classes.card} sx={{ gridColumn: chartColumn }}>
            <Typography variant="h6" className={classes.title}>
              {`${t('reportSpentFuel')} [${formatPercentage(spentFuel)}]`}
            </Typography>
            <Box className={classes.chartCard}>
              {routes.length ? (
                <LineChartAttributes routesdata={routes} attr="fuel" min={0} max={100} />
              ) : (
                <Box className={classes.emptyState}>{t('sharedNoData')}</Box>
              )}
            </Box>
          </Paper>

          <Paper className={classes.card} sx={{ gridColumn: chartColumn }}>
            <Typography variant="h6" className={classes.title}>
              {`${t('positionSpeed')} [Max: ${formatSpeed(maxSpeed, speedUnit, t)}]`}
            </Typography>
            <Box className={classes.chartCard}>
              {routes.length ? (
                <LineChartAttributes routesdata={routes} attr="speed" min={0} max={0} />
              ) : (
                <Box className={classes.emptyState}>{t('sharedNoData')}</Box>
              )}
            </Box>
          </Paper>

          <Paper className={classes.card} sx={{ gridColumn: chartColumn }}>
            <Typography variant="h6" className={classes.title}>
              {`${t('positionPower')} (${t('sharedVoltAbbreviation')})`}
            </Typography>
            <Box className={classes.chartCard}>
              {routes.length ? (
                <LineChartAttributes routesdata={routes} attr="power" min={0} max={36} />
              ) : (
                <Box className={classes.emptyState}>{t('sharedNoData')}</Box>
              )}
            </Box>
          </Paper>
        </Box>
      </div>
    </div>
  );
};

export default TimelinePage;
