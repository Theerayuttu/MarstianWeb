import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Badge,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import DeviceList from './DeviceList';
import StatusCard from '../common/components/StatusCard';
import { devicesActions, sessionActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import MainMap from './MainMap';
import { useAttributePreference } from '../common/util/preferences';
import { layoutPalette } from '../common/theme/layoutTokens';
import SettingsIcon from '@mui/icons-material/Settings';
import ExploreIcon from '@mui/icons-material/Explore';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import AssessmentRounded from '@mui/icons-material/AssessmentRounded';
import MenuOpenRounded from '@mui/icons-material/MenuOpenRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useRestriction } from '../common/util/permissions';
import { nativePostMessage } from '../common/components/NativeInterface';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#eef2f7',
  },
  sidebar: {
    width: '240px',
    background: layoutPalette.sidebarGradient,
    color: layoutPalette.sidebarTextPrimary,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3, 2),
    gap: theme.spacing(3),
    transition: 'width 220ms ease, padding 220ms ease',
  },
  sidebarCollapsed: {
    width: '56px',
    padding: theme.spacing(3, 2),
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  brandAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: theme.spacing(0.5),
    backgroundColor: layoutPalette.brandAvatarBackground,
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
  },
  navList: {
    flex: 1,
    padding: 0,
    display: 'row',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  navItem: {
    borderRadius: 14,
    padding: theme.spacing(1.5, 2),
    color: layoutPalette.sidebarTextMuted,
    transition: 'all 180ms ease',
    '& .MuiListItemText-primary': {
      fontSize: '0.95rem',
    },
  },
  navItemActive: {
    backgroundColor: layoutPalette.navItemActiveBackground,
    color: layoutPalette.accentContrast,
    boxShadow: layoutPalette.navItemActiveShadow,
    border: layoutPalette.navItemActiveBorder,
  },
  navIcon: {
    color: 'inherit',
    minWidth: 42,
    '& .MuiSvgIcon-root': {
      fontSize: '1.4rem',
    },
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 1.5, 1, 1),
    borderRadius: 16,
    backgroundColor: layoutPalette.sidebarCardBackground,
    minWidth: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  userName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  collapseToggle: {
    alignSelf: 'flex-end',
    color: layoutPalette.sidebarTextPrimary,
    backgroundColor: layoutPalette.sidebarToggleBg,
    '&:hover': {
      backgroundColor: layoutPalette.sidebarToggleBgHover,
    },
  },
  workspace: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.1),
    padding: theme.spacing(0, 0, 0, 0),
    minHeight: '100vh',
  },
  topBar: {
    borderRadius: 0,
    padding: theme.spacing(0, 0),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    backgroundColor: '#fff',
    boxShadow: '0 25px 60px rgba(8, 22, 52, 0.12)',
  },
  topBarRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  mapSection: {
    position: 'relative',
    height: '100%',
    minHeight: 520,
    borderRadius: 0,
    background: 'linear-gradient(135deg, #DDE6F5 0%, #F4F6FB 100%)',
    boxShadow: '0 40px 80px rgba(7, 20, 45, 0.10)',
    overflow: 'hidden',
  },
  mapSurface: {
    width: '100%',
    height: '100%',
  },
  liveChip: {
    position: 'absolute',
    top: theme.spacing(3),
    left: theme.spacing(3),
    backgroundColor: '#fff',
    fontWeight: 700,
  },
  devicePanel: {
    position: 'absolute',
    left: theme.spacing(0),
    top: theme.spacing(0),
    width: theme.dimensions.drawerWidthDesktop,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 0,
    boxShadow: '0 35px 70px rgba(4, 25, 60, 0.35)',
    overflow: 'hidden',
    transition: 'opacity 200ms ease, transform 200ms ease',
  },
  devicePanelHidden: {
    opacity: 0,
    pointerEvents: 'none',
    transform: 'translateY(12px)',
  },
  sidebarDivider: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  userSubtitle: {
    color: layoutPalette.sidebarSubtitleText,
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    color: layoutPalette.accentContrast,
    borderColor: layoutPalette.logoutBorder,
    marginLeft: 'auto',
    textTransform: 'none',
    flexShrink: 0,
  },
  topIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  iconButton: {
    backgroundColor: '#f2f4fb',
    '&:hover': {
      backgroundColor: '#e8eafb',
    },
  },
  mobileBottomMenu: {
    width: '100%',
    position: 'sticky',
    bottom: 0,
    zIndex: 5,
    '& .MuiPaper-root': {
      borderRadius: 0,
    },
  },
  '@media (max-width: 1200px)': {
    devicePanel: {
      width: 320,
    },
  },
  [theme.breakpoints.down('md')]: {
    root: {
      flexDirection: 'column',
    },
    sidebar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing(0),
      gap: theme.spacing(0.5),
    },
    navList: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      overflowX: 'auto',
    },
    navItem: {
      minWidth: 100,
    },
    workspace: {
      padding: theme.spacing(0.5),
    },
    topBar: {
      borderRadius: 20,
    },
    mapSection: {
      borderRadius: 20,
      minHeight: 420,
    },
    devicePanel: {
      position: 'static',
      width: '100%',
      maxHeight: 'none',
      marginTop: theme.spacing(2),
      boxShadow: '0 12px 30px rgba(4,25,60,0.15)',
    },
  },
}));

