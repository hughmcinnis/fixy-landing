const mappings = [
  { keywords: ['plumb', 'pipe', 'drain', 'faucet', 'toilet', 'water heater', 'leak', 'sewer', 'garbage disposal'], serviceType: 'Plumber', googlePlacesType: 'plumber' },
  { keywords: ['electri', 'wiring', 'outlet', 'circuit', 'breaker', 'panel', 'light fixture', 'switch', 'volt'], serviceType: 'Electrician', googlePlacesType: 'electrician' },
  { keywords: ['hvac', 'heat', 'cool', 'furnace', 'air condition', 'ac unit', 'thermostat', 'duct', 'ventilat', 'boiler'], serviceType: 'HVAC', googlePlacesType: 'hvac_contractor' },
  { keywords: ['roof', 'shingle', 'gutter', 'flashing'], serviceType: 'Roofer', googlePlacesType: 'roofing_contractor' },
  { keywords: ['paint', 'drywall', 'plaster', 'wall repair'], serviceType: 'Painter', googlePlacesType: 'painter' },
  { keywords: ['pest', 'termite', 'rodent', 'insect', 'bug', 'exterminator', 'mice', 'rat', 'ant', 'cockroach'], serviceType: 'Pest Control', googlePlacesType: 'pest_control' },
  { keywords: ['landscape', 'lawn', 'tree', 'garden', 'irrigation', 'sprinkler'], serviceType: 'Landscaper', googlePlacesType: 'landscaper' },
  { keywords: ['garage door', 'overhead door'], serviceType: 'Garage Door', googlePlacesType: 'garage_door_supplier' },
  { keywords: ['lock', 'key', 'deadbolt', 'door lock'], serviceType: 'Locksmith', googlePlacesType: 'locksmith' },
  { keywords: ['appliance', 'washer', 'dryer', 'dishwasher', 'refrigerator', 'oven', 'stove', 'microwave'], serviceType: 'Appliance Repair', googlePlacesType: 'appliance_repair_service' },
  { keywords: ['floor', 'tile', 'hardwood', 'carpet', 'laminate', 'vinyl'], serviceType: 'Flooring', googlePlacesType: 'flooring_contractor' },
  { keywords: ['window', 'glass', 'screen'], serviceType: 'Window', googlePlacesType: 'window_installation_service' },
  { keywords: ['foundation', 'basement', 'crawl space', 'structural'], serviceType: 'Foundation', googlePlacesType: 'foundation_contractor' },
];

function mapDiagnosisToServiceType(diagnosis) {
  const lower = (diagnosis || '').toLowerCase();
  for (const m of mappings) {
    if (m.keywords.some(k => lower.includes(k))) {
      return { serviceType: m.serviceType, googlePlacesType: m.googlePlacesType };
    }
  }
  return { serviceType: 'General Contractor', googlePlacesType: 'general_contractor' };
}

module.exports = { mapDiagnosisToServiceType };
