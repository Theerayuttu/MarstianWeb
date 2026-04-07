import { Divider, List, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import { makeStyles } from 'tss-react/mui';
import { layoutPalette } from '../../common/theme/layoutTokens';

const useStyles = makeStyles()((theme) => ({
  sidebar: {
    background: layoutPalette.sidebarGradient,
    color: layoutPalette.sidebarTextPrimary,
    padding: theme.spacing(3, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minHeight: '100%',
  },
  navList: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  },
  navItem: {
    borderRadius: 14,
    padding: theme.spacing(1.2, 1.75),
    color: layoutPalette.sidebarTextMuted,
    transition: 'all 180ms ease',
    '& .MuiListItemIcon-root': {
      minWidth: 38,
      color: 'inherit',
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
  },
  navItemActive: {
    backgroundColor: layoutPalette.navItemActiveBackground,
    color: layoutPalette.accentContrast,
    boxShadow: layoutPalette.navItemActiveShadow,
    border: layoutPalette.navItemActiveBorder,
  },
  divider: {
    borderColor: layoutPalette.dividerSoft,
  },
}));

const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();
  const { classes, cx } = useStyles();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const buildLink = (path) => {
    const sourceParams = new URLSearchParams(location.search);
    const deviceIds = sourceParams.getAll('deviceId');
    const groupIds = sourceParams.getAll('groupId');
    if (!deviceIds.length && !groupIds.length) {
      return path;
    }
    const params = new URLSearchParams();
    if (path === '/reports/chart' || path === '/reports/route' || path === '/replay') {
      const [firstDeviceId] = deviceIds;
      if (firstDeviceId != null) {
        params.append('deviceId', firstDeviceId);
      }
    } else {
      deviceIds.forEach((deviceId) => params.append('deviceId', deviceId));
      groupIds.forEach((groupId) => params.append('groupId', groupId));
    }
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  };

  const primaryItems = [
    { title: t('reportCombined'), link: buildLink('/reports/combined'), icon: <StarIcon /> },
    { title: t('reportPositions'), link: buildLink('/reports/route'), icon: <TimelineIcon /> },
    { title: t('reportEvents'), link: buildLink('/reports/events'), icon: <NotificationsActiveIcon /> },
    { title: t('sharedGeofences'), link: buildLink('/reports/geofences'), icon: <PlaceIcon /> },
    { title: t('reportTrips'), link: buildLink('/reports/trips'), icon: <PlayCircleFilledIcon /> },
    { title: t('reportStops'), link: buildLink('/reports/stops'), icon: <PauseCircleFilledIcon /> },
    { title: t('reportSummary'), link: buildLink('/reports/summary'), icon: <FormatListBulletedIcon /> },
    { title: t('reportChart'), link: buildLink('/reports/chart'), icon: <TrendingUpIcon /> },
    { title: t('reportReplay'), link: buildLink('/replay'), icon: <RouteIcon /> },
  ];

  const secondaryItems = [
    { title: t('sharedLogs'), link: '/reports/logs', icon: <NotesIcon /> },
    !readonly && {
      title: t('reportScheduled'),
      link: '/reports/scheduled',
      icon: <EventRepeatIcon />,
    },
    admin && {
      title: t('statisticsTitle'),
      link: '/reports/statistics',
      icon: <BarChartIcon />,
    },
    admin && { title: t('reportAudit'), link: '/reports/audit', icon: <VerifiedUserIcon /> },
  ].filter(Boolean);

  const renderList = (items) => (
    <List className={classes.navList} disablePadding>
      {items.map((item) => {
        const selected = location.pathname === item.link;
        return (
          <ListItemButton
            key={item.link}
            component={Link}
            to={item.link}
            className={cx(classes.navItem, { [classes.navItemActive]: selected })}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.title} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box className={classes.sidebar}>
      {renderList(primaryItems)}
      <Divider className={classes.divider} sx={{ my: 1 }} />
      {renderList(secondaryItems)}
    </Box>
  );
};

export default ReportsMenu;
