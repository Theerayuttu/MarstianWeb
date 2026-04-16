import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  TableFooter,
  Link,
  Tooltip,
  Box,
  Chip,
  Stack,
  Switch,
  Divider,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import LinkIcon from '@mui/icons-material/Link';
import TimelineIcon from '@mui/icons-material/Timeline';
import BlockIcon from '@mui/icons-material/Block';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import MileageIcon from '../../resources/images/data/mileage.svg?react';
import DevicetimeIcon from '../../resources/images/data/devicetime.svg?react';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { mapIconAttributes, mapIconAttributesKey } from '../attributes/useIconAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import fetchOrThrow from '../util/fetchOrThrow';
import AddressValue from './AddressValue';
import { formatNumericHours, formatTime, formatDistance } from '../util/formatter';

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth + 70,
  },
  mediaButton: {
    color: theme.palette.text.secondary,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: theme.spacing(0.5, 0.75, 0, 0),
  },
  categoryImage: {
    position: 'absolute',
    top: -40,
    left: '20%',
    transform: 'translateX(-50%)',
    width: 120,
    zIndex: 2,
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 2, 0, 2),
  },
  headerContent: {
    width: '100%',
    padding: theme.spacing(0.5),
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: {
    width: '28px',
    height: '28px',
  },
  statusCell: {
    minWidth: 0,
    width: '20%',
    maxWidth: '20%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statusText: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTableCell-sizeSmall:first-of-type': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
    backgroundColor: theme.palette.primary.main,
    borderRadius: 10,
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  },
  actionIcon: {
    color: theme.palette.common.white,
  },
}));

