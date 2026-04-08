import { useCallback, useEffect, useState } from 'react';
import { Slider } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapOverlay from '../map/overlay/MapOverlay';
import StatusCard from '../common/components/StatusCard';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: theme.spacing(1.5),
    overflow: 'hidden',
  },
  slider: {
    margin: 0,
    boxSizing: 'border-box',
    width: '98%',
    padding: theme.spacing(0, 3),
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: theme.spacing(1),
  },
}));

const TimelineMap = ({ datapositions, deviceId }) => {
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

  return (
    <div className={classes.root}>
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
      <div className={classes.mapContainer}>
        <MapView>
          <MapOverlay />
          <MapGeofence />
          <MapRoutePath positions={positions} />
          <MapRoutePoints positions={positions} onClick={onPointClick} />
          {index < positions.length && (
            <MapPositions
              positions={[positions[index]]}
              onMarkerClick={onMarkerClick}
              titleField="fixTime"
            />
          )}
        </MapView>
        <MapScale />
        <MapCamera positions={positions} />
        {showCard && index < positions.length && (
          <StatusCard
            deviceId={deviceId}
            position={positions[index]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )}
      </div>
    </div>
  );
};

export default TimelineMap;
