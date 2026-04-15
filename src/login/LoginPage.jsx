import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken,
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #F8F5F2 0%, #FDFDFB 40%, #F3F7F6 100%)',
    padding: theme.spacing(4, 6),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(3, 2),
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(6),
    color: theme.palette.text.primary,
  },
  brand: {
    fontWeight: 700,
    letterSpacing: 2,
    fontSize: '1rem',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  main: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: theme.spacing(5),
    boxShadow: '0px 40px 80px rgba(12, 61, 96, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    boxShadow: '0px 15px 30px rgba(14,34,68,0.25)',
    marginTop: theme.spacing(1),
    '& img': {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
    },
  },
  formControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: 700,
    letterSpacing: 1,
    color: '#0E2244',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(6),
    color: '#5E6470',
    fontSize: '0.85rem',
  },
  footerLinks: {
    display: 'flex',
    gap: theme.spacing(3),
    flexWrap: 'wrap',
  },
  infoText: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#5E6470',
  },
  resetPassword: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    fontSize: '0.85rem',
    color: '#5E6470',
  },
  link: {
    cursor: 'pointer',
    fontWeight: 600,
    color: '#0E2244',
  },
  primaryButton: {
    borderRadius: 999,
    padding: theme.spacing(1.5),
    fontWeight: 700,
    letterSpacing: 1,
    boxShadow: '0px 14px 35px rgba(8, 31, 79, 0.25)',
  },
  secondaryLink: {
    fontWeight: 600,
  },
}));

const LoginPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const { languages, language, setLocalLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({
    code: values[0],
    country: values[1].country,
    name: values[1].name,
  }));

  const [failed, setFailed] = useState(false);

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showServerTooltip, setShowServerTooltip] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => {
    const attributes = state.session.server.attributes;
    return !attributes.language && !attributes['ui.disableLoginLanguage'];
  });
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const versionApp = import.meta.env.VITE_APP_VERSION;

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        const target = window.sessionStorage.getItem('postLogin') || '/';
        window.sessionStorage.removeItem('postLogin');
        navigate(target, { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetchOrThrow(`/api/session?token=${encodeURIComponent(token)}`);
    const user = await response.json();
    dispatch(sessionActions.updateUser(user));
    navigate('/');
  });

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem('hostname') !== window.location.hostname) {
      window.localStorage.setItem('hostname', window.location.hostname);
      setShowServerTooltip(true);
    }
  }, []);

  return (
    <div className={classes.root}>
      <header className={classes.header}>
        <Typography className={classes.brand} component="h1">
          MARSTIAN
        </Typography>
        <div className={classes.headerActions}>
          {languageEnabled && (
            <FormControl size="small">
              <Select
                value={language}
                onChange={(e) => setLocalLanguage(e.target.value)}
                displayEmpty
              >
                {languageList.map((it) => (
                  <MenuItem key={it.code} value={it.code}>
                    <Box component="span" sx={{ mr: 1 }}>
                      <CountryFlag countryCode={it.country} svg />
                    </Box>
                    {it.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {/*<IconButton color="primary" onClick={() => setShowQr(true)}>
            {/*<QrCode2Icon />
          </IconButton>*/}
          {nativeEnvironment && changeEnabled && (
            <IconButton color="primary" onClick={() => navigate('/change-server')}>
              <Tooltip
                title={`${t('settingsServer')}: ${window.location.hostname}`}
                open={showServerTooltip}
                arrow
              >
                <VpnLockIcon />
              </Tooltip>
            </IconButton>
          )}
        </div>
      </header>

      <main className={classes.main}>
        <div className={classes.card}>
          <div className={classes.avatar}>
            <img src="/marstianicon.png" alt="MARSTIAN" width="30%" />
          </div>
          <Stack spacing={0.5} textAlign="center">
            <Typography variant="body2" color="#475467">
              Secure access to MARSTIAN Application
            </Typography>
          </Stack>

          {!openIdForced && (
            <Stack spacing={2.5} mt={1}>
              <div className={classes.formControl}>
                <Typography className={classes.inputLabel}>
                  {t('userEmail').toUpperCase()}
                </Typography>
                <TextField
                  required
                  error={failed}
                  placeholder="example@marstianapp.com"
                  name="email"
                  value={email}
                  autoComplete="email"
                  autoFocus={!email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText={failed && 'Invalid username or password'}
                />
              </div>
              <div className={classes.formControl}>
                <Typography className={classes.inputLabel}>
                  {t('userPassword').toUpperCase()}
                </Typography>
                <TextField
                  required
                  error={failed}
                  placeholder="••••••••"
                  name="password"
                  value={password}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus={!!email}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handlePasswordLogin(event);
                    }
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>
              {codeEnabled && (
                <TextField
                  required
                  error={failed}
                  label={t('loginTotpCode')}
                  name="code"
                  value={code}
                  type="number"
                  onChange={(e) => setCode(e.target.value)}
                />
              )}
              <div className={classes.resetPassword}>
                {emailEnabled && (
                  <Link
                    onClick={() => navigate('/reset-password')}
                    className={classes.link}
                    underline="none"
                  >
                    {t('loginReset')}
                  </Link>
                )}
              </div>
              <Button
                onClick={handlePasswordLogin}
                type="submit"
                variant="contained"
                color="primary"
                className={classes.primaryButton}
                disabled={!email || !password || (codeEnabled && !code)}
              >
                SIGN IN TO MARSTIAN
              </Button>
              <Typography className={classes.infoText}>
                Authorized Personnel Only.{' '}
                {registrationEnabled && (
                  <Link
                    onClick={() => navigate('/register')}
                    underline="none"
                    className={classes.secondaryLink}
                  >
                    {t('loginRegister')}
                  </Link>
                )}
              </Typography>
            </Stack>
          )}

          {openIdEnabled && (
            <Button onClick={() => handleOpenIdLogin()} variant="outlined" color="primary">
              {t('loginOpenId')}
            </Button>
          )}
        </div>
      </main>

      <footer className={classes.footer}>
        <Typography variant="body2">
          © 2024 MarsX Things. All rights reserved. V{versionApp}
        </Typography>
      </footer>

      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </div>
  );
};

export default LoginPage;
