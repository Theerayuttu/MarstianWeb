import { useCallback, useEffect, useState } from 'react';
import { Slider, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import maplibregl from 'maplibre-gl';
import MapView, { map } from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapMarkers from '../map/MapMarkers';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapOverlay from '../map/overlay/MapOverlay';
import StatusCard from '../common/components/StatusCard';
import { formatTime } from '../common/util/formatter';

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
    height: '100%',
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
  },
  mapContainer: {
    position: 'absolute',
    inset: 0,
  },
  timeline: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    right: theme.spacing(8),
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(0.75, 2),
    borderRadius: theme.spacing(1.5),
    background:
      theme.palette.mode === 'dark'
        ? 'rgba(30, 30, 30, 0.7)'
        : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    boxShadow: theme.shadows[2],
  },
  timelineLabel: {
    fontWeight: 800,
    fontSize: '0.6rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  slider: {
    flex: 1,
    margin: 0,
  },
  timelineTime: {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    color: theme.palette.primary.main,
    whiteSpace: 'nowrap',
  },
}));

const TimelineMap = ({ datapositions, deviceId, selectedTrip }) => {
  const { classes } = useStyles();

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    setPositions(datapositions || []);
    setIndex(0);
    setShowCard(false);
  }, [datapositions]);

  const onPointClick = useCallback((_, pointIndex) => {
    setIndex(pointIndex);
  }, []);

  const onMarkerClick = useCallback((positionId) => {
    setShowCard(Boolean(positionId));
  }, []);

  // Fit the camera to the selected trip (start/end) or the whole day, zoomed out a bit.
  useEffect(() => {
    const coords = selectedTrip
      ? [
        [selectedTrip.startLon, selectedTrip.startLat],
        [selectedTrip.endLon, selectedTrip.endLat],
      ]
      : positions.map((item) => [item.longitude, item.latitude]);

    if (coords.length) {
      const bounds = coords.reduce(
        (acc, item) => acc.extend(item),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      const canvas = map.getCanvas();
      map.fitBounds(bounds, {
        padding: Math.max(60, Math.min(canvas.width, canvas.height) * 0.22),
        maxZoom: 14,
        duration: 500,
      });
    }
  }, [positions, selectedTrip]);

  const currentTime = positions[index]?.fixTime;

  return (
    <div className={classes.root}>
      <div className={classes.mapContainer}>
        <MapView>
          <MapOverlay />
          <MapGeofence />
          <MapRoutePath positions={positions} />
          <MapRoutePoints positions={positions} onClick={onPointClick} />
          {selectedTrip && (
            <MapMarkers
              markers={[
                {
                  latitude: selectedTrip.startLat,
                  longitude: selectedTrip.startLon,
                  image: 'start-success',
                },
                {
                  latitude: selectedTrip.endLat,
                  longitude: selectedTrip.endLon,
                  image: 'finish-error',
                },
              ]}
            />
          )}
          {index < positions.length && (
            <MapPositions
              positions={[positions[index]]}
              onMarkerClick={onMarkerClick}
              titleField="fixTime"
            />
          )}
        </MapView>
        <MapScale />
        {showCard && index < positions.length && (
          <StatusCard
            deviceId={deviceId}
            position={positions[index]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )}
      </div>

      <div className={classes.timeline}>
        <Typography className={classes.timelineLabel}>Timeline</Typography>
        <Slider
          className={classes.slider}
          max={Math.max(0, positions.length - 1)}
          step={null}
          marks={positions.map((_, pointIndex) => ({ value: pointIndex }))}
          value={Math.min(index, Math.max(0, positions.length - 1))}
          onChange={(_, value) => setIndex(value)}
          size="small"
          disabled={!positions.length}
        />
        {currentTime && (
          <Typography className={classes.timelineTime}>
            {formatTime(currentTime, 'time')}
          </Typography>
        )}
      </div>
    </div>
  );
};

export default TimelineMap;
