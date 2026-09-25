import type { StaticImageData } from 'next/image';
import carBadge from '../../public/Car.webp';
import garageABadge from '../../public/ParkingGarageA.webp';
import garageBBadge from '../../public/ParkingGarageB.webp';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** The badge artwork from the invitation map, so the site and the printed piece agree on sight. */
export interface ArrivalBadge {
  src: StaticImageData;
  alt: string;
}

export interface ParkingGarage {
  id: string;
  badge: ArrivalBadge;
  name: string;
  address: string;
  /** The garage's own pin, so the Maps link opens on it instead of a list of search results. */
  coordinates: Coordinates | null;
  /** In order, from parking the car to reaching the venue. */
  steps: string[];
}

export interface DirectionsConfig {
  rideshare: {
    summary: string;
    badge: ArrivalBadge;
    /**
     * Where drivers should drop guests off. Deliberately not the venue: the venue pin sits on the
     * river level inside the mall, where no car can reach, so routing a ride there would strand
     * the guest at whichever street door the app happened to choose.
     */
    dropoff: {
      /** Short label for the pin in Uber, Lyft and Maps. */
      name: string;
      /** Street address as the ride apps should show it back to the driver. */
      address: string;
      /** The exact point. null until confirmed; never guess. */
      coordinates: Coordinates | null;
      /** The prose line on the card. null until confirmed. */
      description: string | null;
    };
    /** Where to meet a ride home afterwards. null until confirmed. */
    pickupNote: string | null;
    /** In order, from the drop-off to the venue. */
    steps: string[];
  };
  parking: {
    summary: string;
    details: string | null;
    garages: ParkingGarage[];
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

// Every route ends the same way, because the venue sits on the river level inside the mall and
// that last leg is the part guests actually get wrong.
const TO_THE_VENUE = 'Follow the river level to Mexico Ceaty.';

export const directionsConfig: DirectionsConfig = {
  rideshare: {
    summary:
      'Parking downtown is limited and the garages fill up on event nights, so a rideshare is the easiest way in.',
    badge: { src: carBadge, alt: '' },
    dropoff: {
      name: 'Fogo de Chão at The Shops at Rivercenter',
      address: '849 E Commerce St, San Antonio, TX 78205',
      coordinates: { latitude: 29.4232636, longitude: -98.4844327 },
      description: 'Fogo de Chão at The Shops at Rivercenter, 849 E Commerce St.',
    },
    pickupNote: null,
    steps: [
      'Set the drop-off to Fogo de Chão at The Shops at Rivercenter, 849 E Commerce St.',
      'From E Commerce Street, go down to the river level and enter The Shops at Rivercenter.',
      TO_THE_VENUE,
    ],
  },
  parking: {
    summary: 'If you would rather drive, these two garages are the closest to the venue.',
    details: null,
    garages: [
      {
        id: 'garage-a',
        badge: { src: garageABadge, alt: 'Parking Garage A' },
        name: 'Rivercenter Commerce Street Garage',
        address: '835 E Commerce St',
        coordinates: { latitude: 29.4233336, longitude: -98.4849453 },
        steps: [
          'Park in the Rivercenter Commerce Street Garage.',
          'Enter The Shops at Rivercenter and go down to the river level.',
          TO_THE_VENUE,
        ],
      },
      {
        id: 'garage-b',
        badge: { src: garageBBadge, alt: 'Parking Garage B' },
        name: 'Crockett Street Garage',
        address: '105 E Market St',
        coordinates: { latitude: 29.4247389, longitude: -98.4844266 },
        steps: [
          'Park in the Crockett Street Garage.',
          'Enter The Shops at Rivercenter and go down to the river level.',
          TO_THE_VENUE,
        ],
      },
    ],
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
