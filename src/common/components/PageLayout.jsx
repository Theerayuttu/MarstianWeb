import { useState } from 'react';
import {
  AppBar,
  Breadcrumbs,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import BackIcon from './BackIcon';
import MenuOpenRounded from '@mui/icons-material/MenuOpenRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';

const useStyles = makeStyles()((theme, { miniVariant }) => ({
  root: {
    height: '100%',
    display: 'flex',
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
    },
  },
  desktopDrawer: {
    width: miniVariant ? `calc(${theme.spacing(8)} + 1px)` : theme.dimensions.drawerWidthDesktop,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '@media print': {
      display: 'none',
    },
  },
  desktopDrawerPaper: {
    width: miniVariant ? `calc(${theme.spacing(8)} + 1px)` : theme.dimensions.drawerWidthDesktop,
    borderRight: 'none',
    backgroundColor: 'transparent',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileDrawer: {
    width: theme.dimensions.drawerWidthTablet,
    '@media print': {
      display: 'none',
    },
  },
  mobileDrawerPaper: {
    width: theme.dimensions.drawerWidthTablet,
    borderRight: 'none',
    backgroundColor: 'transparent',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileToolbar: {
    zIndex: 1,
    '@media print': {
      display: 'none',
    },
  },
  drawerSurface: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    background: 'linear-gradient(180deg, #03183E 0%, #051129 100%)',
    color: '#f4f7ff',
  },
  drawerToolbar: {
    padding: theme.spacing(3, 2, 1.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minHeight: 'unset',
  },
  drawerToolbarActions: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  drawerMenu: {
    flex: 1,
    padding: theme.spacing(0, 2, 3),
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
    },
  },
  drawerMenuMini: {
    padding: theme.spacing(0, 0.5, 2),
    '& > *': {
      padding: theme.spacing(2, 0.5),
    },
    '& .MuiListItemButton-root': {
      justifyContent: 'center',
      padding: theme.spacing(1.25),
      borderRadius: 20,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      margin: 0,
      color: '#f4f7ff',
    },
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiDivider-root': {
      width: '60%',
      alignSelf: 'center',
    },
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const theme = useTheme();
  const t = useTranslation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  if (desktop) {
    return (
      <Typography variant="h6" noWrap color="inherit">
        {t(breadcrumbs[0])}
      </Typography>
    );
  }
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" color="inherit" key={breadcrumb}>
          {t(breadcrumb)}
        </Typography>
      ))}
      <Typography variant="h6" color="inherit">
        {t(breadcrumbs[breadcrumbs.length - 1])}
      </Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const [miniVariant, setMiniVariant] = useState(false);
  const { classes, cx } = useStyles({ miniVariant });
  const theme = useTheme();
  const navigate = useNavigate();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [searchParams] = useSearchParams();

  const [openDrawer, setOpenDrawer] = useState(!desktop && searchParams.has('menu'));

  const toggleDrawer = () => setMiniVariant(!miniVariant);

  const drawerContent = (
    <div className={classes.drawerSurface}>
      {desktop && (
        <Toolbar className={classes.drawerToolbar} disableGutters>
          {!miniVariant && (
            <>
              <IconButton
                edge="start"
                sx={{ mr: 1, color: '#f4f7ff' }}
                onClick={() => navigate('/')}
              >
                <BackIcon />
              </IconButton>
              <PageTitle breadcrumbs={breadcrumbs} />
            </>
          )}
          <div className={classes.drawerToolbarActions}>
            <IconButton sx={{ color: '#f4f7ff' }} onClick={toggleDrawer}>
              {miniVariant !== (theme.direction === 'rtl') ? <MenuRounded /> : <MenuOpenRounded />}
            </IconButton>
          </div>
        </Toolbar>
      )}
      <div className={cx(classes.drawerMenu, { [classes.drawerMenuMini]: miniVariant })}>
        {menu}
      </div>
    </div>
  );

  return (
    <div className={classes.root}>
      {desktop ? (
        <Drawer
          variant="permanent"
          className={classes.desktopDrawer}
          classes={{ paper: classes.desktopDrawerPaper }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={openDrawer}
          onClose={() => setOpenDrawer(false)}
          classes={{ paper: classes.mobileDrawerPaper }}
        >
          {drawerContent}
        </Drawer>
      )}
      {!desktop && (
        <AppBar className={classes.mobileToolbar} position="static" color="inherit">
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              sx={{ mr: 2 }}
              onClick={() => setOpenDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
            <PageTitle breadcrumbs={breadcrumbs} />
          </Toolbar>
        </AppBar>
      )}
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