const MainPage = () => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const devices = useSelector((state) => state.devices.items);
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);

  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find(
    (position) => selectedDeviceId && position.deviceId === selectedDeviceId,
  );

  const [filteredDevices, setFilteredDevices] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  useEffect(() => {
    //if (desktop) {
    //  setDevicesOpen(true);
    //} else {
    setDevicesOpen(false);
    //}
  }, [desktop]);

  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions,
  );

  const currentSelection = useMemo(() => {
    if (user && location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    if (location.pathname.startsWith('/reports')) {
      return 'reports';
    }
    if (location.pathname === '/') {
      return 'map';
    }
    return null;
  }, [location.pathname, user]);

  const handleLogout = useCallback(async () => {
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && user && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens:
              tokens.length > 1
                ? tokens.filter((it) => it !== notificationToken).join(',')
                : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  }, [dispatch, navigate, user]);

  const handleSelection = useCallback(
    (value) => {
      switch (value) {
        case 'map':
          navigate('/');
          break;
        case 'reports': {
          let id = selectedDeviceId;
          if (id == null) {
            const deviceIds = Object.keys(devices || {});
            if (deviceIds.length === 1) {
              [id] = deviceIds;
            }
          }

          if (id != null) {
            navigate(`/reports/combined?deviceId=${id}`);
          } else {
            navigate('/reports/combined');
          }
          break;
        }
        case 'settings':
          navigate('/settings/preferences?menu=true');
          break;
        case 'account':
          if (user) {
            navigate(`/settings/user/${user.id}`);
          }
          break;
        case 'logout':
          handleLogout();
          break;
        default:
          break;
      }
    },
    [devices, handleLogout, navigate, selectedDeviceId, user],
  );

  const navItems = useMemo(() => {
    const items = [
      { key: 'dashboard', label: 'Dashboard', icon: <DashboardRounded />, disabled: true },
      { key: 'map', label: t('mapTitle'), icon: <ExploreIcon /> },
    ];

    if (!disableReports) {
      items.push({ key: 'reports', label: t('reportTitle'), icon: <AssessmentRounded /> });
    }

    items.push({ key: 'settings', label: t('settingsTitle'), icon: <SettingsIcon /> });
    items.push(
      readonly
        ? { key: 'logout', label: t('loginLogout'), icon: <LogoutIcon /> }
        : { key: 'account', label: t('settingsUser'), icon: <PersonIcon /> },
    );

    return items;
  }, [disableReports, readonly, t]);

  const liveActiveCount =
    filteredPositions.length || filteredDevices.length || Object.keys(devices || {}).length || 0;
  const drawerWidth = desktop ? (sidebarCollapsed ? '56px' : '240px') : 0;

  return (
    <div className={classes.root}>
      {desktop && (
        <aside className={cx(classes.sidebar, { [classes.sidebarCollapsed]: sidebarCollapsed })}>
          <div className={classes.brand}>
            <Avatar className={classes.brandAvatar}>
              <img src="/marstianicon.png" alt="MARSTIAN" width="30%" />
            </Avatar>
            {!sidebarCollapsed && (
              <div>
                <Typography variant="h6" fontWeight={800} letterSpacing={0.5}>
                  Marstian
                </Typography>
                <Typography variant="caption">Fleet Management Pro</Typography>
              </div>
            )}
          </div>
          <IconButton
            size="small"
            className={classes.collapseToggle}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? <MenuRounded /> : <MenuOpenRounded />}
          </IconButton>
          <List className={classes.navList} disablePadding>
            {navItems.map((item) => (
              <ListItemButton
                key={item.key}
                disabled={item.disabled}
                onClick={() => !item.disabled && handleSelection(item.key)}
                className={cx(classes.navItem, {
                  [classes.navItemActive]: currentSelection === item.key,
                })}
              >
                <ListItemIcon className={classes.navIcon}>
                  {item.key === 'map' ? (
                    <Badge
                      color="error"
                      variant="dot"
                      overlap="circular"
                      invisible={socket !== false}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                )}
              </ListItemButton>
            ))}
          </List>
          <Divider className={classes.sidebarDivider} />
          <Box className={classes.userCard}>
            <Avatar>{user?.name?.[0]?.toUpperCase() || 'A'}</Avatar>
            {!sidebarCollapsed && (
              <>
                <div className={classes.userInfo}>
                  <Typography className={classes.userName} fontWeight={700}>
                    {user?.name || 'Admin User'}
                  </Typography>
                  <Typography variant="caption" className={classes.userSubtitle}>
                    {user?.email || user?.login || 'Super Admin'}
                  </Typography>
                </div>
                {!readonly && (
                  <>
                    <IconButton onClick={() => handleSelection('logout')}>
                      <LogoutIcon className={classes.logoutButton} />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        </aside>
      )}
      <div
        className={classes.workspace}
        style={{ paddingBottom: !desktop ? theme.spacing(7) : undefined }}
      >
        <Paper elevation={1} className={classes.topBar}>
          <div className={classes.topBarRow}>
            <MainToolbar
              filteredDevices={filteredDevices}
              devicesOpen={devicesOpen}
              setDevicesOpen={setDevicesOpen}
              keyword={keyword}
              setKeyword={setKeyword}
              filter={filter}
              setFilter={setFilter}
              filterSort={filterSort}
              setFilterSort={setFilterSort}
              filterMap={filterMap}
              setFilterMap={setFilterMap}
              onEventsClick={onEventsClick}
              onLogout={handleLogout}
            />
          </div>
        </Paper>
        <div className={classes.content}>
          <div className={classes.mapSection}>
            <div className={classes.mapSurface}>
              <MainMap
                filteredPositions={filteredPositions}
                selectedPosition={selectedPosition}
                onEventsClick={onEventsClick}
              />
            </div>
            <Chip
              className={classes.liveChip}
              label={`LIVE: ${liveActiveCount} Devices`}
              icon={
                <Box
                  component="span"
                  sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00C48C' }}
                />
              }
            />
            <Paper
              elevation={3}
              className={cx(classes.devicePanel, { [classes.devicePanelHidden]: !devicesOpen })}
            >
              <DeviceList devices={filteredDevices} />
            </Paper>
          </div>
        </div>
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={drawerWidth}
        />
      )}
    </div>
  );
};

export default MainPage;
