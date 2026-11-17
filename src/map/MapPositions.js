import { useId, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey, photoIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import { findFonts } from './core/mapUtil';
import usePhotoIcons from './core/usePhotoIcons';

const MapPositions = ({
  positions,
  onMapClick,
  onMarkerClick,
  showStatus,
  selectedPosition,
  titleField,
  disabled,
}) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const photoIcons = usePhotoIcons();

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const iconColor = (status, attrcolor, ignition) => {
    let colors = showStatus ? attrcolor || getStatusColor(status) : 'neutral';
    if (status == 'online' && !ignition) {
      colors = 'neutral';
    } else if (status == 'unknown' && ignition) {
      colors = 'success'; // support Cartrack data
    }
    return colors;
  };

  const createFeature = useCallback(
    (devices, position, selectedPositionId) => {
      const device = devices[position.deviceId];
      let showDirection;
      switch (directionType) {
        case 'none':
          showDirection = false;
          break;
        case 'all':
          showDirection = position.course > 0;
          break;
        default:
          showDirection = selectedPositionId === position.id && position.course > 0;
          break;
      }
      const color = showStatus
        ? iconColor(
            device.status,
            position.attributes.color || getStatusColor(device.status),
            position.attributes.ignition,
          )
        : 'neutral';
      const photo = photoIcons.has(device.category);
      return {
        id: position.id,
        deviceId: position.deviceId,
        name: device.name,
        fixTime: formatTime(position.fixTime, 'seconds'),
        image: photo
          ? photoIconKey(device.category, color)
          : `${mapIconKey(device.category)}-${color}`,
        photo,
        rotation: position.course,
        direction: showDirection,
      };
    },
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- iconColor only closes over showStatus, already listed
    [directionType, showStatus, photoIcons],
  );

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const onMapClickCallback = useCallback(
    (event) => {
      if (!event.defaultPrevented && onMapClick) {
        onMapClick(event.lngLat.lat, event.lngLat.lng);
      }
    },
    [onMapClick],
  );

  const onMarkerClickCallback = useCallback(
    (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const feature = event.features[0];
      if (onMarkerClick) {
        onMarkerClick(feature.properties.id, feature.properties.deviceId);
      }
    },
    [onMarkerClick],
  );

  const onClusterClick = useCatchCallback(
    async (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, {
        layers: [clusters],
      });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    },
    [clusters, id],
  );

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      // The selected device is drawn above clusters, so it must not hide them by collision
      const ignorePlacement = source === selected;
      if (source === selected) {
        map.addLayer({
          id: `plusRing-${source}`,
          type: 'circle',
          source,
          filter: ['!has', 'point_count'],
          paint: {
            'circle-radius': ['case', ['get', 'photo'], 36 * iconScale, 22 * iconScale],
            'circle-color': 'rgba(33, 150, 243, 0.18)',
            'circle-stroke-color': '#2196f3',
            'circle-stroke-width': 3,
            'circle-stroke-opacity': 1,
          },
        });
      }
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-ignore-placement': ignorePlacement,
          'text-field': `{${titleField || 'name'}}`,
          'text-allow-overlap': true,
          'text-ignore-placement': ignorePlacement,
          'text-anchor': 'bottom',
          'text-offset': [
            'case',
            ['get', 'photo'],
            ['literal', [0, -2.4 * iconScale]],
            ['literal', [0, -2 * iconScale]],
          ],
          'text-font': findFonts(map),
          'text-size': 12,
          'symbol-sort-key': ['get', 'id'],
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction',
          // Photo icons are wider than the round icon, push the arrow outside them
          'icon-size': ['case', ['get', 'photo'], 1.4 * iconScale, iconScale],
          'icon-allow-overlap': true,
          'icon-ignore-placement': ignorePlacement,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
        },
      });

      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClickCallback);
    });
    map.addLayer(
      {
        id: clusters,
        type: 'symbol',
        source: id,
        filter: ['has', 'point_count'],
        layout: {
          'icon-image': 'background',
          'icon-size': iconScale,
          'text-field': '{point_count_abbreviated}',
          'text-font': findFonts(map),
          'text-size': 14,
        },
      },
      // Keep clusters below the selected device layers
      `plusRing-${selected}`,
    );

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClickCallback);

    return () => {
      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClickCallback);

      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClickCallback);

        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        if (map.getLayer(`plusRing-${source}`)) {
          map.removeLayer(`plusRing-${source}`);
        }
        if (map.getLayer(`direction-${source}`)) {
          map.removeLayer(`direction-${source}`);
        }
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [
    mapCluster,
    clusters,
    onMarkerClickCallback,
    onClusterClick,
    onMapClickCallback,
    iconScale,
    id,
    selected,
    titleField,
  ]);

  useEffect(() => {
    [id, selected].forEach((source) => {
      map.getSource(source)?.setData({
        type: 'FeatureCollection',
        features: positions
          .filter((it) => devices.hasOwnProperty(it.deviceId))
          .filter((it) =>
            source === id ? it.deviceId !== selectedDeviceId : it.deviceId === selectedDeviceId,
          )
          .map((position) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: createFeature(devices, position, selectedPosition && selectedPosition.id),
          })),
      });
    });
  }, [
    mapCluster,
    clusters,
    onMarkerClick,
    onClusterClick,
    devices,
    positions,
    selectedPosition,
    createFeature,
    id,
    selected,
    selectedDeviceId,
  ]);

  return null;
};

export default MapPositions;
