import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';
import layoutTokens from './layoutTokens';

export default (server, darkMode, direction) =>
  useMemo(() => {
    const base = createTheme({
      typography: {
        fontFamily: 'Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif',
      },
      palette: palette(server, darkMode),
      direction,
      dimensions,
      components,
    });
    // Layout tokens are derived from the resolved palette, so they need a second pass.
    return createTheme(base, { layout: layoutTokens(base) });
  }, [server, darkMode, direction]);
