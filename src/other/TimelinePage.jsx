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
import RouteIcon from '@mui/icons-material/Route';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import SpeedIcon from '@mui/icons-material/Speed';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import EvStationIcon from '@mui/icons-material/EvStation';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useEffectAsync, useCatch } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import CalendarLine from '../common/components/CalendarLine';
import TimelineMap from './TimelineMap';
import TripLog from './TripLog';
import SummaryStat from './SummaryStat';
import LineChartAttributes from '../common/components/LineChartAttributes';
import { formatNumericHours, formatPercentage, formatSpeed } from '../common/util/formatter';
import {
  distanceFromMeters,
  distanceUnitString,
  speedFromKnots,
  speedUnitString,
} from '../common/util/converter';
import { useAttributePreference } from '../common/util/preferences';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { green } from '@mui/material/colors';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.default,
  },
  content: {
    overflow: 'auto',
    padding: theme.spacing(2),
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    },
  },
  statRow: {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  },
  chartRow: {
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: theme.spacing(2),
    [theme.breakpoints.down('lg')]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    },
  },
  card: {
    borderRadius: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    background: theme.palette.background.paper,
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: theme.shadows[3],
    },
  },
  title: {
    fontWeight: 800,
    fontSize: '0.7rem',
    letterSpacing: '0em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1.5),
  },
  mapCard: {
    height: 500,
    [theme.breakpoints.down('md')]: {
      height: 360,
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
  icon: {
    width: '32px',
    height: '32px',
    filter: 'brightness(0) invert(0)',
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
  const distanceUnit = useAttributePreference('distanceUnit');

  const [from, setFrom] = useState(() => dayjs().startOf('day').toISOString());
  const [to, setTo] = useState(() => dayjs().endOf('day').toISOString());
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const [distance, setDistance] = useState(0);
  const [engineHours, setEngineHours] = useState(0);
  const [spentFuel, setSpentFuel] = useState(0);
  const [spentSoc, setSpentSoc] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [avgSpeed, setAvgSpeed] = useState(0);

  const deviceName = useSelector((state) => {
    const device = state.devices.items[id];
    return device?.name || null;
  });

  const deviceModel = useSelector((state) => {
    const device = state.devices.items[id];
    return device?.model || device?.category || null;
  });

  const deviceCate = useSelector((state) => {
    const device = state.devices.items[id];
    return device?.category || null;
  });

  const isEv = deviceCate.substring(0, 2) === 'ev';

  useEffectAsync(async () => {
    if (!id) {
      return;
    }

    setSelectedTrip(null);
    setLoading(true);

    const query = new URLSearchParams({
      deviceId: id,
      from,
      to,
    });

    try {
      const routeResponse = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setRoutes(await routeResponse.json());

      const tripsResponse = await fetchOrThrow(`/api/reports/trips?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setTrips(await tripsResponse.json());

      const summaryResponse = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const summaryRows = await summaryResponse.json();
      const summary = summaryRows.find(() => true) || {};
      setDistance(summary.distance || 0);
      setEngineHours(summary.engineHours || 0);
      setSpentFuel(summary.spentFuel || 0);
      setSpentSoc(summary.spentSoc || 0);
      setMaxSpeed(summary.maxSpeed || 0);
      setAvgSpeed(summary.averageSpeed || 0);
    } finally {
      setLoading(false);
    }
  }, [id, from, to]);

  const handleSubmit = useCatch(async ({ from: nextFrom, to: nextTo }) => {
    setFrom(nextFrom);
    setTo(nextTo);
  });

  const onSelectTrip = (trip) => {
    setSelectedTrip((current) => (current === trip ? null : trip));
  };

  const renderContent = (hasData, node) => {
    if (loading) {
      return <Box className={classes.emptyState}>{t('sharedLoading')}</Box>;
    }
    if (!hasData) {
      return <Box className={classes.emptyState}>{t('sharedNoData')}</Box>;
    }
    return node;
  };

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
          <Avatar sx={{ mr: 1.25 }}>
            <img className={classes.icon} src={mapIcons[mapIconKey(deviceCate)]} alt="" />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {deviceName || t('reportReplay')}
            </Typography>
            {deviceModel && (
              <Typography variant="caption" color="text.secondary">
                {deviceModel}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <CalendarLine handleSubmit={handleSubmit} />

      <div className={classes.content}>
        <Box className={classes.grid}>
          <Box className={classes.statRow}>
            <SummaryStat
              label={isEv ? t('alarmPowerOn') : t('reportEngineHours')}
              value={loading ? t('sharedLoading') : formatNumericHours(engineHours, t)}
              icon={<WorkHistoryIcon />}
              accent={theme.palette.secondary.main}
              loading={loading}
            />
            <SummaryStat
              label={t('sharedDistance')}
              value={loading ? t('sharedLoading') : distanceFromMeters(distance, distanceUnit).toFixed(1)}
              unit={distanceUnitString(distanceUnit, t)}
              icon={<RouteIcon />}
              accent={theme.palette.secondary.main}
              loading={loading}
            />
            <SummaryStat
              label={t('reportAverageSpeed')}
              value={loading ? t('sharedLoading') : speedFromKnots(avgSpeed, speedUnit).toFixed(0)}
              unit={speedUnitString(speedUnit, t)}
              icon={<SpeedIcon />}
              accent={theme.palette.secondary.main}
              loading={loading}
            />
            <SummaryStat
              label={isEv ? t('reportSpentSoc') : t('reportSpentFuel')}
              value={loading ? t('sharedLoading') : formatPercentage(isEv ? spentSoc : spentFuel).replace('%', '')}
              unit="%"
              icon={isEv ? <EvStationIcon /> : <LocalGasStationIcon />}
              accent={theme.palette.secondary.main}
              loading={loading}
            />
          </Box>

          <Box
            className={classes.mapCard}
            sx={{ gridColumn: desktop ? 'span 8' : '1 / -1' }}
          >
            {!loading && routes.length ? (
              <TimelineMap datapositions={routes} deviceId={id} selectedTrip={selectedTrip} />
            ) : (
              <Paper elevation={0} className={classes.card} sx={{ height: '100%' }}>
                <Box className={classes.emptyState}>
                  {loading ? t('sharedLoading') : t('sharedNoData')}
                </Box>
              </Paper>
            )}
          </Box>

          <Box
            className={classes.mapCard}
            sx={{ gridColumn: desktop ? 'span 4' : '1 / -1' }}
          >
            <TripLog
              trips={trips}
              selectedTrip={selectedTrip}
              onSelectTrip={onSelectTrip}
              isEv={isEv}
              loading={loading}
            />
          </Box>

          <Box className={classes.chartRow}>
            <Paper elevation={0} className={classes.card}>
              <Typography className={classes.title}>
                {`${isEv ? t('alarmPowerOn') : t('reportEngineHours')} (On)`}
              </Typography>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr="ignition"
                    min={0}
                    max={1.5}
                    interpola="step"
                    yaxistick={false}
                    syncId="timelinePage"
                  />,
                )}
              </Box>
            </Paper>

            <Paper elevation={0} className={classes.card}>
              <Typography className={classes.title}>
                {`${isEv ? t('reportSpentSoc') : t('reportSpentFuel')} (%)`}
              </Typography>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr={isEv ? 'soc' : 'fuel'}
                    min={0}
                    max={100}
                    syncId="timelinePage"
                  />,
                )}
              </Box>
            </Paper>

            <Paper elevation={0} className={classes.card}>
              <Typography className={classes.title}>
                {`${t('positionSpeed')} (MAX:${speedFromKnots(maxSpeed, speedUnit).toFixed(0)} ${speedUnitString(speedUnit, t)})`}
              </Typography>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr="speed"
                    min={0}
                    max={0}
                    syncId="timelinePage"
                  />,
                )}
              </Box>
            </Paper>

            <Paper elevation={0} className={classes.card}>
              <Typography className={classes.title}>
                {`${t('positionPower')} (${isEv ? 'kW' : t('sharedVoltAbbreviation')})`}
              </Typography>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr={isEv ? 'remainingPower' : 'power'}
                    min={0}
                    max={isEv ? 100 : 30}
                    syncId="timelinePage"
                  />,
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default TimelinePage;
