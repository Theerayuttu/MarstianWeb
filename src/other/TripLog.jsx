import { Box, Paper, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RouteIcon from '@mui/icons-material/Route';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';
import {
  formatDistance,
  formatSpeed,
  formatTime,
  formatPercentage,
  formatNumericHours,
} from '../common/util/formatter';
import AddressValue from '../common/components/AddressValue';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    borderRadius: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2.5),
    background: theme.palette.background.paper,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  heading: {
    fontWeight: 800,
    color: theme.palette.primary.main,
  },
  timeline: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 13,
      top: 8,
      bottom: 8,
      width: 1,
      background: theme.palette.divider,
    },
  },
  entry: {
    position: 'relative',
    paddingLeft: theme.spacing(5),
    width: '100%',
    textAlign: 'left',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(1, 1, 1, 5),
    transition: 'background 0.15s ease',
    '&:hover': {
      background: theme.palette.action.hover,
    },
  },
  entrySelected: {
    background: theme.palette.action.selected,
    outline: `1px solid ${theme.palette.primary.main}`,
  },
  node: {
    position: 'absolute',
    left: 0.5,
    top: theme.spacing(1),
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: theme.palette.secondary.main,
    color: theme.palette.primary.contrastText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  time: {
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  address: {
    fontWeight: 700,
    fontSize: '0.8rem',
    color: theme.palette.text.primary,
    display: 'block',
  },
  stats: {
    marginTop: theme.spacing(0.5),
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  statValue: {
    fontWeight: 700,
    color: theme.palette.primary.main,
  },
  empty: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.text.secondary,
  },
}));

const TripLog = ({ trips, selectedTrip, onSelectTrip, isEv, loading }) => {
  const { classes, cx } = useStyles();
  const t = useTranslation();
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const spent = (trip) => (isEv ? trip.spentSoc : trip.spentFuel);

  return (
    <Paper elevation={0} className={classes.root}>
      <Typography variant="h6" className={classes.heading}>
        {t('reportTrips')}
      </Typography>

      {loading ? (
        <Box className={classes.empty}>{t('sharedLoading')}</Box>
      ) : trips.length ? (
        <Box className={classes.timeline}>
          {trips.map((trip) => {
            const selected = selectedTrip === trip;
            return (
              <button
                type="button"
                key={trip.startPositionId}
                className={cx(classes.entry, selected && classes.entrySelected)}
                onClick={() => onSelectTrip(trip)}
              >
                <span className={classes.node}>
                  <MyLocationIcon sx={{ fontSize: 16 }} />
                </span>
                <Typography className={classes.time}>
                  {`${formatTime(trip.startTime, 'time')} → ${formatTime(trip.endTime, 'time')} : (${formatNumericHours(trip.duration, t, 'h:m')})`}
                </Typography>
                <Typography component="span" className={classes.address}>
                  <AddressValue
                    latitude={trip.startLat}
                    longitude={trip.startLon}
                    originalAddress={null}
                    addressshow={true}
                    useQueue={false}
                  />
                </Typography>
                <Box className={classes.stats}>
                  <span>
                    <RouteIcon sx={{ fontSize: 13, verticalAlign: 'text-bottom', mr: 0.25 }} />
                    <strong className={classes.statValue}>
                      {formatDistance(trip.distance, distanceUnit, t)}
                    </strong>
                  </span>
                  <span>
                    {`${t('reportAverageSpeed')}: `}
                    <strong className={classes.statValue}>
                      {trip.averageSpeed > 0 ? formatSpeed(trip.averageSpeed, speedUnit, t) : '-'}
                    </strong>
                  </span>
                  <span>
                    {`${isEv ? t('reportSpentSoc') : t('reportSpentFuel')}: `}
                    <strong className={classes.statValue}>
                      {spent(trip) > 0 ? formatPercentage(spent(trip)) : '-'}
                    </strong>
                  </span>
                </Box>
              </button>
            );
          })}
        </Box>
      ) : (
        <Box className={classes.empty}>{t('sharedNoData')}</Box>
      )}
    </Paper>
  );
};

export default TripLog;
