import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  formatDistance,
  formatSpeed,
  formatTime,
  formatNumericHours,
  formatPercentage,
} from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import scheduleReport from './common/scheduleReport';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import { deviceEquality } from '../common/util/deviceEquality';
import AddressValue from '../common/components/AddressValue';
import { resolveAddress } from '../common/util/resolveAddress';

const columnsArray = [
  ['startTime', 'reportStartDate'],
  ['distance', 'sharedDistance'],
  ['startOdometer', 'reportStartOdometer'],
  ['endOdometer', 'reportEndOdometer'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['engineHours', 'reportEngineHours'],
  ['startHours', 'reportStartEngineHours'],
  ['endHours', 'reportEndEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
  ['startAddress', 'reportStartAddress'],
  ['endAddress', 'reportEndAddress'],
];
const columnsMap = new Map(columnsArray);

const SummaryReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const server = useSelector((state) => state.session.server);

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const coordinateFormat = usePreference('coordinateFormat');
  //const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('summaryColumns', [
    'startTime',
    'distance',
    'averageSpeed',
  ]);
  const daily = searchParams.get('daily') === 'true';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to, daily });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const onExport = useCatch(async () => {
    const addressCache = new Map();
    const rows = [];
    const deviceHeader = t('sharedDevice');
    for (const item of items) {
      const row = { [deviceHeader]: devices[item.deviceId].name };
      for (const key of columns) {
        const header = t(columnsMap.get(key));
        if (key === 'startAddress') {
          row[header] = await resolveAddress({
            latitude: item.startLat,
            longitude: item.startLon,
            originalAddress: null,
            server,
            coordinateFormat,
            useQueue: items.length > 31,
            cache: addressCache,
          });
        } else if (key === 'endAddress') {
          row[header] = await resolveAddress({
            latitude: item.endLat,
            longitude: item.endLon,
            originalAddress: null,
            server,
            coordinateFormat,
            useQueue: items.length > 31,
            cache: addressCache,
          });
        } else {
          row[header] = formatValue(item, key);
        }
      }
      rows.push(row);
    }
    if (rows.length === 0) {
      return;
    }
    const titleKey = daily ? 'reportDaily' : 'reportSummary';
    const title = t(titleKey);
    const sheets = new Map([[title, rows]]);
    await exportExcel(title, 'summary.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'summary';
    report.attributes.daily = daily;
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value].name;
      case 'startTime':
        return formatTime(value, 'date');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : 0;
      case 'engineHours':
      case 'startHours':
      case 'endHours':
        return value > 0 ? formatNumericHours(value, t, 'h:m') : 0;
      case 'spentFuel':
        return value > 0 ? formatPercentage(value) : 0;
      case 'startAddress':
        return (
          <AddressValue
            latitude={item.startLat}
            longitude={item.startLon}
            originalAddress={null}
            addressshow={true}
            useQueue={items.length > 31}
          />
        );
      case 'endAddress':
        return (
          <AddressValue
            latitude={item.endLat}
            longitude={item.endLon}
            originalAddress={null}
            addressshow={true}
            useQueue={items.length > 31}
          />
        );
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportSummary']}>
      <div className={classes.header}>
        <ReportFilter
          onShow={onShow}
          onExport={onExport}
          onSchedule={onSchedule}
          deviceType="multiple"
          loading={loading}
        >
          <div className={classes.filterItem}>
            <FormControl fullWidth>
              <InputLabel>{t('sharedType')}</InputLabel>
              <Select
                label={t('sharedType')}
                value={daily}
                onChange={(e) =>
                  updateReportParams(searchParams, setSearchParams, 'daily', [
                    String(e.target.value),
                  ])
                }
              >
                <MenuItem value={false}>{t('reportSummary')}</MenuItem>
                <MenuItem value>{t('reportDaily')}</MenuItem>
              </Select>
            </FormControl>
          </div>
          <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
        </ReportFilter>
      </div>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t('sharedDevice')}</TableCell>
            {columns.map((key) => (
              <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.map((item) => (
              <TableRow key={`${item.deviceId}_${Date.parse(item.startTime)}`}>
                <TableCell>{devices[item.deviceId].name}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key}>{formatValue(item, key)}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={columns.length + 1} />
          )}
        </TableBody>
      </Table>
    </PageLayout>
  );
};

export default SummaryReportPage;
