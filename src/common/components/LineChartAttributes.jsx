import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import { useAttributePreference } from '../util/preferences';
import { speedFromKnots } from '../util/converter';
import { formatTime } from '../util/formatter';

const LineChartAttributes = ({
  routesdata,
  attr,
  min = 0,
  max = 0,
  interpola = 'monotone',
  yaxistick = true,
}) => {
  const theme = useTheme();
  const speedUnit = useAttributePreference('speedUnit');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const formatted = (routesdata || []).map((position) => {
      const raw = {
        ...position,
        ...position.attributes,
      };

      const value = raw[attr];
      let nextValue = null;
      if (typeof value === 'number') {
        nextValue =
          attr === 'speed'
            ? Number(speedFromKnots(value, speedUnit).toFixed(2))
            : Number(value.toFixed(2));
      } else if (typeof value === 'boolean') {
        nextValue = value ? 1 : 0;
      }

      return {
        fixTime: dayjs(position.fixTime).valueOf(),
        [attr]: nextValue,
      };
    });

    setItems(formatted.filter((item) => item[attr] != null));
  }, [routesdata, attr, speedUnit]);

  const [minValue, maxValue] = useMemo(() => {
    if (!items.length) {
      return [0, 1];
    }
    const values = items.map((item) => item[attr]);
    return [Math.min(...values), Math.max(...values)];
  }, [items, attr]);

  const yDomain =
    min + max === 0 ? [minValue, Math.max(maxValue + maxValue / 4, minValue + 1)] : [min, max];

  return (
    <ResponsiveContainer width="100%" height="90%">
      <AreaChart
        data={items}
        margin={{
          top: 8,
          right: 10,
          left: 0,
          bottom: 4,
        }}
      >
        <defs>
          <linearGradient id={`timeline-gradient-${attr}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ffc172" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#ffc172" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="fixTime"
          tickFormatter={(value) => formatTime(value, 'time')}
          domain={['dataMin', 'dataMax']}
          type="number"
        />
        <YAxis type="number" domain={yDomain} tick={yaxistick} />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          }}
          formatter={(value) => [value, attr]}
          labelFormatter={(value) => formatTime(value, 'seconds')}
        />
        <Area
          type={interpola}
          dataKey={attr}
          stroke="#FF8343"
          fillOpacity={1}
          fill={`url(#timeline-gradient-${attr})`}
          dot={false}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LineChartAttributes;
