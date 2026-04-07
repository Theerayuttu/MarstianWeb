import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { formatAddress } from '../util/formatter';
import { usePreference } from '../util/preferences';
import { resolveAddress } from '../util/resolveAddress';

const AddressValue = ({
  latitude,
  longitude,
  originalAddress,
  addressshow = false,
  useQueue = true,
}) => {
  const t = useTranslation();
  const server = useSelector((state) => state.session.server);

  const addressEnabled = server?.geocoderEnabled;
  const longdogeoEnable = server?.attributes?.uselongdo;

  const coordinateFormat = usePreference('coordinateFormat');

  const [address, setAddress] = useState();
  const requestIdRef = useRef(0);

  const resolveAndSetAddress = useCatchCallback(
    async (requestId) => {
      const resolved = await resolveAddress({
        latitude,
        longitude,
        originalAddress,
        server,
        coordinateFormat,
        useQueue,
      });
      if (requestId === requestIdRef.current) {
        setAddress(resolved);
      }
    },
    [latitude, longitude, originalAddress, server, coordinateFormat, useQueue],
  );

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    if (originalAddress) {
      setAddress(originalAddress);
      return;
    }
    setAddress(undefined);
    if (addressshow) {
      resolveAndSetAddress(requestId);
    }
  }, [latitude, longitude, originalAddress, addressshow, resolveAndSetAddress]);

  const showAddress = useCatch(async (event) => {
    event.preventDefault();
    requestIdRef.current += 1;
    await resolveAndSetAddress(requestIdRef.current);
  });

  if (address) {
    return address;
  }
  if (longdogeoEnable || addressEnabled) {
    return (
      <Link href="#" onClick={showAddress}>
        {t('sharedShowAddress')}
      </Link>
    );
  }
  return formatAddress({ latitude, longitude }, coordinateFormat);
};

export default AddressValue;
