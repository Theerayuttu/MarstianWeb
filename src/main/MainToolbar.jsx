import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  Box,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
  ListItemButton,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import ListIcon from '@mui/icons-material/List';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import DeviceRow from './DeviceRow';
import { layoutPalette } from '../common/theme/layoutTokens';
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '30%',
    [theme.breakpoints.down('md')]: {
      width: '100%',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    marginLeft: 'auto',
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    width: theme.dimensions.drawerWidthTablet,
  },
  plusIcon: {
    color: layoutPalette.accentContrast,
    background: layoutPalette.accentPrimary,
    borderRadius: '15%',
  },
}));

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
  onEventsClick,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const events = useSelector((state) => state.events.items);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const leftSectionRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);

  const deviceStatusCount = (status) =>
    Object.values(devices).filter((d) => d.status === status).length;

  return (
    <Toolbar className={classes.toolbar}>
      <Box ref={leftSectionRef} className={classes.leftSection}>
        <Tooltip title={devicesOpen ? 'Show map' : 'Show list'} arrow>
          <IconButton edge="start" onClick={() => setDevicesOpen(!devicesOpen)}>
            {devicesOpen ? <MapIcon /> : <ListIcon />}
          </IconButton>
        </Tooltip>
        <OutlinedInput
          ref={inputRef}
          placeholder={t('sharedSearchDevices')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setDevicesAnchorEl(leftSectionRef.current)}
          onBlur={() => setDevicesAnchorEl(null)}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => setFilterAnchorEl(inputRef.current)}
              >
                <Badge
                  color="info"
                  variant="dot"
                  invisible={!filter.statuses.length && !filter.groups.length}
                >
                  <TuneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </InputAdornment>
          }
          size="small"
          fullWidth
          sx={{
            backgroundColor: 'grey.100',
            borderRadius: '14px',
          }}
        />
        <IconButton
          edge="end"
          onClick={() => navigate('/settings/device')}
          disabled={deviceReadonly}
        >
          <Tooltip
            open={!deviceReadonly && Object.keys(devices).length === 0}
            title={t('deviceRegisterFirst')}
            arrow
          >
            <AddIcon className={classes.plusIcon} />
          </Tooltip>
        </IconButton>
      </Box>
      <Popover
        open={!!devicesAnchorEl && !devicesOpen}
        anchorEl={devicesAnchorEl}
        onClose={() => setDevicesAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: Number(theme.spacing(2).slice(0, -2)),
        }}
        marginThreshold={0}
        slotProps={{
          paper: {
            style: {
              width: `calc(${leftSectionRef.current?.clientWidth}px - ${theme.spacing(4)})`,
            },
          },
        }}
        elevation={1}
        disableAutoFocus
        disableEnforceFocus
      >
        {filteredDevices.slice(0, 5).map((_, index) => (
          <DeviceRow key={filteredDevices[index].id} devices={filteredDevices} index={index} />
        ))}
        {filteredDevices.length > 5 && (
          <ListItemButton alignItems="center" onClick={() => setDevicesOpen(true)}>
            <ListItemText primary={t('notificationAlways')} style={{ textAlign: 'center' }} />
          </ListItemButton>
        )}
      </Popover>
      <Popover
        open={!!filterAnchorEl}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div className={classes.filterPanel}>
          <FormControl>
            <InputLabel>{t('deviceStatus')}</InputLabel>
            <Select
              label={t('deviceStatus')}
              value={filter.statuses}
              onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
              multiple
            >
              <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
              <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
              <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>{t('settingsGroups')}</InputLabel>
            <Select
              label={t('settingsGroups')}
              value={filter.groups}
              onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
              multiple
            >
              {Object.values(groups)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl>
            <InputLabel>{t('sharedSortBy')}</InputLabel>
            <Select
              label={t('sharedSortBy')}
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">{'\u00a0'}</MenuItem>
              <MenuItem value="name">{t('sharedName')}</MenuItem>
              <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
            </Select>
          </FormControl>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={filterMap} onChange={(e) => setFilterMap(e.target.checked)} />
              }
              label={t('sharedFilterMap')}
            />
          </FormGroup>
        </div>
      </Popover>
      {desktop && (
        <Box className={classes.rightSection}>
          <Tooltip title={t('reportEvents')} arrow>
            <IconButton edge="end" onClick={onEventsClick}>
              <Badge color="error" badgeContent={events.length} max={99}>
                <CircleNotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          {/* <Tooltip title={t('loginLogout')} arrow>
          <IconButton edge="end" onClick={onLogout}>
            <ExitToAppIcon />
          </IconButton>
        </Tooltip> */}
        </Box>
      )}
    </Toolbar>
  );
};

export default MainToolbar;
