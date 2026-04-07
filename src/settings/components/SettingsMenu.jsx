import { Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import DrawIcon from '@mui/icons-material/Draw';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import SendIcon from '@mui/icons-material/Send';
import DnsIcon from '@mui/icons-material/Dns';
import HelpIcon from '@mui/icons-material/Help';
import PaymentIcon from '@mui/icons-material/Payment';
import CampaignIcon from '@mui/icons-material/Campaign';
import CalculateIcon from '@mui/icons-material/Calculate';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import { makeStyles } from 'tss-react/mui';
import { layoutPalette } from '../../common/theme/layoutTokens';

const useStyles = makeStyles()((theme) => ({
  sidebar: {
    background: layoutPalette.sidebarGradient,
    color: layoutPalette.sidebarTextPrimary,
    padding: theme.spacing(2.5, 2),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minHeight: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navList: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  },
  navItem: {
    borderRadius: 14,
    padding: theme.spacing(1.1, 1.5),
    color: layoutPalette.sidebarTextMuted,
    transition: 'all 160ms ease',
    '& .MuiListItemIcon-root': {
      minWidth: 38,
      color: 'inherit',
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
    },
  },
  navItemActive: {
    background: layoutPalette.navItemActiveBackground,
    color: layoutPalette.accentContrast,
    boxShadow: layoutPalette.navItemActiveShadow,
    border: layoutPalette.navItemActiveBorder,
  },
  divider: {
    borderColor: layoutPalette.divider,
  },
}));

const SettingsMenu = () => {
  const t = useTranslation();
  const location = useLocation();
  const { classes, cx } = useStyles();

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector((state) => state.session.server.attributes.support);
  const billingLink = useSelector((state) => state.session.user.attributes.billingLink);

  const features = useFeatures();

  const buildItem = (title, link, icon, selected, options = {}) => ({
    title,
    link,
    icon,
    selected,
    ...options,
  });

  const primaryItems = [
    buildItem(t('sharedPreferences'), '/settings/preferences', <TuneIcon />, location.pathname === '/settings/preferences'),
  ];

  if (!readonly) {
    primaryItems.push(
      buildItem(
        t('sharedNotifications'),
        '/settings/notifications',
        <NotificationsIcon />,
        location.pathname.startsWith('/settings/notification'),
      ),
      buildItem(
        t('settingsUser'),
        `/settings/user/${userId}`,
        <PersonIcon />,
        location.pathname === `/settings/user/${userId}`,
      ),
      buildItem(
        t('deviceTitle'),
        '/settings/devices',
        <DnsIcon />,
        location.pathname.startsWith('/settings/device'),
      ),
      buildItem(
        t('sharedGeofences'),
        '/geofences',
        <DrawIcon />,
        location.pathname.startsWith('/settings/geofence'),
      ),
    );

    if (!features.disableGroups) {
      primaryItems.push(
        buildItem(
          t('settingsGroups'),
          '/settings/groups',
          <FolderIcon />,
          location.pathname.startsWith('/settings/group'),
        ),
      );
    }
    if (!features.disableDrivers) {
      primaryItems.push(
        buildItem(
          t('sharedDrivers'),
          '/settings/drivers',
          <PersonIcon />,
          location.pathname.startsWith('/settings/driver'),
        ),
      );
    }
    if (!features.disableCalendars) {
      primaryItems.push(
        buildItem(
          t('sharedCalendars'),
          '/settings/calendars',
          <TodayIcon />,
          location.pathname.startsWith('/settings/calendar'),
        ),
      );
    }
    if (!features.disableComputedAttributes) {
      primaryItems.push(
        buildItem(
          t('sharedComputedAttributes'),
          '/settings/attributes',
          <CalculateIcon />,
          location.pathname.startsWith('/settings/attribute'),
        ),
      );
    }
    if (!features.disableMaintenance) {
      primaryItems.push(
        buildItem(
          t('sharedMaintenance'),
          '/settings/maintenances',
          <BuildIcon />,
          location.pathname.startsWith('/settings/maintenance'),
        ),
      );
    }
    if (!features.disableSavedCommands) {
      primaryItems.push(
        buildItem(
          t('sharedSavedCommands'),
          '/settings/commands',
          <SendIcon />,
          location.pathname.startsWith('/settings/command'),
        ),
      );
    }
  }

  if (billingLink) {
    primaryItems.push(buildItem(t('userBilling'), billingLink, <PaymentIcon />, false, { external: true }));
  }
  if (supportLink) {
    primaryItems.push(buildItem(t('settingsSupport'), supportLink, <HelpIcon />, false, { external: true }));
  }

  const managerItems = [];
  if (manager) {
    managerItems.push(
      buildItem(
        t('serverAnnouncement'),
        '/settings/announcement',
        <CampaignIcon />,
        location.pathname === '/settings/announcement',
      ),
    );
    if (admin) {
      managerItems.push(
        buildItem(
          t('settingsServer'),
          '/settings/server',
          <SettingsIcon />,
          location.pathname === '/settings/server',
        ),
      );
    }
    managerItems.push(
      buildItem(
        t('settingsUsers'),
        '/settings/users',
        <PeopleIcon />,
        location.pathname.startsWith('/settings/user') && location.pathname !== `/settings/user/${userId}`,
      ),
    );
  }

  const renderList = (items) => (
    <List className={classes.navList} disablePadding>
      {items.map((item) => {
        const Component = item.external ? 'a' : Link;
        const componentProps = item.external
          ? { href: item.link, target: '_blank', rel: 'noopener noreferrer' }
          : { to: item.link };
        return (
          <ListItemButton
            key={`${item.link}-${item.title}`}
            component={Component}
            {...componentProps}
            className={cx(classes.navItem, { [classes.navItemActive]: item.selected })}
            selected={item.selected}
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
      {managerItems.length > 0 && (
        <>
          <Divider className={classes.divider} sx={{ my: 1 }} />
          {renderList(managerItems)}
        </>
      )}
    </Box>
  );
};

export default SettingsMenu;
