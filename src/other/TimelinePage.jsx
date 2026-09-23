import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, useMediaQuery, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useEffectAsync, useCatch } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import CalendarLine from '../common/components/CalendarLine';
import TimelineMap from './TimelineMap';
import TripLog from './TripLog';
import LineChartAttributes from '../common/components/LineChartAttributes';
import { formatNumericHours, formatPercentage, formatVolume } from '../common/util/formatter';
import { speedFromKnots, speedUnitString, volumeUnitString } from '../common/util/converter';
import { useAttributePreference } from '../common/util/preferences';
import fetchOrThrow from '../common/util/fetchOrThrow';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import EvStationIcon from '@mui/icons-material/EvStation';
import SpeedIcon from '@mui/icons-material/Speed';
import NotesIcon from '@mui/icons-material/Notes';
import BoltIcon from '@mui/icons-material/Bolt';

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
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
    // Title takes the free space so every chip after it stays grouped on the right.
    '& > :first-child': {
      marginRight: 'auto',
      marginBottom: 0,
    },
  },
  title: {
    fontWeight: 800,
    fontSize: '0.875rem',
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
    height: 210,
  },
  deviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  deviceImage: {
    height: 64,
    width: 'auto',
    objectFit: 'contain',
  },
  deviceName: {
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  deviceModel: {
    color: theme.palette.text.secondary,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
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
  const showDeviceInfo = useMediaQuery(theme.breakpoints.up('sm'));
  const speedUnit = useAttributePreference('speedUnit');
  //const distanceUnit = useAttributePreference('distanceUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

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
  const [powerRange, setPowerRange] = useState({ min: 0, max: 0, count: 0 });

  const device = useSelector((state) => state.devices.items[id]);
  const deviceCate = device?.category || null;
  const fuelVolume = device?.attributes?.fuelVolume || false;
  const fuelFullTank = device?.attributes?.fuelFullTank || 100;

  const isEv = deviceCate?.substring(0, 2) === 'ev';

  useEffectAsync(async () => {
    if (!id) {
      return;
    }

    setSelectedTrip(null);
    setLoading(true);
    // The chart unmounts while loading and when a day has no data, so it cannot
    // report a new range - clear it here or the previous day's values would stick.
    setPowerRange({ min: 0, max: 0, count: 0 });

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
      <CalendarLine
        handleSubmit={handleSubmit}
        onBack={() => navigate(-1)}
        endAction={
          showDeviceInfo &&
          device && (
            <Box className={classes.deviceInfo}>
              {deviceCate && (
                <Box
                  component="img"
                  src={`/images/${deviceCate}.png`}
                  className={classes.deviceImage}
                  draggable={false}
                  alt=""
                />
              )}
              <Box>
                <Typography variant="h7" className={classes.deviceName}>
                  {device.name}
                </Typography>
                <Typography variant="body2" className={classes.deviceModel}>
                  {device.model}
                </Typography>
              </Box>
            </Box>
          )
        }
      />

      <div className={classes.content}>
        <Box className={classes.grid}>
          <Box className={classes.mapCard} sx={{ gridColumn: desktop ? 'span 8' : '1 / -1' }}>
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

          <Box className={classes.mapCard} sx={{ gridColumn: desktop ? 'span 4' : '1 / -1' }}>
            <TripLog
              trips={trips}
              selectedTrip={selectedTrip}
              onSelectTrip={onSelectTrip}
              isEv={isEv}
              loading={loading}
              totalDistance={distance}
            />
          </Box>

          <Box className={classes.chartRow}>
            <Paper elevation={0} className={classes.card}>
              <Box className={classes.cardHeader}>
                <Typography className={classes.title}>
                  {isEv ? t('alarmPowerOn') : t('reportEngineHours')}
                </Typography>
                <Chip
                  color="secondary"
                  size="small"
                  icon={<QueryBuilderIcon />}
                  label={`${loading ? '---' : formatNumericHours(engineHours, t)}`}
                />
              </Box>
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
              <Box className={classes.cardHeader}>
                <Typography className={classes.title}>
                  {`${isEv ? t('reportSpentSoc') : t('reportSpentFuel')} (${fuelVolume ? volumeUnitString(volumeUnit, t) : '%'})`}
                </Typography>
                <Chip
                  color="secondary"
                  size="small"
                  icon={isEv ? <EvStationIcon /> : <LocalGasStationIcon />}
                  label={`${loading ? '---' : fuelVolume ? formatVolume(spentFuel, volumeUnit, t) : formatPercentage(isEv ? spentSoc : spentFuel)}`}
                />
              </Box>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr={isEv ? 'soc' : 'fuel'}
                    min={0}
                    max={fuelFullTank}
                    syncId="timelinePage"
                  />,
                )}
              </Box>
            </Paper>

            <Paper elevation={0} className={classes.card}>
              <Box className={classes.cardHeader}>
                <Typography className={classes.title}>{`${t('positionSpeed')}`}</Typography>
                <Chip
                  color="secondary"
                  size="small"
                  icon={<SpeedIcon />}
                  label={`Max ${loading ? '---' : speedFromKnots(maxSpeed, speedUnit).toFixed(0)} ${speedUnitString(speedUnit, t)}`}
                />
                <Chip
                  color="secondary"
                  size="small"
                  icon={<NotesIcon />}
                  label={`Avg ${loading ? '---' : speedFromKnots(avgSpeed, speedUnit).toFixed(0)} ${speedUnitString(speedUnit, t)}`}
                />
              </Box>
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
              <Box className={classes.cardHeader}>
                <Typography className={classes.title}>
                  {`${t('positionPower')} (${isEv ? 'kW' : t('sharedVoltAbbreviation')})`}
                </Typography>
                <Chip
                  color="secondary"
                  size="small"
                  icon={<BoltIcon />}
                  label={`Max ${loading || !powerRange.count ? '---' : powerRange.max.toFixed(1)} ${isEv ? 'kW' : t('sharedVoltAbbreviation')}`}
                />
              </Box>
              <Box className={classes.chartCard}>
                {renderContent(
                  routes.length,
                  <LineChartAttributes
                    routesdata={routes}
                    attr={isEv ? 'remainingPower' : 'power'}
                    min={0}
                    max={isEv ? 100 : 48}
                    syncId="timelinePage"
                    onRangeChange={setPowerRange}
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
