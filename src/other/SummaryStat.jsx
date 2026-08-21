import { Box, Paper, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme, { accent }) => ({
  card: {
    borderRadius: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderLeft: accent ? `4px solid ${accent}` : undefined,
    padding: theme.spacing(2),
    background: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: theme.spacing(1.5),
    minHeight: 116,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
  },
  label: {
    fontWeight: 700,
    fontSize: '0.65rem',
    letterSpacing: '0em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
  },
  icon: {
    color: accent || theme.palette.primary.main,
    opacity: accent ? 1 : 0.35,
    display: 'flex',
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(0.5),
  },
  value: {
    fontWeight: 800,
    fontSize: '2rem',
    lineHeight: 1,
    color: theme.palette.primary.main,
  },
  unit: {
    fontWeight: 700,
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
}));

const SummaryStat = ({ label, value, unit, icon, accent }) => {
  const { classes } = useStyles({ accent });

  return (
    <Paper elevation={0} className={classes.card}>
      <Box className={classes.header}>
        <Typography className={classes.label}>{label}</Typography>
        {icon && <span className={classes.icon}>{icon}</span>}
      </Box>
      <Box className={classes.valueRow}>
        <Typography className={classes.value}>{value}</Typography>
        {unit && <Typography className={classes.unit}>{unit}</Typography>}
      </Box>
    </Paper>
  );
};

export default SummaryStat;
