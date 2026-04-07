import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { IconButton, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import {
  formatDistance,
  formatTime,
  formatNumericHours,
  formatPercentage,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapPositions from '../map/MapPositions';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import { deviceEquality } from '../common/util/deviceEquality';
import { resolveAddress } from '../common/util/resolveAddress';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'positionOdometer'],
  ['address', 'positionAddress'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
  ['engineHours', 'reportEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const StopReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const server = useSelector((state) => state.session.server);

  const distanceUnit = useAttributePreference('distanceUnit');
  //const volumeUnit = useAttributePreference('volumeUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [columns, setColumns] = usePersistedState('stopColumns', [
    'startTime',
    'endTime',
    'startOdometer',
    'address',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/stops?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const onExport = useCatch(async () => {
    const addressCache = new Map();
    const sheets = new Map();
    for (const item of items) {
      const deviceName = devices[item.deviceId].name;
      if (!sheets.has(deviceName)) {
        sheets.set(deviceName, []);
      }
      const row = {};
      row[t('sharedDevice')] = deviceName;
      for (const key of columns) {
        const header = t(columnsMap.get(key));
        if (key === 'address') {
          row[header] = await resolveAddress({
            latitude: item.latitude,
            longitude: item.longitude,
            originalAddress: null,
            server,
            coordinateFormat,
            useQueue: items.length > 62,
            cache: addressCache,
          });
        } else {
          row[header] = formatValue(item, key);
        }
      }
      sheets.get(deviceName).push(row);
    }
    await exportExcel(t('reportStops'), 'stops.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'stops';
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value].name;
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
        return formatDistance(value, distanceUnit, t);
      case 'duration':
        return formatNumericHours(value, t, 'h:m');
      case 'engineHours':
        return value > 0 ? formatNumericHours(value, t, 'h:m') : 0;
      case 'spentFuel':
        return value > 0 ? formatPercentage(value) : 0;
      case 'address':
        return (
          <AddressValue
            latitude={item.latitude}
            longitude={item.longitude}
            originalAddress={null}
            addressshow={true}
            useQueue={items.length > 62}
          />
        );
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportStops']}>
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              <MapPositions
                positions={[
                  {
                    deviceId: selectedItem.deviceId,
                    fixTime: selectedItem.startTime,
                    latitude: selectedItem.latitude,
                    longitude: selectedItem.longitude,
                  },
                ]}
                titleField="fixTime"
              />
            </MapView>
            <MapScale />
            <MapCamera latitude={selectedItem.latitude} longitude={selectedItem.longitude} />
          </div>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              onShow={onShow}
              onExport={onExport}
              onSchedule={onSchedule}
              deviceType="multiple"
              loading={loading}
            >
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className={classes.columnAction} />
                <TableCell>{t('sharedDevice')}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.positionId}>
                    <TableCell className={classes.columnAction} padding="none">
                      {selectedItem === item ? (
                        <IconButton size="small" onClick={() => setSelectedItem(null)}>
                          <GpsFixedIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton size="small" onClick={() => setSelectedItem(item)}>
                          <LocationSearchingIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{devices[item.deviceId].name}</TableCell>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 2} startAction />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default StopReportPage;
