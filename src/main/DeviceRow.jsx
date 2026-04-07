import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton,
  Tooltip,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatBoolean,
  formatPercentage,
  formatStatus,
  getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  selected: {
    backgroundColor: theme.palette.action.selected,
  },
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const server = useSelector((state) => state.session.server);
  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const events = useSelector((state) => state.events.items.filter((e) =>  e.deviceId === item.id));
  const eventid = events[0];

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const serverDaysoffline = server?.attributes?.daysoffline;

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = resolveFieldValue(deviceSecondary);

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {secondaryValue && (
          <>
            {secondaryValue}
            {' • '}
          </>
        )}
        <span className={classes[getStatusColor(item.status)]}>{status}</span>
      </>
    );
  };

  function daysfromNow(xDate) {
    const currentDate = new Date();
    const pastDate = new Date(xDate);
    const timeDifference = currentDate - pastDate;
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    return daysDifference; // Return  number of days
  };

  const getStatusColorIcon = (item) => {
    switch (item.status) {
      case 'online':
      case 'unknown':
        if (daysfromNow(item.lastUpdate) >= serverDaysoffline) {
          return 'red';
        } else {
          return 'green';
        }
      case 'offline':
        return 'red';
      default:
        return 'gray';
    }
  };
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "online":
        return "success";
      case "offline":
        return "error";
      case "unknown":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={selectedDeviceId === item.id ? classes.selected : null}
      >
        <ListItemAvatar>
          <Avatar style={{ background: getStatusColorIcon(item) }} >
            <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={primaryValue}
          secondary={secondaryText()}
          slots={{
            primary: Typography,
            secondary: Typography,
          }}
          slotProps={{
            primary: { noWrap: true },
            secondary: { noWrap: true },
          }}
        />
        {position && (
          <>
            {position.attributes.hasOwnProperty('alarm') && (
              <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
                <IconButton size="small">
                  <ErrorIcon fontSize="small" className={classes.error} />
                </IconButton>
              </Tooltip>
            )}
            {/**Add Events Maintenance */}
            {eventid &&  (
              <>
                { (eventid.hasOwnProperty('type') && eventid.type === "maintenance" && eventid.deviceId === item.id) && (
                  <Tooltip title={`${eventid.attributes.message}`}>
                    <IconButton size="small">
                      <BuildCircleIcon fontSize="medium" className={classes.warning} />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
            {position.attributes.hasOwnProperty('ignition') && (
              <Tooltip title={position.attributes.output === 1 ? (t('commandEngineStop')) : (`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`)}>
                <IconButton size="small">
                  {position.attributes.ignition ? (
                    <EngineIcon width={25} height={25} className={position.attributes.output === 1 ? classes.error : classes.success} />
                  ) : (
                    <EngineIcon width={20} height={20} className={position.attributes.output === 1 ? classes.error : classes.neutral} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            {position.attributes.hasOwnProperty('ignition') && position.attributes.output === 1 && position.attributes.ignition && (
              <Tooltip title={`${t('alarmViolation')}`}>
                <IconButton size="small">
                  <GppMaybeIcon fontSize="small" className={classes.error} />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
