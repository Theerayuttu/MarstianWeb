import SpeedIcon from '../../resources/images/data/speed.svg';
import PowerIcon from '../../resources/images/data/power.svg';
import ignitionIcon from '../../resources/images/data/ignition.svg';
import fuelIcon from '../../resources/images/data/fuel.svg';
import batteryIcon from '../../resources/images/data/battery.svg';
import defaultIcon from '../../resources/images/data/default.svg';
import rpmIcon from '../../resources/images/data/rpm.svg';
import distanceIcon from '../../resources/images/data/distance.svg';
import fuelConsumptionIcon from '../../resources/images/data/fuelConsumption.svg';
import coolantTempIcon from '../../resources/images/data/coolantTemp.svg';
import driverIdIcon from '../../resources/images/data/driverUniqueId.svg';
import evbatteryIcon from '../../resources/images/data/evbattery.svg';
import chargingIcon from '../../resources/images/data/evcharging.svg';
import poweronIcon from '../../resources/images/data/poweron.svg';
import poweroffIcon from '../../resources/images/data/poweroff.svg';
import hvIcon from '../../resources/images/data/hv.svg';

export const mapIconAttributes = {
  fuel: fuelIcon,
  power: PowerIcon,
  battery: batteryIcon,
  speed: SpeedIcon,
  ignition: ignitionIcon,
  rpm: rpmIcon,
  distance: distanceIcon,
  fuelConsumption: fuelConsumptionIcon,
  coolantTemp: coolantTempIcon,
  driverUniqueId: driverIdIcon,
  soc:evbatteryIcon,
  charge:chargingIcon,
  poweron:poweronIcon,
  poweroff:poweroffIcon,
  LV:PowerIcon,
  HV:hvIcon,
  default: defaultIcon,
};

export const mapIconAttributesKey = (attrbutes) => {
  return mapIconAttributes.hasOwnProperty(attrbutes) ? attrbutes : 'default';
};
