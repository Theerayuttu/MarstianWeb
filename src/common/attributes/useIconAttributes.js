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
  default: defaultIcon,
};

export const mapIconAttributesKey = (attrbutes) => {
  return mapIconAttributes.hasOwnProperty(attrbutes) ? attrbutes : 'default';
};
