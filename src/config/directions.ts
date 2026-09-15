export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DirectionsConfig {
  rideshare: {
    /** Where drivers should drop guests off, e.g. "Commerce St entrance". null until confirmed. */
    dropoffDescription: string | null;
    /** Exact drop-off point for the Uber and Lyft buttons. null until confirmed; never guess. */
    dropoffCoordinates: Coordinates | null;
    /** Where to meet a ride home afterwards. null until confirmed. */
    pickupNote: string | null;
  };
  parking: {
    summary: string;
    details: string | null;
  };
  valet: {
    /** null until confirmed. */
    available: boolean | null;
    details: string | null;
  };
  walking: {
    /** Numbered steps from the drop-off to the venue entrance. Empty until confirmed. */
    steps: string[];
    note: string | null;
  };
  accessibility: {
    /** Numbered step-free (elevator) route. Empty until confirmed. */
    stepFreeRoute: string[];
    note: string | null;
  };
  notices: { title: string; body: string }[];
}

export const directionsConfig: DirectionsConfig = {
  rideshare: {
    dropoffDescription: null,
    dropoffCoordinates: null,
    pickupNote: null,
  },
  parking: {
    summary: 'Parking near the venue is very limited, so we recommend taking a rideshare (Uber or Lyft) instead of driving.',
    details: null,
  },
  valet: {
    available: null,
    details: null,
  },
  walking: {
    steps: [],
    note: null,
  },
  accessibility: {
    stepFreeRoute: [],
    note: null,
  },
  notices: [
    {
      title: 'Another large event nearby',
      body: 'A large event is expected downtown the same day, so please allow extra travel time. More details soon.',
    },
  ],
};
