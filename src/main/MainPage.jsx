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
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
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
import dayjs from 'dayjs';
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
import fetchOrThrow from '../common/util/fetchOrThrow';
import { formatDistance } from '../common/util/formatter';

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
    padding: theme.spacing(2),
  },
  contentMap: {
    padding: 0,
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
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: theme.spacing(2),
  },
  mapCard: {
    position: 'relative',
    minHeight: 500,
    borderRadius: 12,
    border: '1px solid #d6deea',
    overflow: 'hidden',
  },
  mapSurface: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 999,
    fontWeight: 700,
    fontSize: '0.78rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.8),
    padding: theme.spacing(0.5, 1),
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#00C48C',
  },
  metricsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  devicePanel: {
    position: 'absolute',
    left: theme.spacing(0),
    top: theme.spacing(0),
    zIndex: 3,
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
  totalsCard: {
    padding: theme.spacing(2.5),
    background: 'linear-gradient(160deg, #001f52 0%, #07285f 100%)',
    color: '#f5f8ff',
    borderRadius: 10,
  },
  totalsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
  },
  totalsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing(1.2),
  },
  totalMetricTile: {
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: theme.spacing(1.5),
  },
  avgCard: {
    borderRadius: 10,
    border: '1px solid #d6deea',
    padding: theme.spacing(2.5),
    backgroundColor: '#f9fbff',
    minHeight: 170,
  },
  activeCard: {
    marginTop: theme.spacing(2),
    borderRadius: 12,
    border: '1px solid #dce3ef',
    overflow: 'hidden',
  },
  activeCardHeader: {
    padding: theme.spacing(2.5, 3),
    borderBottom: '1px solid #e5ebf4',
    backgroundColor: '#f7f9fd',
  },
  tableHeadCell: {
    fontWeight: 700,
    fontSize: '0.76rem',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    color: '#6f7f95',
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
    content: {
      padding: theme.spacing(1.5, 0.5),
    },
    mapSection: {
      borderRadius: 20,
      minHeight: 420,
    },
    dashboardGrid: {
      gridTemplateColumns: '1fr',
    },
    mapCard: {
      minHeight: 340,
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

const MS_PER_HOUR = 3600000;

const isDeviceActive = (summary) =>
  ['distance', 'engineHours', 'spentFuel', 'startHours', 'endHours'].some(
    (key) => Number(summary?.[key] || 0) > 0,
  );

const MainPage = () => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);
  const distanceUnit = useAttributePreference('distanceUnit');

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
  const [summaryItems, setSummaryItems] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const isDashboardPage = location.pathname === '/dashboard';

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

  useEffect(() => {
    if (!isDashboardPage) {
      setSummaryItems([]);
      setSummaryLoading(false);
      return () => {};
    }

    let cancelled = false;

    const loadSummary = async () => {
      const from = dayjs().startOf('day').toISOString();
      const to = dayjs().endOf('day').toISOString();
      const query = new URLSearchParams({ from, to, daily: 'true' });

      setSummaryLoading(true);
      try {
        const response = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });

        if (!cancelled) {
          setSummaryItems(await response.json());
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [isDashboardPage]);

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
    if (location.pathname === '/dashboard') {
      return 'dashboard';
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
        case 'dashboard':
          navigate('/dashboard');
          break;
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
      { key: 'dashboard', label: 'Dashboard', icon: <DashboardRounded /> },
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

  const devicesList = useMemo(() => Object.values(devices || {}), [devices]);

  const summaryByDeviceId = useMemo(() => {
    const mapped = {};
    summaryItems.forEach((item) => {
      if (item?.deviceId && !mapped[item.deviceId]) {
        mapped[item.deviceId] = item;
      }
    });
    return mapped;
  }, [summaryItems]);

  const summaryRows = useMemo(() => Object.values(summaryByDeviceId), [summaryByDeviceId]);

  const activeDevices = useMemo(
    () =>
      summaryRows
        .filter(isDeviceActive)
        .map((summary) => {
          const device = devices[summary.deviceId];
          if (!device) {
            return null;
          }
          return {
            device,
            summary,
            position: positions[summary.deviceId],
          };
        })
        .filter(Boolean)
        .sort((a, b) => Number(b.summary.engineHours || 0) - Number(a.summary.engineHours || 0)),
    [devices, positions, summaryRows],
  );

  const counts = useMemo(() => {
    const total = devicesList.length;
    const online = devicesList.filter((device) => device.status === 'online').length;
    const offline = devicesList.filter((device) => device.status === 'offline').length;
    const working = activeDevices.filter(
      ({ position, summary }) =>
        position?.attributes?.ignition || Number(summary.engineHours || 0) > 0,
    ).length;
    const parked = Math.max(activeDevices.length - working, 0);

    return {
      total,
      online,
      offline,
      working,
      parked,
    };
  }, [activeDevices, devicesList]);

  const averageWorkingHours = useMemo(() => {
    const nonZeroEngineHours = summaryRows
      .map((item) => Number(item.engineHours || 0))
      .filter((value) => value !== 0);

    if (!nonZeroEngineHours.length) {
      return 0;
    }

    const totalEngineHours = nonZeroEngineHours.reduce(
      (accumulator, value) => accumulator + value,
      0,
    );
    return totalEngineHours / nonZeroEngineHours.length / MS_PER_HOUR;
  }, [summaryRows]);

  const activeSummary = useMemo(() => {
    const activeCount = activeDevices.length;
    const distanceSum = activeDevices.reduce(
      (accumulator, item) => accumulator + Number(item.summary.distance || 0),
      0,
    );
    const startOdometerSum = activeDevices.reduce(
      (accumulator, item) => accumulator + Number(item.summary.startOdometer || 0),
      0,
    );
    const endOdometerSum = activeDevices.reduce(
      (accumulator, item) => accumulator + Number(item.summary.endOdometer || 0),
      0,
    );
    const engineHoursSum = activeDevices.reduce(
      (accumulator, item) => accumulator + Number(item.summary.engineHours || 0),
      0,
    );
    const nonZeroSpentFuel = activeDevices
      .map((item) => Number(item.summary.spentFuel || 0))
      .filter((value) => value !== 0);
    const spentFuelAvg =
      nonZeroSpentFuel.length > 0
        ? nonZeroSpentFuel.reduce((accumulator, value) => accumulator + value, 0) /
          nonZeroSpentFuel.length
        : 0;
    const maxSpeedMax = activeDevices.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.summary.maxSpeed || 0)),
      0,
    );
    const nonZeroAverageSpeed = activeDevices
      .map((item) => Number(item.summary.averageSpeed || 0))
      .filter((value) => value !== 0);
    const averageSpeedAvg =
      nonZeroAverageSpeed.length > 0
        ? nonZeroAverageSpeed.reduce((accumulator, value) => accumulator + value, 0) /
          nonZeroAverageSpeed.length
        : 0;

    return {
      activeCount,
      distanceSum,
      startOdometerSum,
      endOdometerSum,
      engineHoursSum,
      spentFuelAvg,
      maxSpeedMax,
      averageSpeedAvg,
    };
  }, [activeDevices]);

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
        <div className={cx(classes.content, !isDashboardPage && classes.contentMap)}>
          {!isDashboardPage ? (
            <div className={classes.mapSection}>
              <div className={classes.mapSurface}>
                <MainMap
                  filteredPositions={filteredPositions}
                  selectedPosition={selectedPosition}
                  onEventsClick={onEventsClick}
                />
              </div>
              <Chip
                className={classes.liveBadge}
                label={`LIVE: ${liveActiveCount} Devices`}
                icon={<span className={classes.liveDot} />}
              />
              <Paper
                elevation={3}
                className={cx(classes.devicePanel, { [classes.devicePanelHidden]: !devicesOpen })}
              >
                <DeviceList devices={filteredDevices} />
              </Paper>
            </div>
          ) : (
            <>
              <div className={classes.dashboardGrid}>
                <Paper elevation={0} className={classes.mapCard}>
                  <div className={classes.liveBadge}>
                    <span className={classes.liveDot} /> LIVE: {liveActiveCount} Devices
                  </div>
                  <div className={classes.mapSurface}>
                    <MainMap
                      filteredPositions={filteredPositions}
                      selectedPosition={selectedPosition}
                      onEventsClick={onEventsClick}
                    />
                  </div>
                </Paper>

                <div className={classes.metricsStack}>
                  <Paper elevation={0} className={classes.totalsCard}>
                    <div className={classes.totalsHeader}>
                      <div>
                        <Typography variant="overline" sx={{ color: 'rgba(220,231,255,0.8)' }}>
                          Total Devices
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                          {counts.total}
                        </Typography>
                      </div>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.14)', width: 42, height: 42 }}>
                        <DashboardRounded />
                      </Avatar>
                    </div>
                    <div className={classes.totalsGrid}>
                      <div className={classes.totalMetricTile}>
                        <Typography variant="caption" color="rgba(220,231,255,0.7)">
                          Online
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#7cf5c4">
                          {counts.online}
                        </Typography>
                      </div>
                      <div className={classes.totalMetricTile}>
                        <Typography variant="caption" color="rgba(220,231,255,0.7)">
                          Offline
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#ff7d7d">
                          {counts.offline}
                        </Typography>
                      </div>
                      <div className={classes.totalMetricTile}>
                        <Typography variant="caption" color="rgba(220,231,255,0.7)">
                          Working
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#7cf5c4">
                          {counts.working}
                        </Typography>
                      </div>
                      <div className={classes.totalMetricTile}>
                        <Typography variant="caption" color="rgba(220,231,255,0.7)">
                          Parked
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {counts.parked}
                        </Typography>
                      </div>
                    </div>
                  </Paper>

                  <Paper elevation={0} className={classes.avgCard}>
                    <Typography variant="overline" color="text.secondary">
                      AVG. Working Hours
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                      <Typography variant="h3" fontWeight={700} color="#041c4d">
                        {averageWorkingHours.toFixed(1)}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        hrs/day
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                      Based on current day summary from all devices
                    </Typography>
                  </Paper>
                </div>
              </div>

              <Paper elevation={0} className={classes.activeCard}>
                <div className={classes.activeCardHeader}>
                  <Typography variant="h5" fontWeight={700} color="#0a2051">
                    Active Devices
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active status of tracker modules in the field
                  </Typography>
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.tableHeadCell}>Active Devices</TableCell>
                      <TableCell className={classes.tableHeadCell}>Distance (Sum)</TableCell>
                      <TableCell className={classes.tableHeadCell}>Start Odometer (Sum)</TableCell>
                      <TableCell className={classes.tableHeadCell}>End Odometer (Sum)</TableCell>
                      <TableCell className={classes.tableHeadCell}>Engine Hours (Sum)</TableCell>
                      <TableCell className={classes.tableHeadCell}>maxSpeed (Max)</TableCell>
                      <TableCell className={classes.tableHeadCell}>averageSpeed (Avg.)</TableCell>
                      <TableCell className={classes.tableHeadCell}>Spent Fuel (Avg.)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaryLoading && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={26} />
                        </TableCell>
                      </TableRow>
                    )}

                    {!summaryLoading && (
                      <TableRow>
                        <TableCell>{activeSummary.activeCount}</TableCell>
                        <TableCell>
                          {formatDistance(activeSummary.distanceSum, distanceUnit, t)}
                        </TableCell>
                        <TableCell>
                          {formatDistance(activeSummary.startOdometerSum, distanceUnit, t)}
                        </TableCell>
                        <TableCell>
                          {formatDistance(activeSummary.endOdometerSum, distanceUnit, t)}
                        </TableCell>
                        <TableCell>
                          {(activeSummary.engineHoursSum / MS_PER_HOUR).toFixed(1)} h
                        </TableCell>
                        <TableCell>{activeSummary.maxSpeedMax.toFixed(1)}</TableCell>
                        <TableCell>{activeSummary.averageSpeedAvg.toFixed(1)}</TableCell>
                        <TableCell>{activeSummary.spentFuelAvg.toFixed(1)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
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