const StatusRow = ({ name, content }) => {
  const { classes } = useStyles({ desktopPadding: 0 });

  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2">{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">
          {content}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const StatusCell = ({ name, content, iconKey }) => {
  const { classes } = useStyles({ desktopPadding: 0 });
  const attributeKey = content?.props?.attribute || content?.props?.property || iconKey;

  return (
    <Box className={`${classes.statusCell} status-cell-item`}>
      <img
        className={classes.icon}
        src={mapIconAttributes[mapIconAttributesKey(attributeKey)]}
        alt={name}
      />
      <Typography variant="body2" className={classes.statusText}>
        {name}
      </Typography>
      <Typography variant="body2" color="textSecondary" className={classes.statusText}>
        {content}
      </Typography>
    </Box>
  );
};

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);
  const defaultItems = useSelector((state) => state.session.server.attributes.positionItems);

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference('positionItems', defaultItems || 'speed,address,totalDistance,course');

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);
  const [switchIcon, setSwitchIcon] = useState(false);

  const [removing, setRemoving] = useState(false);

  const handleChange = (event) => {
    setSwitchIcon(event.target.checked);
  };

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position]);

  const handleHoursClick = () => {
    if (!deviceReadonly && position?.deviceId) {
      navigate(`/settings/accumulators/${position.deviceId}`);
    }
  };

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            dragHandleClassName="draggable-header"
            style={{ position: 'relative' }}
          >
            <Card
              elevation={3}
              className={classes.card}
              sx={{ borderRadius: 3, overflow: 'visible' }}
            >
              {device?.category && (
                <Box
                  component="img"
                  src={`/images/${device.category}.png`}
                  className={classes.categoryImage}
                  draggable={false}
                />
              )}
              <div className={`${classes.mediaButton} draggable-header`}>
                <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                  <CloseIcon fontSize="medium" />
                </IconButton>
              </div>
              <div className={`${classes.header} draggable-header`}>
                <Box className={classes.headerContent}>
                  <Typography variant="body1" color="primary">
                    <strong>{device.name}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {position && (
                      <AddressValue
                        latitude={position.latitude}
                        longitude={position.longitude}
                        originalAddress={null}
                        addressshow={true}
                        useQueue={false}
                      />
                    )}
                  </Typography>
                </Box>
              </div>
              {position && (
                <CardContent className={classes.content}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      icon={position.attributes.output === 1 ? <BlockIcon /> : undefined}
                      label={
                        position.attributes.output === 1
                          ? 'BLOCKED'
                          : device.status === 'online' || device.status === 'unknown'
                            ? position.attributes.ignition
                              ? 'WORKING'
                              : 'PARKED'
                            : 'OFFLINE'
                      }
                      color={
                        device.status === 'offline' || position.attributes.output === 1
                          ? 'error'
                          : device.status === 'unknown'
                            ? 'default'
                            : position.attributes.ignition
                              ? 'success'
                              : 'info'
                      }
                    />
                    <Chip
                      icon={<WorkHistoryOutlinedIcon />}
                      label={formatNumericHours(position.attributes.hours || 0, t)}
                      variant="outlined"
                      onClick={handleHoursClick}
                      sx={{ border: 'unset' }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      icon={<MileageIcon />}
                      label={formatDistance(position.attributes.totalDistance || 0, 0, t)}
                      variant="outlined"
                      sx={{ border: 'unset' }}
                    />
                    <Chip
                      icon={<DevicetimeIcon />}
                      label={formatTime(position.deviceTime, 'seconds')}
                      variant="outlined"
                      sx={{ border: 'unset' }}
                    />
                    <Switch size="small" checked={switchIcon} onChange={handleChange} />
                  </Stack>

                  <Table size="small" classes={{ root: classes.table }}>
                    {!switchIcon ? (
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              divider={<Divider orientation="vertical" flexItem />}
                              sx={{
                                width: '100%',
                                flexWrap: 'nowrap',
                                overflow: 'hidden',
                                '& > .status-cell-item': {
                                  flex: '1 1 20%',
                                  minWidth: 0,
                                  maxWidth: '20%',
                                },
                              }}
                            >
                              {positionItems
                                .split(',')
                                .filter(
                                  (key) =>
                                    position.hasOwnProperty(key) ||
                                    position.attributes.hasOwnProperty(key),
                                )
                                .slice(0, 5)
                                .map((key) => (
                                  <StatusCell
                                    key={key}
                                    iconKey={key}
                                    name={positionAttributes[key]?.name || key}
                                    content={
                                      <PositionValue
                                        position={position}
                                        property={position.hasOwnProperty(key) ? key : null}
                                        attribute={position.hasOwnProperty(key) ? null : key}
                                      />
                                    }
                                  />
                                ))}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    ) : (
                      <TableBody>
                        {positionItems
                          .split(',')
                          .filter(
                            (key) =>
                              position.hasOwnProperty(key) ||
                              position.attributes.hasOwnProperty(key),
                          )
                          .map((key) => (
                            <StatusRow
                              key={key}
                              name={positionAttributes[key]?.name || key}
                              content={
                                <PositionValue
                                  position={position}
                                  property={position.hasOwnProperty(key) ? key : null}
                                  attribute={position.hasOwnProperty(key) ? null : key}
                                />
                              }
                            />
                          ))}
                      </TableBody>
                    )}
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className={classes.cell}>
                          <Typography variant="body2">
                            <Link component={RouterLink} to={`/positionlive/${deviceId}`}>
                              {t('sharedShowDetails')}
                            </Link>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              )}
              <CardActions classes={{ root: classes.actions }} disableSpacing>
                <Tooltip title={t('sharedExtra')}>
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={!position}
                  >
                    <PendingIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Timeline">
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={() => navigate(`/timeline/${deviceId}`)}
                    disabled={disableActions || !position}
                  >
                    <TimelineIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('reportReplay')}>
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                    disabled={disableActions || !position}
                  >
                    <RouteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('commandTitle')}>
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                    disabled={disableActions}
                  >
                    <PublishIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedEdit')}>
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={() => navigate(`/settings/device/${deviceId}`)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedConnections')}>
                  <IconButton
                    color="inherit"
                    className={classes.actionIcon}
                    onClick={() => navigate(`/settings/device/${deviceId}/connections`)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <LinkIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedRemove')}>
                  <IconButton
                    color="error"
                    onClick={() => setRemoving(true)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Rnd>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          {!readonly && <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>}
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
              <Typography color="secondary">{t('sharedShare')}</Typography>
            </MenuItem>
          )}
          <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/blockdevice`)}>
            <Typography color="error">{t('deviceBlockUsageMenu')}</Typography>
          </MenuItem>
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
