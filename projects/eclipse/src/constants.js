// Physical constants for the N-body core. Standard gravitational parameters
// (GM) from JPL DE440/441 and IAU, in km^3/s^2, converted to AU^3/day^2 so the
// integrator works in the same AU / day units as the Horizons state vectors.
//
// We integrate point masses: Sun, 8 planets, and the Moon. Planet GMs are the
// planetary-system values (planet + its moons); the Moon is broken out as its
// own body because Earth-Moon geometry is what eclipse detection depends on.

export const AU_KM = 1.495978707e8; // km per AU (IAU 2012)
export const DAY_S = 86400; // seconds per day
export const J2000_JD = 2451545.0; // Julian Date of the J2000 epoch (TDB)

// GM in km^3 / s^2.
const GM_KM3_S2 = {
  sun: 132712440041.279419,
  mercury: 22031.868551,
  venus: 324858.592,
  earth: 398600.435507,
  moon: 4902.800118,
  mars: 42828.375816,
  jupiter: 126712764.1,
  saturn: 37940584.8418,
  uranus: 5794556.4,
  neptune: 6836527.10058,
};

// Convert km^3/s^2 -> AU^3/day^2.
const KM3S2_TO_AU3DAY2 = (DAY_S * DAY_S) / (AU_KM * AU_KM * AU_KM);

/** GM per body in AU^3 / day^2, keyed by body name. */
export const GM = Object.fromEntries(
  Object.entries(GM_KM3_S2).map(([k, v]) => [k, v * KM3S2_TO_AU3DAY2]),
);

/** Canonical body order used for all flat state arrays. */
export const BODY_NAMES = [
  'sun', 'mercury', 'venus', 'earth', 'moon',
  'mars', 'jupiter', 'saturn', 'uranus', 'neptune',
];

/** Sidereal orbital periods (days) — used only for UI labelling, not physics. */
export const PERIOD_DAYS = {
  mercury: 87.969, venus: 224.701, earth: 365.256, mars: 686.98,
  jupiter: 4332.59, saturn: 10759.22, uranus: 30688.5, neptune: 60182,
};
