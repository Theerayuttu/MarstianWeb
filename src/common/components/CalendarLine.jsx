import { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
    alignSelf: 'stretch',
  },
  pills: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    overflow: 'hidden',
    flexWrap: 'nowrap',
  },
  dateButton: {
    borderRadius: 12,
    padding: theme.spacing(0.75, 1.25),
    minWidth: 72,
    flexShrink: 0,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
}));

const PILL_WIDTH = 72;
const PILL_GAP = 4;

const CalendarLine = ({ handleSubmit, dayslist }) => {
  const { classes } = useStyles();

  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [startDate, setStartDate] = useState(() => dayjs());
  const [anchorEl, setAnchorEl] = useState(null);

  const pillsRef = useRef(null);
  const nextRef = useRef(null);
  const [autoCount, setAutoCount] = useState(7);

  const days = dayslist ?? autoCount;

  useLayoutEffect(() => {
    if (dayslist != null) {
      return undefined;
    }
    const element = pillsRef.current;
    if (!element) {
      return undefined;
    }
    const update = () => {
      const nextWidth = nextRef.current?.offsetWidth ?? 0;
      const width = element.clientWidth - nextWidth - PILL_GAP;
      const count = Math.floor((width + PILL_GAP) / (PILL_WIDTH + PILL_GAP));
      setAutoCount(Math.min(12, Math.max(1, count)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [dayslist]);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => dayjs().year() + i - 4), []);

  const dates = useMemo(
    () => Array.from({ length: days }, (_, i) => startDate.subtract(days - 1 - i, 'day')),
    [startDate, days],
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
          onClick={() => setStartDate((value) => value.subtract(days, 'day'))}
          size="small"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>

        <Box ref={pillsRef} className={classes.pills}>
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
            ref={nextRef}
            onClick={() => setStartDate((value) => value.add(days, 'day'))}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CalendarLine;
