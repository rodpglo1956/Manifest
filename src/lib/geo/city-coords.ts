/**
 * Static city-to-coordinates lookup for map pins.
 * Covers top 200+ US trucking cities.
 * Key format: lowercase "city_state" (e.g., "dallas_tx")
 */

type CityCoords = { lat: number; lng: number }

const CITY_COORDS: Record<string, CityCoords> = {
  // Texas
  dallas_tx: { lat: 32.7767, lng: -96.7970 },
  houston_tx: { lat: 29.7604, lng: -95.3698 },
  san_antonio_tx: { lat: 29.4241, lng: -98.4936 },
  austin_tx: { lat: 30.2672, lng: -97.7431 },
  fort_worth_tx: { lat: 32.7555, lng: -97.3308 },
  el_paso_tx: { lat: 31.7619, lng: -106.4850 },
  laredo_tx: { lat: 27.5036, lng: -99.5076 },
  lubbock_tx: { lat: 33.5779, lng: -101.8552 },
  corpus_christi_tx: { lat: 27.8006, lng: -97.3964 },
  amarillo_tx: { lat: 35.2220, lng: -101.8313 },
  mcallen_tx: { lat: 26.2034, lng: -98.2300 },
  brownsville_tx: { lat: 25.9017, lng: -97.4975 },
  midland_tx: { lat: 31.9973, lng: -102.0779 },
  odessa_tx: { lat: 31.8457, lng: -102.3676 },
  beaumont_tx: { lat: 30.0802, lng: -94.1266 },
  waco_tx: { lat: 31.5493, lng: -97.1467 },

  // Georgia
  atlanta_ga: { lat: 33.7490, lng: -84.3880 },
  savannah_ga: { lat: 32.0809, lng: -81.0912 },
  augusta_ga: { lat: 33.4735, lng: -82.0105 },
  macon_ga: { lat: 32.8407, lng: -83.6324 },

  // Illinois
  chicago_il: { lat: 41.8781, lng: -87.6298 },
  rockford_il: { lat: 42.2711, lng: -89.0940 },
  springfield_il: { lat: 39.7817, lng: -89.6501 },
  peoria_il: { lat: 40.6936, lng: -89.5890 },

  // California
  los_angeles_ca: { lat: 34.0522, lng: -118.2437 },
  san_francisco_ca: { lat: 37.7749, lng: -122.4194 },
  san_diego_ca: { lat: 32.7157, lng: -117.1611 },
  fresno_ca: { lat: 36.7378, lng: -119.7871 },
  sacramento_ca: { lat: 38.5816, lng: -121.4944 },
  long_beach_ca: { lat: 33.7701, lng: -118.1937 },
  oakland_ca: { lat: 37.8044, lng: -122.2712 },
  bakersfield_ca: { lat: 35.3733, lng: -119.0187 },
  riverside_ca: { lat: 33.9533, lng: -117.3962 },
  stockton_ca: { lat: 37.9577, lng: -121.2908 },
  ontario_ca: { lat: 34.0633, lng: -117.6509 },
  san_bernardino_ca: { lat: 34.1083, lng: -117.2898 },
  modesto_ca: { lat: 37.6391, lng: -120.9969 },

  // Tennessee
  memphis_tn: { lat: 35.1495, lng: -90.0490 },
  nashville_tn: { lat: 36.1627, lng: -86.7816 },
  knoxville_tn: { lat: 35.9606, lng: -83.9207 },
  chattanooga_tn: { lat: 35.0456, lng: -85.3097 },

  // Indiana
  indianapolis_in: { lat: 39.7684, lng: -86.1581 },
  fort_wayne_in: { lat: 41.0793, lng: -85.1394 },
  evansville_in: { lat: 37.9716, lng: -87.5711 },
  south_bend_in: { lat: 41.6764, lng: -86.2520 },

  // Ohio
  columbus_oh: { lat: 39.9612, lng: -82.9988 },
  cleveland_oh: { lat: 41.4993, lng: -81.6944 },
  cincinnati_oh: { lat: 39.1031, lng: -84.5120 },
  toledo_oh: { lat: 41.6528, lng: -83.5379 },
  dayton_oh: { lat: 39.7589, lng: -84.1916 },
  akron_oh: { lat: 41.0814, lng: -81.5190 },

  // North Carolina
  charlotte_nc: { lat: 35.2271, lng: -80.8431 },
  raleigh_nc: { lat: 35.7796, lng: -78.6382 },
  greensboro_nc: { lat: 36.0726, lng: -79.7920 },
  winston_salem_nc: { lat: 36.0999, lng: -80.2442 },
  durham_nc: { lat: 35.9940, lng: -78.8986 },
  fayetteville_nc: { lat: 35.0527, lng: -78.8784 },
  wilmington_nc: { lat: 34.2257, lng: -77.9447 },

  // Arizona
  phoenix_az: { lat: 33.4484, lng: -111.9490 },
  tucson_az: { lat: 32.2226, lng: -110.9747 },
  mesa_az: { lat: 33.4152, lng: -111.8315 },
  flagstaff_az: { lat: 35.1983, lng: -111.6513 },

  // Colorado
  denver_co: { lat: 39.7392, lng: -104.9903 },
  colorado_springs_co: { lat: 38.8339, lng: -104.8214 },
  pueblo_co: { lat: 38.2544, lng: -104.6091 },

  // Missouri
  kansas_city_mo: { lat: 39.0997, lng: -94.5786 },
  st_louis_mo: { lat: 38.6270, lng: -90.1994 },
  springfield_mo: { lat: 37.2090, lng: -93.2923 },
  columbia_mo: { lat: 38.9517, lng: -92.3341 },
  joplin_mo: { lat: 37.0842, lng: -94.5133 },

  // Kentucky
  louisville_ky: { lat: 38.2527, lng: -85.7585 },
  lexington_ky: { lat: 38.0406, lng: -84.5037 },
  bowling_green_ky: { lat: 36.9685, lng: -86.4808 },

  // Florida
  jacksonville_fl: { lat: 30.3322, lng: -81.6557 },
  miami_fl: { lat: 25.7617, lng: -80.1918 },
  tampa_fl: { lat: 27.9506, lng: -82.4572 },
  orlando_fl: { lat: 28.5383, lng: -81.3792 },
  fort_lauderdale_fl: { lat: 26.1224, lng: -80.1373 },
  st_petersburg_fl: { lat: 27.7676, lng: -82.6403 },
  tallahassee_fl: { lat: 30.4383, lng: -84.2807 },
  pensacola_fl: { lat: 30.4213, lng: -87.2169 },
  port_st_lucie_fl: { lat: 27.2730, lng: -80.3582 },
  lakeland_fl: { lat: 28.0395, lng: -81.9498 },
  ocala_fl: { lat: 29.1872, lng: -82.1401 },

  // Michigan
  detroit_mi: { lat: 42.3314, lng: -83.0458 },
  grand_rapids_mi: { lat: 42.9634, lng: -85.6681 },
  lansing_mi: { lat: 42.7325, lng: -84.5555 },
  kalamazoo_mi: { lat: 42.2917, lng: -85.5872 },

  // Pennsylvania
  philadelphia_pa: { lat: 39.9526, lng: -75.1652 },
  pittsburgh_pa: { lat: 40.4406, lng: -79.9959 },
  harrisburg_pa: { lat: 40.2732, lng: -76.8867 },
  allentown_pa: { lat: 40.6084, lng: -75.4902 },
  scranton_pa: { lat: 41.4090, lng: -75.6624 },
  erie_pa: { lat: 42.1292, lng: -80.0851 },

  // New York
  new_york_ny: { lat: 40.7128, lng: -74.0060 },
  buffalo_ny: { lat: 42.8864, lng: -78.8784 },
  rochester_ny: { lat: 43.1566, lng: -77.6088 },
  syracuse_ny: { lat: 43.0481, lng: -76.1474 },
  albany_ny: { lat: 42.6526, lng: -73.7562 },

  // New Jersey
  newark_nj: { lat: 40.7357, lng: -74.1724 },
  jersey_city_nj: { lat: 40.7178, lng: -74.0431 },
  elizabeth_nj: { lat: 40.6640, lng: -74.2107 },
  edison_nj: { lat: 40.5187, lng: -74.4121 },

  // Washington
  seattle_wa: { lat: 47.6062, lng: -122.3321 },
  tacoma_wa: { lat: 47.2529, lng: -122.4443 },
  spokane_wa: { lat: 47.6588, lng: -117.4260 },

  // Oregon
  portland_or: { lat: 45.5152, lng: -122.6784 },
  eugene_or: { lat: 44.0521, lng: -123.0868 },
  salem_or: { lat: 44.9429, lng: -123.0351 },

  // Virginia
  virginia_beach_va: { lat: 36.8529, lng: -75.9780 },
  norfolk_va: { lat: 36.8508, lng: -76.2859 },
  richmond_va: { lat: 37.5407, lng: -77.4360 },
  roanoke_va: { lat: 37.2710, lng: -79.9414 },

  // Maryland
  baltimore_md: { lat: 39.2904, lng: -76.6122 },

  // Massachusetts
  boston_ma: { lat: 42.3601, lng: -71.0589 },
  worcester_ma: { lat: 42.2626, lng: -71.8023 },
  springfield_ma: { lat: 42.1015, lng: -72.5898 },

  // Minnesota
  minneapolis_mn: { lat: 44.9778, lng: -93.2650 },
  st_paul_mn: { lat: 44.9537, lng: -93.0900 },
  duluth_mn: { lat: 46.7867, lng: -92.1005 },
  rochester_mn: { lat: 44.0121, lng: -92.4802 },

  // Wisconsin
  milwaukee_wi: { lat: 43.0389, lng: -87.9065 },
  madison_wi: { lat: 43.0731, lng: -89.4012 },
  green_bay_wi: { lat: 44.5133, lng: -88.0133 },

  // Alabama
  birmingham_al: { lat: 33.5186, lng: -86.8104 },
  mobile_al: { lat: 30.6954, lng: -88.0399 },
  montgomery_al: { lat: 32.3792, lng: -86.3077 },
  huntsville_al: { lat: 34.7304, lng: -86.5861 },

  // South Carolina
  charleston_sc: { lat: 32.7765, lng: -79.9311 },
  columbia_sc: { lat: 34.0007, lng: -81.0348 },
  greenville_sc: { lat: 34.8526, lng: -82.3940 },

  // Louisiana
  new_orleans_la: { lat: 29.9511, lng: -90.0715 },
  baton_rouge_la: { lat: 30.4515, lng: -91.1871 },
  shreveport_la: { lat: 32.5252, lng: -93.7502 },
  lake_charles_la: { lat: 30.2266, lng: -93.2174 },

  // Mississippi
  jackson_ms: { lat: 32.2988, lng: -90.1848 },
  gulfport_ms: { lat: 30.3674, lng: -89.0928 },

  // Arkansas
  little_rock_ar: { lat: 34.7465, lng: -92.2896 },
  fort_smith_ar: { lat: 35.3859, lng: -94.3985 },

  // Oklahoma
  oklahoma_city_ok: { lat: 35.4676, lng: -97.5164 },
  tulsa_ok: { lat: 36.1540, lng: -95.9928 },

  // Kansas
  kansas_city_ks: { lat: 39.1141, lng: -94.6275 },
  wichita_ks: { lat: 37.6872, lng: -97.3301 },
  topeka_ks: { lat: 39.0473, lng: -95.6752 },

  // Nebraska
  omaha_ne: { lat: 41.2565, lng: -95.9345 },
  lincoln_ne: { lat: 40.8258, lng: -96.6852 },

  // Iowa
  des_moines_ia: { lat: 41.5868, lng: -93.6250 },
  cedar_rapids_ia: { lat: 41.9779, lng: -91.6656 },
  davenport_ia: { lat: 41.5236, lng: -90.5776 },

  // Utah
  salt_lake_city_ut: { lat: 40.7608, lng: -111.8910 },
  ogden_ut: { lat: 41.2230, lng: -111.9738 },
  provo_ut: { lat: 40.2338, lng: -111.6585 },

  // Nevada
  las_vegas_nv: { lat: 36.1699, lng: -115.1398 },
  reno_nv: { lat: 39.5296, lng: -119.8138 },

  // New Mexico
  albuquerque_nm: { lat: 35.0844, lng: -106.6504 },
  las_cruces_nm: { lat: 32.3199, lng: -106.7637 },

  // Idaho
  boise_id: { lat: 43.6150, lng: -116.2023 },

  // Montana
  billings_mt: { lat: 45.7833, lng: -108.5007 },
  missoula_mt: { lat: 46.8721, lng: -114.0047 },

  // Wyoming
  cheyenne_wy: { lat: 41.1400, lng: -104.8202 },
  casper_wy: { lat: 42.8501, lng: -106.3252 },

  // North Dakota
  fargo_nd: { lat: 46.8772, lng: -96.7898 },
  bismarck_nd: { lat: 46.8083, lng: -100.7837 },

  // South Dakota
  sioux_falls_sd: { lat: 43.5446, lng: -96.7311 },
  rapid_city_sd: { lat: 44.0805, lng: -103.2310 },

  // Connecticut
  hartford_ct: { lat: 41.7658, lng: -72.6734 },
  bridgeport_ct: { lat: 41.1865, lng: -73.1952 },
  new_haven_ct: { lat: 41.3083, lng: -72.9279 },

  // West Virginia
  charleston_wv: { lat: 38.3498, lng: -81.6326 },

  // Delaware
  wilmington_de: { lat: 39.7391, lng: -75.5398 },
  dover_de: { lat: 39.1582, lng: -75.5244 },

  // Maine
  portland_me: { lat: 43.6591, lng: -70.2568 },

  // New Hampshire
  manchester_nh: { lat: 42.9956, lng: -71.4548 },

  // Rhode Island
  providence_ri: { lat: 41.8240, lng: -71.4128 },

  // Vermont
  burlington_vt: { lat: 44.4759, lng: -73.2121 },

  // Hawaii
  honolulu_hi: { lat: 21.3069, lng: -157.8583 },

  // Alaska
  anchorage_ak: { lat: 61.2181, lng: -149.9003 },
}

/**
 * Look up coordinates for a city/state pair.
 * Returns null if city/state is null or not found.
 */
export function getCityCoords(
  city: string | null,
  state: string | null
): CityCoords | null {
  if (!city || !state) return null

  const key = `${city.toLowerCase().replace(/\s+/g, '_')}_${state.toLowerCase()}`
  return CITY_COORDS[key] ?? null
}
