import { useMemo, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import dayjs from 'dayjs';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2),
    alignItems: 'flex-start',
  },
  dateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    overflowX: 'auto',
  },
  dateButton: {
    borderRadius: 16,
    padding: theme.spacing(0.75, 1.25),
    minWidth: 72,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
}));

const CalendarLine = ({ handleSubmit, dayslist = 4 }) => {
  const { classes } = useStyles();

  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [startDate, setStartDate] = useState(() => dayjs());
  const [anchorEl, setAnchorEl] = useState(null);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => dayjs().year() + i - 4), []);

  const dates = useMemo(
    () => Array.from({ length: dayslist }, (_, i) => startDate.subtract(dayslist - 1 - i, 'day')),
    [startDate, dayslist],
  );

  const emitDate = (date) => {
    handleSubmit({
      date: date.toDate(),
      from: date.startOf('day').toISOString(),
      to: date.endOf('day').toISOString(),
    });
  };

  const onSelectDate = (date) => {
    setSelectedDate(date);
    emitDate(date);
  };

  return (
    <Box className={classes.root}>
      <Button onClick={(event) => setAnchorEl(event.currentTarget)}>
        <Typography variant="h6">{selectedDate.format('MMMM YYYY')}</Typography>
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {Array.from({ length: 12 }, (_, index) => (
          <MenuItem
            key={`month-${index}`}
            onClick={() => {
              const next = startDate.month(index);
              setStartDate(next);
              setSelectedDate(next);
              emitDate(next);
              setAnchorEl(null);
            }}
          >
            {dayjs().month(index).format('MMMM')}
          </MenuItem>
        ))}
        <MenuItem disabled>──────────</MenuItem>
        {years.map((year) => (
          <MenuItem
            key={`year-${year}`}
            onClick={() => {
              const next = startDate.year(year);
              setStartDate(next);
              setSelectedDate(next);
              emitDate(next);
              setAnchorEl(null);
            }}
          >
            {year}
          </MenuItem>
        ))}
      </Menu>

      <Box className={classes.dateRow}>
        <IconButton
          onClick={() => setStartDate((value) => value.subtract(dayslist, 'day'))}
          size="small"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        {dates.map((date) => {
          const selected = date.isSame(selectedDate, 'day');
          return (
            <Button
              key={date.format('YYYY-MM-DD')}
              variant={selected ? 'contained' : 'outlined'}
              color="primary"
              className={classes.dateButton}
              onClick={() => onSelectDate(date)}
            >
              <Typography variant="caption" sx={{ mr: 0.5 }}>
                {date.format('ddd')}
              </Typography>
              <Typography variant="caption">{date.format('D')}</Typography>
            </Button>
          );
        })}

        <IconButton
          onClick={() => setStartDate((value) => value.add(dayslist, 'day'))}
          size="small"
        >
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CalendarLine;
