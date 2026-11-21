import React from 'react';
import { 
  Trash2, 
  Droplets, 
  Waves, 
  Factory, 
  Truck, 
  Wind, 
  Volume2, 
  AlertTriangle, 
  Trees, 
  CloudRain, 
  Tag 
} from 'lucide-react';

const ICON_MAP = {
  Trash2,
  Droplets,
  Waves,
  Factory,
  Truck,
  Wind,
  Volume2,
  AlertTriangle,
  Trees,
  CloudRain
};

export const CategoryIcon = ({ name, className = "w-4 h-4" }) => {
  const IconComponent = (name && ICON_MAP[name]) ? ICON_MAP[name] : Tag;
  return <IconComponent className={className} />;
};
