import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Dimensions, PanResponder, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, Image as RNImage } from 'react-native';
import Slider from '@react-native-community/slider';
import BottomSheet from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  User,
  Navigation,
  Thermometer,
  Search,
  Trees,
  Droplets,
  Mountain,
  Plus,
  Coffee,
  Building2,
  Beer,
  ChevronLeft,
  Sparkles,
  Image as LucideImage,
  Info,
  CircleQuestionMark,
  Heart,
  Clock,
  MapPin,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Route as RouteIcon,
  Play,
  Flag,
  BookOpen,
  RotateCcw
} from 'lucide-react-native/icons';

const activityIcons = [
  { key: 'nature', label: 'Nature', color: '#8FAF79', Icon: Trees },
  { key: 'water', label: 'Water', color: '#4A9FD8', Icon: Droplets },
  { key: 'mountain', label: 'Mountains', color: '#5F9B63', Icon: Mountain },
  { key: 'add', label: 'AI Plan', color: '#F7D95C', Icon: Plus },
  { key: 'cafe', label: 'Cafes', color: '#A87955', Icon: Coffee },
  { key: 'family', label: 'Family', color: '#E5BD38', Icon: User },
  { key: 'city', label: 'Urban', color: '#868686', Icon: Building2 },
  { key: 'bar', label: 'Beer', color: '#7356A8', Icon: Beer }
];

const difficultyOptions = ['Easy', 'Medium', 'Hard'] as const;
const hikeOptions = ['30 min', '1 hr', '2 hr', '3 hr', '4 hr+'] as const;
const mustHaveOptions = [
  { key: 'accessible', label: 'Accessible', color: '#9A9A9A' },
  { key: 'freeEntry', label: 'Free entry', color: '#9A9A2F' },
  { key: 'dogFriendly', label: 'Dog friendly', color: '#1F1B18' },
  { key: 'kidFriendly', label: 'Kid friendly', color: '#F18E3F' },
  { key: 'publicTransit', label: 'Public transit', color: '#B8A58D' },
  { key: 'campsite', label: 'Campsite for night', color: '#1F3B67' },
  { key: 'picnic', label: 'Picnic spot', color: '#D3544A' }
] as const;

type Difficulty = (typeof difficultyOptions)[number];
type HikeLength = (typeof hikeOptions)[number];

type FilterState = {
  activityTypes: Record<string, boolean>;
  difficulty: Difficulty;
  distanceKm: number;
  hikeLength: HikeLength;
  mustHaves: Record<string, boolean>;
};

type Destination = {
  id: string;
  name: string;
  category: string;
  vibe: string;
  region: string;
  difficulty: Difficulty;
  distanceKm: number;
  duration: HikeLength;
  tags: string[];
  description: string;
  hours: string;
  routeInfo: string;
  image: string;
  position: [number, number];
};

type Memory = {
  id: string;
  destinationId?: string;
  date: string;
  note: string;
  image: string;
  photos?: string[];
  tripTitle?: string;
  vibe?: string;
  categories?: string[];
  stopCount?: number;
  difficulty?: Difficulty;
};

const baseDestinations: Destination[] = [
  {
    id: 'banias',
    name: 'Banias Waterfall Trail',
    category: 'water',
    vibe: 'Fresh and adventurous',
    region: 'Golan Heights',
    difficulty: 'Medium',
    distanceKm: 18,
    duration: '2 hr',
    tags: ['accessible', 'kidFriendly', 'picnic'],
    description: 'A shaded trail through streams, ancient ruins, and one of northern Israel’s most dramatic waterfalls.',
    hours: 'Daily, 8:00–16:00',
    routeInfo: '4.2 km loop · Moderate incline · Marked trail',
    image: 'https://picsum.photos/800/520?random=21',
    position: [33.2488, 35.6944]
  },
  {
    id: 'sataf',
    name: 'Sataf Springs',
    category: 'nature',
    vibe: 'Quiet and restorative',
    region: 'Jerusalem Hills',
    difficulty: 'Easy',
    distanceKm: 12,
    duration: '1 hr',
    tags: ['freeEntry', 'dogFriendly', 'picnic'],
    description: 'Terraced hills, spring-fed pools, and quiet paths overlooking the Jerusalem mountains.',
    hours: 'Open daily, sunrise–sunset',
    routeInfo: '3 km loop · Gentle descent · Shaded rest areas',
    image: 'https://picsum.photos/800/520?random=22',
    position: [31.7735, 35.1289]
  },
  {
    id: 'jaffa',
    name: 'Old Jaffa & Flea Market',
    category: 'city',
    vibe: 'Historic and lively',
    region: 'Tel Aviv-Jaffa',
    difficulty: 'Easy',
    distanceKm: 7,
    duration: '3 hr',
    tags: ['accessible', 'freeEntry', 'publicTransit'],
    description: 'A relaxed urban route through galleries, sea views, historic alleys, and the flea market.',
    hours: 'Best between 9:00–20:00',
    routeInfo: '2.8 km walk · Mostly level · Transit nearby',
    image: 'https://picsum.photos/800/520?random=23',
    position: [32.0523, 34.7514]
  },
  {
    id: 'coffee',
    name: 'Jerusalem Coffee Crawl',
    category: 'cafe',
    vibe: 'Warm and local',
    region: 'Jerusalem',
    difficulty: 'Easy',
    distanceKm: 5,
    duration: '2 hr',
    tags: ['accessible', 'publicTransit'],
    description: 'Three independent cafés, local pastries, and a slow walk through the city center.',
    hours: 'Sunday–Thursday, 8:00–22:00',
    routeInfo: '2.1 km walk · Three café stops · Light rail access',
    image: 'https://picsum.photos/800/520?random=24',
    position: [31.7802, 35.2168]
  },
  {
    id: 'night',
    name: 'Florentin After Dark',
    category: 'bar',
    vibe: 'Social and electric',
    region: 'South Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 9,
    duration: '4 hr+',
    tags: ['publicTransit'],
    description: 'Street art, small cocktail bars, live music, and late-night food in south Tel Aviv.',
    hours: 'Best from 19:00',
    routeInfo: '2.5 km walk · Four evening stops · Late transit nearby',
    image: 'https://picsum.photos/800/520?random=25',
    position: [32.0555, 34.7692]
  },
  {
    id: 'masada',
    name: 'Masada Sunrise',
    category: 'mountain',
    vibe: 'Bold and cinematic',
    region: 'Judean Desert',
    difficulty: 'Hard',
    distanceKm: 18,
    duration: '3 hr',
    tags: ['campsite', 'publicTransit'],
    description: 'A pre-dawn climb to a desert sunrise, followed by the historic plateau route.',
    hours: 'Snake Path opens before sunrise',
    routeInfo: '5.5 km · Steep ascent · Bring 2L water',
    image: 'https://picsum.photos/800/520?random=26',
    position: [31.3156, 35.3533]
  },
  {
    id: 'yarkon',
    name: 'Yarkon Riverside Park',
    category: 'nature',
    vibe: 'Green and easygoing',
    region: 'Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 4,
    duration: '1 hr',
    tags: ['accessible', 'dogFriendly', 'picnic'],
    description: 'Wide lawns, riverside paths, botanical corners, and quiet places for a slow afternoon.',
    hours: 'Open daily, 6:00-23:00',
    routeInfo: '4 km loop · Flat paths · Bike friendly',
    image: 'https://picsum.photos/800/520?random=27',
    position: [32.1007, 34.8112]
  },
  {
    id: 'apollonia',
    name: 'Apollonia Cliff View',
    category: 'nature',
    vibe: 'Scenic and breezy',
    region: 'Herzliya',
    difficulty: 'Medium',
    distanceKm: 14,
    duration: '2 hr',
    tags: ['picnic'],
    description: 'Coastal cliffs, ancient ruins, and open sea views along a compact nature reserve.',
    hours: 'Daily, 8:00-17:00',
    routeInfo: '3 km · Exposed cliff path · Viewpoints',
    image: 'https://picsum.photos/800/520?random=28',
    position: [32.1945, 34.8064]
  },
  {
    id: 'hilton-beach',
    name: 'Hilton Beach',
    category: 'water',
    vibe: 'Sunny and social',
    region: 'Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 3,
    duration: '1 hr',
    tags: ['accessible', 'freeEntry', 'publicTransit'],
    description: 'A lively city beach with calm swimming areas, sunset views, and nearby cafés.',
    hours: 'Open all day',
    routeInfo: 'Beach access · Lifeguard hours vary · Promenade',
    image: 'https://picsum.photos/800/520?random=29',
    position: [32.0876, 34.7682]
  },
  {
    id: 'rosh-hanikra',
    name: 'Rosh Hanikra Grottos',
    category: 'water',
    vibe: 'Dramatic and refreshing',
    region: 'Western Galilee',
    difficulty: 'Medium',
    distanceKm: 17,
    duration: '2 hr',
    tags: ['accessible', 'kidFriendly'],
    description: 'Sea caves, bright turquoise water, and a dramatic coastline reached by cable car.',
    hours: 'Daily, 9:00-17:00',
    routeInfo: 'Short grotto route · Wet surfaces · Cable car',
    image: 'https://picsum.photos/800/520?random=30',
    position: [33.0938, 35.1043]
  },
  {
    id: 'arbel',
    name: 'Mount Arbel Cliffs',
    category: 'mountain',
    vibe: 'High-energy and panoramic',
    region: 'Lower Galilee',
    difficulty: 'Hard',
    distanceKm: 19,
    duration: '4 hr+',
    tags: ['campsite'],
    description: 'A steep cliff trail with handholds and wide views over the Sea of Galilee.',
    hours: 'Daily, 8:00-16:00',
    routeInfo: '6 km · Steep sections · Experienced hikers',
    image: 'https://picsum.photos/800/520?random=34',
    position: [32.8125, 35.5002]
  },
  {
    id: 'ben-shemen',
    name: 'Ben Shemen Forest Trail',
    category: 'mountain',
    vibe: 'Earthy and active',
    region: 'Central District',
    difficulty: 'Medium',
    distanceKm: 18,
    duration: '3 hr',
    tags: ['dogFriendly', 'picnic'],
    description: 'Rolling forest tracks, lookout points, and flexible hiking loops through pine woodland.',
    hours: 'Open daily, sunrise-sunset',
    routeInfo: '7 km loop · Rolling terrain · Marked trail',
    image: 'https://picsum.photos/800/520?random=35',
    position: [31.9568, 34.9496]
  },
  {
    id: 'nahat-cafe',
    name: 'Nahat Coffee Cart',
    category: 'cafe',
    vibe: 'Slow and friendly',
    region: 'Rothschild, Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 2,
    duration: '30 min',
    tags: ['dogFriendly', 'publicTransit'],
    description: 'A relaxed specialty coffee stop with outdoor seating and fresh morning pastries.',
    hours: 'Sunday-Friday, 7:00-15:00',
    routeInfo: 'Street-level access · Outdoor seats · Takeaway',
    image: 'https://picsum.photos/800/520?random=36',
    position: [32.0647, 34.7751]
  },
  {
    id: 'nordic-bakery',
    name: 'Nordic Bakery Brunch',
    category: 'cafe',
    vibe: 'Cozy and indulgent',
    region: 'Neve Tzedek',
    difficulty: 'Easy',
    distanceKm: 4,
    duration: '1 hr',
    tags: ['accessible', 'publicTransit'],
    description: 'A warm bakery stop for sourdough, seasonal plates, and a quiet courtyard.',
    hours: 'Daily, 8:00-18:00',
    routeInfo: 'Indoor and courtyard seating · Walkable area',
    image: 'https://picsum.photos/800/520?random=37',
    position: [32.0607, 34.7654]
  },
  {
    id: 'rooftop',
    name: 'Jaffa Rooftop Sessions',
    category: 'bar',
    vibe: 'Golden-hour and musical',
    region: 'Old Jaffa',
    difficulty: 'Easy',
    distanceKm: 7,
    duration: '3 hr',
    tags: ['publicTransit'],
    description: 'A rooftop bar with harbor views, local DJs, and a compact evening menu.',
    hours: 'Tuesday-Saturday, 18:00-01:00',
    routeInfo: 'Rooftop access · Reservations recommended',
    image: 'https://picsum.photos/800/520?random=38',
    position: [32.0532, 34.7521]
  },
  {
    id: 'beer-garden',
    name: 'Levinsky Beer Garden',
    category: 'bar',
    vibe: 'Casual and communal',
    region: 'Levinsky Market',
    difficulty: 'Easy',
    distanceKm: 5,
    duration: '2 hr',
    tags: ['publicTransit', 'dogFriendly'],
    description: 'Craft beer, shared tables, and rotating food pop-ups beside the market.',
    hours: 'Monday-Saturday, 17:00-00:00',
    routeInfo: 'Outdoor seating · Market food nearby',
    image: 'https://picsum.photos/800/520?random=39',
    position: [32.0575, 34.7739]
  },
  {
    id: 'carmel-market',
    name: 'Carmel Market Tasting Walk',
    category: 'city',
    vibe: 'Colorful and energetic',
    region: 'Central Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 3,
    duration: '2 hr',
    tags: ['freeEntry', 'publicTransit'],
    description: 'Street food, spice stalls, small kitchens, and lively side streets.',
    hours: 'Sunday-Friday, 8:00-17:00',
    routeInfo: '1.8 km walk · Busy market lanes · Food stops',
    image: 'https://picsum.photos/800/520?random=40',
    position: [32.0681, 34.7697]
  },
  {
    id: 'tel-aviv-museum',
    name: 'Tel Aviv Museum Quarter',
    category: 'city',
    vibe: 'Creative and thoughtful',
    region: 'Central Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 4,
    duration: '3 hr',
    tags: ['accessible', 'publicTransit'],
    description: 'Modern art, sculpture gardens, architecture, and a calm city square.',
    hours: 'Monday-Saturday, hours vary',
    routeInfo: 'Indoor route · Fully accessible · Café on site',
    image: 'https://picsum.photos/800/520?random=41',
    position: [32.0776, 34.7868]
  },
  {
    id: 'hachorsha',
    name: 'HaChorsha Woodland',
    category: 'nature',
    vibe: 'Shaded and peaceful',
    region: 'Ramat Gan',
    difficulty: 'Easy',
    distanceKm: 8,
    duration: '1 hr',
    tags: ['dogFriendly', 'picnic', 'freeEntry'],
    description: 'A compact woodland escape with shaded paths, small clearings, and relaxed picnic corners.',
    hours: 'Open daily, sunrise-sunset',
    routeInfo: '2.6 km loop · Mostly flat · Shaded paths',
    image: 'https://picsum.photos/800/520?random=42',
    position: [32.0716, 34.8334]
  },
  {
    id: 'mekorot-springs',
    name: 'Mekorot Hidden Springs',
    category: 'water',
    vibe: 'Cool and secluded',
    region: 'Yarkon Headwaters',
    difficulty: 'Medium',
    distanceKm: 19,
    duration: '2 hr',
    tags: ['picnic', 'kidFriendly'],
    description: 'A short streamside walk connecting clear pools, reeds, and quiet shaded banks.',
    hours: 'Daily, 8:00-18:00',
    routeInfo: '3.8 km · Wet crossings · Natural shade',
    image: 'https://picsum.photos/800/520?random=43',
    position: [32.1128, 34.9215]
  },
  {
    id: 'modiin-ridge',
    name: 'Modiin Ridge Lookout',
    category: 'mountain',
    vibe: 'Open and adventurous',
    region: 'Modiin Hills',
    difficulty: 'Medium',
    distanceKm: 20,
    duration: '2 hr',
    tags: ['dogFriendly', 'picnic'],
    description: 'A rolling ridge trail with terracotta paths, broad valley views, and a sunset lookout.',
    hours: 'Open daily, sunrise-sunset',
    routeInfo: '5 km loop · Rocky climbs · Open viewpoints',
    image: 'https://picsum.photos/800/520?random=44',
    position: [31.9341, 34.9921]
  },
  {
    id: 'garden-cafe',
    name: 'Garden Coffee House',
    category: 'cafe',
    vibe: 'Leafy and unhurried',
    region: 'North Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 6,
    duration: '1 hr',
    tags: ['accessible', 'dogFriendly'],
    description: 'Specialty coffee, brunch plates, and a leafy terrace tucked behind a quiet street.',
    hours: 'Daily, 7:30-19:00',
    routeInfo: 'Terrace seating · Step-free access · Brunch menu',
    image: 'https://picsum.photos/800/520?random=45',
    position: [32.1021, 34.7935]
  },
  {
    id: 'live-music-yard',
    name: 'The Live Music Yard',
    category: 'bar',
    vibe: 'Loud and spontaneous',
    region: 'South Tel Aviv',
    difficulty: 'Easy',
    distanceKm: 8,
    duration: '3 hr',
    tags: ['publicTransit'],
    description: 'An open-air bar with small live sets, local beer, and rotating late-night food.',
    hours: 'Wednesday-Saturday, 20:00-02:00',
    routeInfo: 'Outdoor venue · Standing room · Late-night transit',
    image: 'https://picsum.photos/800/520?random=46',
    position: [32.0508, 34.7756]
  },
  {
    id: 'bauhaus-walk',
    name: 'White City Bauhaus Walk',
    category: 'city',
    vibe: 'Architectural and curious',
    region: 'Central Tel Aviv',
    difficulty: 'Medium',
    distanceKm: 4,
    duration: '2 hr',
    tags: ['freeEntry', 'publicTransit'],
    description: 'A self-guided urban route through restored modernist buildings, squares, and side streets.',
    hours: 'Best during daylight',
    routeInfo: '3.5 km walk · City sidewalks · Architecture stops',
    image: 'https://picsum.photos/800/520?random=47',
    position: [32.0751, 34.7769]
  }
];

type DestinationSeed = Pick<Destination, 'id' | 'name' | 'category' | 'region' | 'difficulty' | 'position'> & {
  tags?: string[];
};

const additionalDestinationSeeds: DestinationSeed[] = [
  { id: 'ein-gedi', name: 'Ein Gedi', category: 'water', region: 'Dead Sea', difficulty: 'Medium', position: [31.4513, 35.3842], tags: ['picnic'] },
  { id: 'sachne', name: 'Gan HaShlosha', category: 'water', region: 'Beit Shean Valley', difficulty: 'Easy', position: [32.5047, 35.4465], tags: ['kidFriendly', 'accessible'] },
  { id: 'dor-beach', name: 'Dor Beach', category: 'water', region: 'Carmel Coast', difficulty: 'Easy', position: [32.6114, 34.9207], tags: ['kidFriendly', 'picnic'] },
  { id: 'meshushim', name: 'Hexagon Pool', category: 'water', region: 'Golan Heights', difficulty: 'Hard', position: [32.9362, 35.6595], tags: ['freeEntry'] },
  { id: 'yarkon-springs', name: 'Yarkon Springs', category: 'water', region: 'Petah Tikva', difficulty: 'Easy', position: [32.1054, 34.9326], tags: ['accessible', 'kidFriendly'] },
  { id: 'red-canyon', name: 'Red Canyon Pools', category: 'water', region: 'Eilat Mountains', difficulty: 'Medium', position: [29.6664, 34.8751], tags: ['freeEntry'] },

  { id: 'mount-arbel', name: 'Mount Arbel', category: 'mountain', region: 'Lower Galilee', difficulty: 'Hard', position: [32.8242, 35.5016], tags: ['freeEntry'] },
  { id: 'mount-meron', name: 'Mount Meron', category: 'mountain', region: 'Upper Galilee', difficulty: 'Medium', position: [33.0006, 35.4124], tags: ['picnic'] },
  { id: 'wadi-qelt', name: 'Wadi Qelt', category: 'mountain', region: 'Judean Desert', difficulty: 'Hard', position: [31.8446, 35.4143], tags: ['freeEntry'] },
  { id: 'ramon-crater', name: 'Ramon Crater', category: 'mountain', region: 'Mitzpe Ramon', difficulty: 'Medium', position: [30.6094, 34.8011], tags: ['accessible'] },
  { id: 'gilboa-ridge', name: 'Gilboa Ridge', category: 'mountain', region: 'Jezreel Valley', difficulty: 'Medium', position: [32.5189, 35.4148], tags: ['picnic'] },
  { id: 'timna-cliffs', name: 'Timna Cliffs', category: 'mountain', region: 'Arava', difficulty: 'Hard', position: [29.7874, 34.9912], tags: ['campsite'] },

  { id: 'cafe-nahat', name: 'Cafe Nahat', category: 'cafe', region: 'Tel Aviv', difficulty: 'Easy', position: [32.0787, 34.7743], tags: ['publicTransit'] },
  { id: 'kadosh', name: 'Cafe Kadosh', category: 'cafe', region: 'Jerusalem', difficulty: 'Easy', position: [31.7815, 35.2208], tags: ['publicTransit'] },
  { id: 'elika', name: 'Elika Coffee', category: 'cafe', region: 'Haifa', difficulty: 'Easy', position: [32.8119, 34.9983], tags: ['accessible'] },
  { id: 'pundak-neot', name: 'Neot Semadar Cafe', category: 'cafe', region: 'Arava', difficulty: 'Easy', position: [30.0492, 35.0275], tags: ['accessible'] },
  { id: 'roasters-zichron', name: 'Zichron Roasters', category: 'cafe', region: 'Zichron Yaakov', difficulty: 'Easy', position: [32.5711, 34.9532], tags: ['dogFriendly'] },
  { id: 'galilee-bakery', name: 'Galilee Bakery', category: 'cafe', region: 'Rosh Pina', difficulty: 'Easy', position: [32.9688, 35.5427], tags: ['kidFriendly'] },

  { id: 'beer-bazaar', name: 'Beer Bazaar', category: 'bar', region: 'Tel Aviv', difficulty: 'Easy', position: [32.0671, 34.7692], tags: ['publicTransit'] },
  { id: 'glen-whisky', name: 'The Glen', category: 'bar', region: 'Jerusalem', difficulty: 'Easy', position: [31.7831, 35.2191], tags: ['publicTransit'] },
  { id: 'libira-haifa', name: 'Libira', category: 'bar', region: 'Haifa', difficulty: 'Easy', position: [32.8182, 34.9974], tags: ['publicTransit'] },
  { id: 'golan-brewery', name: 'Golan Brewery', category: 'bar', region: 'Katzrin', difficulty: 'Easy', position: [32.9931, 35.6929], tags: ['accessible'] },
  { id: 'arava-brew', name: 'Arava Brew', category: 'bar', region: 'Tzukim', difficulty: 'Easy', position: [30.4917, 35.1673], tags: ['accessible'] },
  { id: 'eilat-rooftop', name: 'Eilat Rooftop', category: 'bar', region: 'Eilat', difficulty: 'Easy', position: [29.5554, 34.9516], tags: ['publicTransit'] },

  { id: 'akko-old-city', name: 'Old Akko', category: 'city', region: 'Western Galilee', difficulty: 'Easy', position: [32.9236, 35.0697], tags: ['publicTransit'] },
  { id: 'mahane-yehuda', name: 'Mahane Yehuda', category: 'city', region: 'Jerusalem', difficulty: 'Easy', position: [31.7856, 35.2127], tags: ['publicTransit'] },
  { id: 'haifa-gardens', name: 'Bahai Gardens', category: 'city', region: 'Haifa', difficulty: 'Medium', position: [32.8142, 34.9874], tags: ['accessible'] },
  { id: 'beersheba-old-city', name: 'Old Beersheba', category: 'city', region: 'Negev', difficulty: 'Easy', position: [31.2401, 34.7904], tags: ['publicTransit'] },
  { id: 'caesarea-port', name: 'Caesarea Port', category: 'city', region: 'Sharon Coast', difficulty: 'Easy', position: [32.5028, 34.8914], tags: ['accessible'] },
  { id: 'nazareth-market', name: 'Nazareth Market', category: 'city', region: 'Lower Galilee', difficulty: 'Medium', position: [32.7036, 35.2967], tags: ['publicTransit'] },

  { id: 'agamon-hula', name: 'Agamon Hula', category: 'nature', region: 'Hula Valley', difficulty: 'Easy', position: [33.1022, 35.6118], tags: ['kidFriendly', 'accessible'] },
  { id: 'carmel-forest', name: 'Carmel Forest', category: 'nature', region: 'Mount Carmel', difficulty: 'Medium', position: [32.7319, 35.0222], tags: ['picnic'] },
  { id: 'ein-avdat', name: 'Ein Avdat', category: 'nature', region: 'Negev', difficulty: 'Medium', position: [30.8266, 34.7594], tags: ['kidFriendly'] },
  { id: 'adullam-park', name: 'Adullam Park', category: 'nature', region: 'Judean Foothills', difficulty: 'Easy', position: [31.6567, 34.9678], tags: ['dogFriendly', 'picnic'] },
  { id: 'alexander-river', name: 'Alexander River', category: 'nature', region: 'Sharon Plain', difficulty: 'Easy', position: [32.3937, 34.8843], tags: ['accessible', 'kidFriendly'] },
  { id: 'lotan-reserve', name: 'Lotan Bird Reserve', category: 'nature', region: 'Southern Arava', difficulty: 'Easy', position: [29.9857, 35.0874], tags: ['kidFriendly'] },

  { id: 'jerusalem-zoo', name: 'Jerusalem Zoo', category: 'family', region: 'Jerusalem', difficulty: 'Easy', position: [31.7482, 35.1778], tags: ['kidFriendly', 'accessible'] },
  { id: 'luna-gal', name: 'Luna Gal', category: 'family', region: 'Sea of Galilee', difficulty: 'Easy', position: [32.8477, 35.6452], tags: ['kidFriendly'] },
  { id: 'mada-tech', name: 'MadaTech', category: 'family', region: 'Haifa', difficulty: 'Easy', position: [32.8098, 34.9934], tags: ['kidFriendly', 'accessible'] },
  { id: 'mini-israel', name: 'Mini Israel', category: 'family', region: 'Latrun', difficulty: 'Easy', position: [31.8382, 34.9681], tags: ['kidFriendly', 'accessible'] },
  { id: 'yotvata-park', name: 'Yotvata Park', category: 'family', region: 'Arava', difficulty: 'Easy', position: [29.8955, 35.0608], tags: ['kidFriendly', 'accessible'] },
  { id: 'ramat-gan-safari', name: 'Ramat Gan Safari', category: 'family', region: 'Ramat Gan', difficulty: 'Easy', position: [32.0462, 34.8255], tags: ['kidFriendly', 'accessible'] },
  { id: 'balagan-yagur', name: 'Balagan Park', category: 'family', region: 'Kibbutz Yagur', difficulty: 'Easy', position: [32.7421, 35.0799], tags: ['kidFriendly'] },
  { id: 'carasso-science', name: 'Carasso Science Park', category: 'family', region: 'Beersheba', difficulty: 'Easy', position: [31.2389, 34.7868], tags: ['kidFriendly', 'accessible'] },
  { id: 'dairy-circus', name: 'Galilee Farm Day', category: 'family', region: 'Upper Galilee', difficulty: 'Easy', position: [33.0434, 35.3057], tags: ['kidFriendly'] },
  { id: 'eilat-observatory', name: 'Coral Observatory', category: 'family', region: 'Eilat', difficulty: 'Easy', position: [29.5044, 34.9184], tags: ['kidFriendly', 'accessible'] }
];

const categoryDescriptions: Record<string, string> = {
  water: 'A refreshing local stop with water views, natural scenery, and room to slow down.',
  mountain: 'A scenic route with elevated viewpoints, marked paths, and a rewarding outdoor atmosphere.',
  cafe: 'A welcoming local cafe with good coffee, relaxed seating, and a distinct neighborhood character.',
  bar: 'A lively evening stop for local drinks, music, and an easy social atmosphere.',
  city: 'An urban experience shaped by markets, architecture, culture, and walkable streets.',
  nature: 'An open-air escape with native landscapes, quiet trails, and memorable views.',
  family: 'An easygoing shared experience with activities designed for families and younger explorers.'
};

const destinations: Destination[] = [
  ...baseDestinations,
  ...additionalDestinationSeeds.map((seed, index): Destination => ({
    ...seed,
    vibe: seed.category === 'bar' ? 'Social and lively' : seed.category === 'family' ? 'Playful and easygoing' : 'Local and memorable',
    distanceKm: 12 + (index * 7) % 86,
    duration: seed.difficulty === 'Hard' ? '4 hr+' : seed.difficulty === 'Medium' ? '2 hr' : '1 hr',
    tags: seed.tags || ['freeEntry'],
    description: categoryDescriptions[seed.category],
    hours: seed.category === 'bar' ? 'Daily, 18:00-01:00' : seed.category === 'cafe' ? 'Daily, 8:00-19:00' : 'Open daily, check seasonal hours',
    routeInfo: `${seed.difficulty} visit - ${seed.region} - Local route stop`,
    image: `https://picsum.photos/800/520?random=${70 + index}`
  }))
];

const initialMemories: Memory[] = [
  {
    id: 'memory-banias',
    destinationId: 'banias',
    date: 'May 18, 2026',
    note: 'Cool water, a long picnic, and the best shaded trail of the spring.',
    image: 'https://picsum.photos/800/620?random=31'
  },
  {
    id: 'memory-jaffa',
    destinationId: 'jaffa',
    date: 'April 4, 2026',
    note: 'Golden hour by the harbor, then tiny galleries and dinner in the market.',
    image: 'https://picsum.photos/800/620?random=32'
  },
  {
    id: 'memory-sataf',
    destinationId: 'sataf',
    date: 'March 12, 2026',
    note: 'A quiet morning loop with coffee by the spring.',
    image: 'https://picsum.photos/800/620?random=33'
  }
];

const vibeAccents: Record<string, string> = {
  nature: '#A7C48B',
  water: '#4A9FD8',
  cafe: '#A87955',
  bar: '#7356A8',
  city: '#868686',
  mountain: '#5F9B63',
  family: '#E5BD38',
  add: '#F7D95C'
};

const categoryPinColors: Record<string, string> = {
  nature: '#8FAF79',
  water: '#2788CC',
  mountain: '#4E9155',
  cafe: '#8B5E3C',
  bar: '#6944A5',
  city: '#777777',
  family: '#E2B52B'
};

type AppStateValue = {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  recommendations: Destination[];
  setRecommendations: React.Dispatch<React.SetStateAction<Destination[]>>;
  routeStops: Destination[];
  setRouteStops: React.Dispatch<React.SetStateAction<Destination[]>>;
  addToJourney: (destination: Destination) => void;
  removeFromJourney: (destinationId: string) => void;
  toggleJourneyStop: (destination: Destination) => void;
  savedIds: string[];
  toggleSaved: (id: string) => void;
  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;
  selectedCategory: string;
  selectedCategories: string[];
  accent: string;
};

const AppStateContext = createContext<AppStateValue | null>(null);

function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error('App state is unavailable');
  }
  return value;
}

function getJourneyDifficulty(stops: Destination[], fallback: Difficulty): Difficulty {
  if (stops.some((stop) => stop.difficulty === 'Hard')) return 'Hard';
  if (stops.some((stop) => stop.difficulty === 'Medium')) return 'Medium';
  return stops.length ? 'Easy' : fallback;
}

function getJourneyStatus(stopCount: number) {
  if (stopCount === 0) return 'Journey (No Stops Yet)';
  return `Journey (${stopCount} ${stopCount === 1 ? 'Stop' : 'Stops'} Ready)`;
}

function calculateJourneyDistance(stops: Destination[]) {
  if (stops.length < 2) return 0;
  const earthRadiusKm = 6371;
  return stops.slice(1).reduce((total, stop, index) => {
    const previous = stops[index];
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const latitudeDelta = toRadians(stop.position[0] - previous.position[0]);
    const longitudeDelta = toRadians(stop.position[1] - previous.position[1]);
    const firstLatitude = toRadians(previous.position[0]);
    const secondLatitude = toRadians(stop.position[0]);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return total + earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }, 0);
}

const isWebPlatform = Platform.OS === 'web';

if (isWebPlatform) {
  require('leaflet/dist/leaflet.css');
  const L = require('leaflet');
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png')
  });
  // Inject a Google Font for the logo on web
  try {
    const fontLinkId = 'trippin-google-font-rye';
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link');
      link.id = fontLinkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Rye&display=swap';
      document.head.appendChild(link);
    }
    const mapStyleId = 'trippin-map-interactions';
    if (!document.getElementById(mapStyleId)) {
      const style = document.createElement('style');
      style.id = mapStyleId;
      style.textContent = `
        @keyframes trippinPinIn {
          from { opacity: 0; transform: translateY(8px) scale(.88); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .trippin-map-pin > div { animation: trippinPinIn .28s ease-out both; transition: transform .18s ease, filter .18s ease; }
        .trippin-map-pin:hover > div { transform: translateY(-3px) scale(1.03); filter: drop-shadow(0 6px 8px rgba(0,0,0,.24)); }
      `;
      document.head.appendChild(style);
    }
    const appShellStyleId = 'trippin-web-app-shell';
    if (!document.getElementById(appShellStyleId)) {
      const style = document.createElement('style');
      style.id = appShellStyleId;
      style.textContent = `
        html, body, #root {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
          background: #E8E1D8;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (e) {
    // ignore when document is not available
  }
}

type WebMapProps = {
  center: [number, number];
  pins?: Destination[];
  routeStops?: Destination[];
  accent?: string;
  activeDifficulty?: Difficulty;
  selectedPinId?: string | null;
  onSelectPin?: (destination: Destination) => void;
  onMapPress?: () => void;
};

const difficultyColors: Record<Difficulty, string> = {
  Easy: '#67A66A',
  Medium: '#E3A33A',
  Hard: '#D3544A'
};

function WebMap({
  center,
  pins = [],
  routeStops = [],
  accent = vibeAccents.city,
  activeDifficulty = 'Medium',
  selectedPinId = null,
  onSelectPin = () => undefined,
  onMapPress = () => undefined
}: WebMapProps) {
  if (!isWebPlatform) {
    return null;
  }

  const { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } = require('react-leaflet');
  const L = require('leaflet');

  function FitVisiblePins({ visiblePins }: { visiblePins: Destination[] }) {
    const map = useMap();
    useEffect(() => {
      if (visiblePins.length === 0) {
        map.setView(center, 12);
        return;
      }
      const bounds = L.latLngBounds(visiblePins.map((pin) => pin.position));
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 12 });
    }, [map, visiblePins]);
    return null;
  }

  function MapBackgroundEvents() {
    useMapEvents({ click: onMapPress });
    return null;
  }

  const createPinIcon = (destination: Destination, inRoute: boolean, focused: boolean) => {
    const difficultyColor = difficultyColors[destination.difficulty];
    const categoryColor = categoryPinColors[destination.category] || accent;
    const emphasized = destination.difficulty === activeDifficulty || inRoute || focused;
    const selected = inRoute || focused;
    const label = destination.name.replace(/[<>&"']/g, '');
    const metadata = `${destination.difficulty} · ${destination.duration}`;
    return L.divIcon({
      className: 'trippin-map-pin',
      html: `
        <div style="display:flex;align-items:center;opacity:${emphasized ? 1 : 0.55};filter:drop-shadow(0 3px 5px rgba(0,0,0,.18));">
          <div style="width:${selected ? 34 : 28}px;height:${selected ? 34 : 28}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${categoryColor};border:3px solid ${focused ? '#FFFFFF' : selected ? '#111111' : '#fff'};box-shadow:${focused ? '0 0 0 3px #111111' : 'none'};display:flex;align-items:center;justify-content:center;">
            <div style="width:7px;height:7px;border-radius:50%;background:${difficultyColor};border:1px solid #fff;"></div>
          </div>
          <div style="margin-left:7px;background:#fff;border:2px solid ${focused ? '#111111' : selected ? categoryColor : difficultyColor};border-radius:11px;padding:5px 8px;white-space:nowrap;font-family:Arial,sans-serif;">
            <div style="font-size:11px;font-weight:800;color:#1B2733;">${selected ? '✓ ' : ''}${label}</div>
            <div style="font-size:9px;color:#6F675F;margin-top:2px;text-transform:capitalize;">${destination.category} · ${metadata}</div>
          </div>
        </div>
      `,
      iconSize: [190, 42],
      iconAnchor: [14, 28]
    });
  };

  return (
    <View style={styles.mapWrapper}>
      <MapContainer center={center} zoom={12} style={styles.mapContainer} scrollWheelZoom>
        <FitVisiblePins visiblePins={pins} />
        <MapBackgroundEvents />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {routeStops.length > 1 && (
          <Polyline
            positions={routeStops.map((stop) => stop.position)}
            pathOptions={{ color: '#111111', weight: 6, opacity: 0.9, dashArray: '3 10', lineCap: 'round' }}
          />
        )}
        {pins.map((destination) => (
          <Marker
            key={destination.id}
            position={destination.position}
            icon={createPinIcon(
              destination,
              routeStops.some((stop) => stop.id === destination.id),
              selectedPinId === destination.id
            )}
            eventHandlers={{
              click: (event: any) => {
                L.DomEvent.stopPropagation(event.originalEvent);
                onSelectPin(destination);
              }
            }}
          />
        ))}
      </MapContainer>
    </View>
  );
}

type RootStackParamList = {
  Welcome: undefined;
  Instructions: undefined;
  About: undefined;
  Map: undefined;
  Profile: undefined;
  Recommendations: undefined;
  Route: undefined;
  EditTrip: undefined;
  JourneyMode: undefined;
  JourneyComplete: undefined;
  Destination: { destinationId: string };
  Memory: { memoryId: string };
};

type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;
type WelcomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
type InstructionsScreenProps = NativeStackScreenProps<RootStackParamList, 'Instructions'>;
type AboutScreenProps = NativeStackScreenProps<RootStackParamList, 'About'>;
type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;
type RecommendationsScreenProps = NativeStackScreenProps<RootStackParamList, 'Recommendations'>;
type RouteScreenProps = NativeStackScreenProps<RootStackParamList, 'Route'>;
type EditTripScreenProps = NativeStackScreenProps<RootStackParamList, 'EditTrip'>;
type JourneyModeScreenProps = NativeStackScreenProps<RootStackParamList, 'JourneyMode'>;
type JourneyCompleteScreenProps = NativeStackScreenProps<RootStackParamList, 'JourneyComplete'>;
type DestinationScreenProps = NativeStackScreenProps<RootStackParamList, 'Destination'>;
type MemoryScreenProps = NativeStackScreenProps<RootStackParamList, 'Memory'>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.welcomeScreen}>
      <StatusBar style="dark" />
      <View style={styles.welcomeContent}>
        <View style={styles.welcomeLogoCircle}>
          <Mountain size={68} color="#2D2D2D" />
          <Text style={styles.welcomeLogoText}>TRIPPIN'</Text>
          <Text style={styles.welcomeLogoSince}>SINCE 2026</Text>
        </View>
        <Text style={styles.welcomeTitle}>Welcome to Trippin</Text>
        <Text style={styles.welcomeSubtitle}>
          Build one personalized Journey with map exploration and AI-powered suggestions.
        </Text>
      </View>
      <View style={styles.welcomeActions}>
        <Pressable style={styles.welcomeSecondaryButton} onPress={() => navigation.navigate('Instructions')}>
          <BookOpen size={19} color="#625D57" />
          <Text style={styles.welcomeSecondaryText}>How to Use</Text>
        </Pressable>
        <Pressable style={styles.welcomePrimaryButton} onPress={() => navigation.replace('Map')}>
          <Text style={styles.welcomePrimaryText}>Enter App</Text>
          <ChevronLeft size={20} color="#1B2733" style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InstructionsScreen({ navigation }: InstructionsScreenProps) {
  const steps = [
    'Choose one or more vibe categories.',
    'Explore pins or AI suggestions.',
    'Add places to your Journey.',
    'Edit and organize the route.',
    'Start Journey.',
    'Complete the experience.',
    'Save a memory.'
  ];

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader title="How to Explore Trippin" label="Demo guide" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.instructionsCard} showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionsDescription}>
          Map pins and AI suggestions build the same Journey. Add stops, organize the route, then start exploring.
        </Text>
        {steps.map((step, index) => (
          <View key={step} style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{step}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.instructionsActions}>
        <Pressable style={styles.instructionsBackButton} onPress={() => navigation.navigate('Map')}>
          <ChevronLeft size={19} color="#625D57" />
          <Text style={styles.routeEditActionText}>Back to App</Text>
        </Pressable>
        <Pressable style={styles.instructionsStartButton} onPress={() => navigation.navigate('Map')}>
          <Play size={20} color="#1B2733" />
          <Text style={styles.bottomActionText}>Start Demo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function AboutScreen({ navigation }: AboutScreenProps) {
  const features = [
    'Interactive map exploration',
    'One shared Journey and route',
    'AI-assisted recommendations',
    'Travel memories'
  ];
  const team = ['Noa Haba', 'Leoniya Khaldeyev', 'Deborah Medioni', 'Tzipora Kermaier'];

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader title="About Trippin" label="University UX/UI project" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.aboutScroll}>
        <View style={styles.profileSectionCard}>
          <Text style={styles.aboutLead}>
            Trippin is a university UX/UI project focused on making trip planning more intuitive, personalized, and experience-driven.
          </Text>
          <Text style={styles.sectionLabel}>The platform combines</Text>
          {features.map((feature) => (
            <View key={feature} style={styles.aboutListRow}>
              <View style={styles.aboutBullet} />
              <Text style={styles.aboutListText}>{feature}</Text>
            </View>
          ))}
        </View>
        <View style={styles.profileSectionCard}>
          <Text style={styles.sectionLabel}>Built by</Text>
          {team.map((member) => (
            <Text key={member} style={styles.aboutTeamName}>{member}</Text>
          ))}
        </View>
      </ScrollView>
      <Pressable style={styles.welcomePrimaryButtonFloating} onPress={() => navigation.navigate('Map')}>
        <MapPin size={20} color="#1B2733" />
        <Text style={styles.bottomActionText}>Back to Main Map</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function MapScreen({ navigation }: MapScreenProps) {
  const { filters, setFilters, accent, selectedCategories, routeStops, toggleJourneyStop } = useAppState();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Requesting location permission...');
  const sheetRef = useRef<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetProgress = useRef(new Animated.Value(1)).current;
  const [sheetIndex, setSheetIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedPin, setSelectedPin] = useState<Destination | null>(null);
  const selectedCategory = selectedCategories.length
    ? selectedCategories
        .map((key) => (key === 'cafe' ? 'Cafes' : activityIcons.find((item) => item.key === key)?.label || key))
        .join(' + ')
    : 'all';

  const isWeb = Platform.OS === 'web';
  const snapPoints = useMemo(() => ['180px', '65%'], []);

  const windowHeight = Dimensions.get('window').height;
  const midSheetHeight = windowHeight * 0.65;
  const peekVisiblePx = 180;
  const collapsedTranslate = midSheetHeight - peekVisiblePx;

  const sheetTranslate = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, collapsedTranslate]
  });

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    Animated.timing(sheetProgress, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start(() => setSheetOpen(false));
  }, [isWeb, sheetProgress]);

  const toggleWebSheet = () => {
    Animated.timing(sheetProgress, {
      toValue: sheetOpen ? 1 : 0,
      duration: 350,
      useNativeDriver: true
    }).start(() => setSheetOpen(!sheetOpen));
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationStatus('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        setLocationStatus('Location acquired');
      } catch (error) {
        setLocationStatus('Unable to get location. Please try again.');
        console.warn('Location error:', error);
      }
    })();
  }, []);

  const toggleActivity = (key: string) => {
    if (key === 'add') {
      navigation.navigate('Recommendations');
      return;
    }
    setFilters((current) => ({
      ...current,
      activityTypes: {
        ...current.activityTypes,
        [key]: !current.activityTypes[key]
      }
    }));
    setSelectedPin(null);
  };

  const toggleMustHave = (key: string) => {
    setFilters((current) => ({
      ...current,
      mustHaves: {
        ...current.mustHaves,
        [key]: !current.mustHaves[key]
      }
    }));
  };

  const handlePlan = () => {
    navigation.navigate('Recommendations');
  };

  const samplePins: Array<{ id: string; position: [number, number]; title?: string }> = useMemo(
    () => [
      { id: 'p1', position: [32.0668, 34.7809] as [number, number], title: 'Beach lookout' },
      { id: 'p2', position: [32.1005, 34.8001] as [number, number], title: 'River walk' },
      { id: 'p3', position: [32.0200, 34.8200] as [number, number], title: 'Mountain trail' },
      { id: 'p4', position: [32.0500, 34.7600] as [number, number], title: 'City café' }
    ],
    []
  );

  const visiblePins = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return destinations.filter((destination) => {
      const matchesSearch =
        !query ||
        destination.name.toLowerCase().includes(query) ||
        destination.region.toLowerCase().includes(query);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(destination.category);
      return matchesCategory && destination.distanceKm <= filters.distanceKm && matchesSearch;
    });
  }, [filters.distanceKm, searchText, selectedCategories]);

  const mapPins = useMemo(
    () => [...visiblePins, ...routeStops.filter((stop) => !visiblePins.some((pin) => pin.id === stop.id))],
    [routeStops, visiblePins]
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container}>
        <View style={styles.mapBackground} />
        {isWeb && (
          <WebMap
            center={userLocation ? [userLocation.latitude, userLocation.longitude] : [32.0868, 34.8090]}
            pins={mapPins}
            routeStops={routeStops}
            accent={accent}
            activeDifficulty={filters.difficulty}
            selectedPinId={selectedPin?.id}
            onSelectPin={(destination) =>
              setSelectedPin((current) => (current?.id === destination.id ? null : destination))
            }
            onMapPress={() => setSelectedPin(null)}
          />
        )}

        <View style={styles.overlayContainer} pointerEvents="box-none">
          <View style={styles.logoBadgeWrapper} pointerEvents="box-none">
            <View style={styles.logoBadge} pointerEvents="auto">
              <Text style={styles.logoText}>TRIPPIN'</Text>
            </View>
          </View>

          <View style={styles.searchWrapper} pointerEvents="box-none">
            <View style={styles.searchBar} pointerEvents="auto">
              <Search size={22} color="#2D2D2D" />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search"
                style={styles.searchInput}
                placeholderTextColor="#8B8B8B"
              />
            </View>
          </View>

          <View style={styles.rightButtonsContainer} pointerEvents="box-none">
            <Pressable style={styles.circleButton} onPress={() => navigation.navigate('Profile')}>
              <User size={22} color="#2D2D2D" />
            </Pressable>
            <Pressable style={styles.circleButton} onPress={() => navigation.navigate('EditTrip')}>
              <Navigation size={22} color="#2D2D2D" />
            </Pressable>
            <Pressable
              style={styles.circleButton}
              onPress={() => setLocationStatus('Clear skies · 24°C · Great conditions')}
            >
              <Thermometer size={22} color="#2D2D2D" />
            </Pressable>
            <Pressable style={styles.circleButton} onPress={() => navigation.navigate('Instructions')}>
              <CircleQuestionMark size={22} color="#2D2D2D" />
            </Pressable>
          </View>
        </View>

        <View style={styles.mapFeedback} pointerEvents="none">
          <View style={[styles.mapFeedbackDot, { backgroundColor: accent }]} />
          <Text style={styles.mapFeedbackText}>
            {visiblePins.length} {selectedCategory} places · tap to add to your Journey
          </Text>
        </View>

        <Pressable
          style={[styles.editTripMapPill, { borderColor: accent }]}
          onPress={() => navigation.navigate('EditTrip')}
        >
          <RouteIcon size={16} color="#1B2733" />
          <Text style={styles.editTripMapPillText}>{getJourneyStatus(routeStops.length)}</Text>
        </Pressable>

        {selectedPin && (
          <View style={styles.mapPreviewCard}>
            <RNImage source={{ uri: selectedPin.image }} style={styles.mapPreviewImage} />
            <View style={styles.mapPreviewBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.mapPreviewTitle}>{selectedPin.name}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: difficultyColors[selectedPin.difficulty] }]}>
                  <Text style={styles.difficultyBadgeText}>{selectedPin.difficulty}</Text>
                </View>
              </View>
              <Text style={styles.mapPreviewMeta}>
                {selectedPin.category} · {selectedPin.region} · {selectedPin.duration}
              </Text>
              <Text style={styles.mapPreviewDescription} numberOfLines={2}>{selectedPin.description}</Text>
              <View style={styles.mapPreviewActions}>
                <Pressable
                  style={styles.previewSecondaryButton}
                  onPress={() => navigation.navigate('Destination', { destinationId: selectedPin.id })}
                >
                  <Text style={styles.previewSecondaryText}>View Details</Text>
                </Pressable>
                <Pressable
                  style={[styles.previewPrimaryButton, { backgroundColor: accent }]}
                  onPress={() => toggleJourneyStop(selectedPin)}
                >
                  {routeStops.some((stop) => stop.id === selectedPin.id) ? (
                    <Trash2 size={16} color="#1B2733" />
                  ) : (
                    <Plus size={16} color="#1B2733" />
                  )}
                  <Text style={styles.previewPrimaryText}>
                    {routeStops.some((stop) => stop.id === selectedPin.id) ? 'Remove from Journey' : 'Add to Journey'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {isWeb ? (
          <Animated.View style={[styles.webSheet, { transform: [{ translateY: sheetTranslate }] }]}> 
            <Pressable style={styles.handleBar} onPress={toggleWebSheet}>
              <View style={styles.handleLine} />
            </Pressable>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Pressable style={[styles.planButton, { backgroundColor: accent }]} onPress={handlePlan}>
                <View style={styles.planButtonContent}>
                  <Sparkles size={22} color="#2D2D2D" />
                  <Text style={styles.planButtonText}>Plan my Journey with AI</Text>
                </View>
              </Pressable>

              <View style={styles.section}>
                <View style={styles.flowRow}>
                  {activityIcons.slice(0, 4).map((item) => {
                    const selected = filters.activityTypes[item.key];
                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.activityButton,
                          selected && { backgroundColor: categoryPinColors[item.key] || item.color, borderColor: categoryPinColors[item.key] || item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
                        <Text style={styles.activityLabel}>{item.key === 'cafe' ? 'Cafes' : item.label}</Text>
                        {selected && item.key !== 'add' && <Check size={12} color="#1B2733" style={styles.activityCheck} />}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.flowRow}>
                  {activityIcons.slice(4).map((item) => {
                    const selected = filters.activityTypes[item.key];
                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.activityButton,
                          selected && { backgroundColor: categoryPinColors[item.key] || item.color, borderColor: categoryPinColors[item.key] || item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
                        <Text style={styles.activityLabel}>{item.key === 'cafe' ? 'Cafes' : item.label}</Text>
                        {selected && item.key !== 'add' && <Check size={12} color="#1B2733" style={styles.activityCheck} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Difficulty</Text>
                <View style={styles.segmentedControl}>
                  {difficultyOptions.map((option) => {
                    const selected = filters.difficulty === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.segmentButton,
                          selected && {
                            backgroundColor: difficultyColors[option],
                            borderColor: difficultyColors[option]
                          }
                        ]}
                        onPress={() => {
                          setFilters((current) => ({ ...current, difficulty: option }));
                          setSelectedPin(null);
                        }}
                      >
                        <Text style={[styles.segmentText, selected && styles.difficultySelectedText]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Distance from me</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#8CC9F3"
                  maximumTrackTintColor="#E7E0D7"
                  thumbTintColor="#1B2733"
                  value={filters.distanceKm}
                  onValueChange={(value) => setFilters((current) => ({ ...current, distanceKm: value }))}
                />
                <Text style={styles.sliderValue}>{filters.distanceKm} km</Text>
                <Text style={styles.locationText}>{userLocation ? 'Using your location' : locationStatus}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Hike Length</Text>
                <View style={styles.lengthOptions}>
                  {hikeOptions.map((option) => {
                    const selected = filters.hikeLength === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.lengthButton, selected && styles.lengthButtonSelected]}
                        onPress={() => setFilters((current) => ({ ...current, hikeLength: option }))}
                      >
                        <Text style={[styles.lengthText, selected && styles.lengthTextSelected]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Must Haves</Text>
                {mustHaveOptions.map((option) => {
                  const selected = filters.mustHaves[option.key];
                  return (
                      <Pressable
                        key={option.key}
                        style={[styles.mustHaveButton, selected && { borderColor: option.color, backgroundColor: option.color + '22' }]}
                        onPress={() => toggleMustHave(option.key)}
                      >
                      <Text style={[styles.mustHaveText, selected && { color: option.color }]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        ) : (
          <BottomSheet
            ref={sheetRef}
            index={0}
            snapPoints={snapPoints}
            animateOnMount
            enablePanDownToClose={false}
            backdropComponent={() => null}
            backgroundStyle={styles.sheetBackground}
            onChange={(idx) => {
              setSheetIndex(idx as number);
            }}
            handleComponent={() => (
              <Pressable
                style={styles.handleBar}
                onPress={() => {
                  const target = sheetIndex === 0 ? 1 : 0;
                  sheetRef.current?.snapToIndex(target);
                }}
              >
                <View style={styles.handleLine} />
              </Pressable>
            )}
          >
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Pressable style={[styles.planButton, { backgroundColor: accent }]} onPress={handlePlan}>
                <View style={styles.planButtonContent}>
                  <Sparkles size={22} color="#2D2D2D" />
                  <Text style={styles.planButtonText}>Plan my Journey with AI</Text>
                </View>
              </Pressable>

              <View style={styles.section}>
                <View style={styles.flowRow}>
                  {activityIcons.slice(0, 4).map((item) => {
                    const selected = filters.activityTypes[item.key];
                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.activityButton,
                          selected && { backgroundColor: categoryPinColors[item.key] || item.color, borderColor: categoryPinColors[item.key] || item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
                        <Text style={styles.activityLabel}>{item.key === 'cafe' ? 'Cafes' : item.label}</Text>
                        {selected && item.key !== 'add' && <Check size={12} color="#1B2733" style={styles.activityCheck} />}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.flowRow}>
                  {activityIcons.slice(4).map((item) => {
                    const selected = filters.activityTypes[item.key];
                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.activityButton,
                          selected && { backgroundColor: categoryPinColors[item.key] || item.color, borderColor: categoryPinColors[item.key] || item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
                        <Text style={styles.activityLabel}>{item.key === 'cafe' ? 'Cafes' : item.label}</Text>
                        {selected && item.key !== 'add' && <Check size={12} color="#1B2733" style={styles.activityCheck} />}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Difficulty</Text>
                <View style={styles.segmentedControl}>
                  {difficultyOptions.map((option) => {
                    const selected = filters.difficulty === option;
                    return (
                      <Pressable
                        key={option}
                        style={[
                          styles.segmentButton,
                          selected && {
                            backgroundColor: difficultyColors[option],
                            borderColor: difficultyColors[option]
                          }
                        ]}
                        onPress={() => {
                          setFilters((current) => ({ ...current, difficulty: option }));
                          setSelectedPin(null);
                        }}
                      >
                        <Text style={[styles.segmentText, selected && styles.difficultySelectedText]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Distance from me</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  minimumTrackTintColor="#8CC9F3"
                  maximumTrackTintColor="#E7E0D7"
                  thumbTintColor="#1B2733"
                  value={filters.distanceKm}
                  onValueChange={(value) => setFilters((current) => ({ ...current, distanceKm: value }))}
                />
                <Text style={styles.sliderValue}>{filters.distanceKm} km</Text>
                <Text style={styles.locationText}>{userLocation ? 'Using your location' : locationStatus}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Hike Length</Text>
                <View style={styles.lengthOptions}>
                  {hikeOptions.map((option) => {
                    const selected = filters.hikeLength === option;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.lengthButton, selected && styles.lengthButtonSelected]}
                        onPress={() => setFilters((current) => ({ ...current, hikeLength: option }))}
                      >
                        <Text style={[styles.lengthText, selected && styles.lengthTextSelected]}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Must Haves</Text>
                {mustHaveOptions.map((option) => {
                  const selected = filters.mustHaves[option.key];
                  return (
                      <Pressable
                        key={option.key}
                        style={[styles.mustHaveButton, selected && { borderColor: option.color, backgroundColor: option.color + '22' }]}
                        onPress={() => toggleMustHave(option.key)}
                      >
                      <Text style={[styles.mustHaveText, selected && { color: option.color }]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </BottomSheet>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function ScreenHeader({
  title,
  label,
  onBack,
  action
}: {
  title: string;
  label: string;
  onBack: () => void;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.detailHeader}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <ChevronLeft size={22} color="#2D2D2D" />
      </Pressable>
      <View style={styles.detailHeaderCopy}>
        <Text style={styles.profileHeaderLabel}>{label}</Text>
        <Text style={styles.profileHeaderTitle}>{title}</Text>
      </View>
      <View style={styles.headerAction}>{action}</View>
    </View>
  );
}

function DestinationCard({
  destination,
  accent,
  onOpen,
  onAdd,
  added
}: {
  destination: Destination;
  accent: string;
  onOpen: () => void;
  onAdd: () => void;
  added: boolean;
}) {
  return (
    <Pressable style={styles.destinationCard} onPress={onOpen}>
      <RNImage source={{ uri: destination.image }} style={styles.destinationCardImage} />
      <View style={styles.destinationCardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.destinationCardTitle}>{destination.name}</Text>
          <View style={[styles.categoryDot, { backgroundColor: vibeAccents[destination.category] }]} />
        </View>
        <Text style={styles.destinationMeta}>
          {destination.difficulty} · {destination.duration} · {destination.distanceKm} km away
        </Text>
        <View style={styles.tagRow}>
          {destination.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.smallTag}>
              <Text style={styles.smallTagText}>{tag.replace(/([A-Z])/g, ' $1')}</Text>
            </View>
          ))}
        </View>
        <View style={styles.recommendationActions}>
          <Pressable
            style={styles.recommendationDetailsButton}
            onPress={(event) => {
              event.stopPropagation();
              onOpen();
            }}
          >
            <Text style={styles.previewSecondaryText}>View Details</Text>
          </Pressable>
          <Pressable
            style={[styles.recommendationJourneyButton, { backgroundColor: added ? '#E8E1D7' : accent }]}
            onPress={(event) => {
              event.stopPropagation();
              onAdd();
            }}
          >
            <Text style={styles.recommendationJourneyText}>{added ? 'Remove' : 'Add to Journey'}</Text>
            {added ? <Trash2 size={17} color="#1B2733" /> : <Plus size={17} color="#1B2733" />}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function RecommendationsScreen({ navigation }: RecommendationsScreenProps) {
  const { filters, recommendations, setRecommendations, routeStops, toggleJourneyStop, accent, selectedCategories } = useAppState();
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = ['Analyzing preferences', 'Finding matching places', 'Preparing Journey suggestions'];

  useEffect(() => {
    const selectedMustHaves = Object.keys(filters.mustHaves).filter((key) => filters.mustHaves[key]);
    const activeCategories = Object.keys(filters.activityTypes).filter((key) => filters.activityTypes[key] && key !== 'add');
    const routeStopIds = new Set(routeStops.map((stop) => stop.id));
    const routeCategories = new Set(routeStops.map((stop) => stop.category));
    const timers = [
      setTimeout(() => setLoadingStep(1), 650),
      setTimeout(() => setLoadingStep(2), 1300),
      setTimeout(() => {
        const scored = destinations
          .filter((destination) => !routeStopIds.has(destination.id))
          .map((destination) => {
            let score = 0;
            if (activeCategories.includes(destination.category)) score += 5;
            if (destination.difficulty === filters.difficulty) score += 3;
            if (destination.duration === filters.hikeLength) score += 2;
            if (destination.distanceKm <= filters.distanceKm) score += 2;
            if (!routeCategories.has(destination.category)) score += 1;
            score += destination.tags.filter((tag) => selectedMustHaves.includes(tag)).length * 2;
            return { destination, score };
          })
          .sort((a, b) => b.score - a.score)
          .map(({ destination }) => destination);
        setRecommendations(scored.slice(0, 6));
        setLoadingStep(3);
      }, 1950)
    ];
    return () => timers.forEach(clearTimeout);
  }, [filters, routeStops, setRecommendations]);

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader
        title="AI Journey Suggestions"
        label={getJourneyStatus(routeStops.length)}
        onBack={() => navigation.goBack()}
        action={
          <Pressable style={styles.headerMapButton} onPress={() => navigation.navigate('EditTrip')}>
            <Text style={styles.headerMapButtonText}>Journey</Text>
          </Pressable>
        }
      />
      {loadingStep < 3 ? (
        <View style={styles.loadingCard}>
          <View style={[styles.loadingOrb, { backgroundColor: accent }]}>
            <Sparkles size={30} color="#1B2733" />
          </View>
          {loadingMessages.map((message, index) => (
            <View key={message} style={styles.loadingRow}>
              <View style={[styles.loadingCheck, index <= loadingStep && { backgroundColor: accent }]}>
                {index < loadingStep && <Check size={14} color="#1B2733" />}
              </View>
              <Text style={[styles.loadingText, index === loadingStep && styles.loadingTextActive]}>{message}</Text>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.detailScroll}>
          <View style={[styles.aiSummary, { borderColor: accent }]}>
            <Sparkles size={22} color="#2D2D2D" />
            <Text style={styles.aiSummaryText}>
              Planning around {routeStops.length} existing {routeStops.length === 1 ? 'stop' : 'stops'} and your {selectedCategories.length || 'open'} selected vibes. Every suggestion joins the same Journey.
            </Text>
          </View>
          {recommendations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              accent={accent}
              added={routeStops.some((stop) => stop.id === destination.id)}
              onOpen={() => navigation.navigate('Destination', { destinationId: destination.id })}
              onAdd={() => toggleJourneyStop(destination)}
            />
          ))}
        </ScrollView>
      )}
      {loadingStep === 3 && (
        <Pressable style={[styles.bottomAction, { backgroundColor: accent }]} onPress={() => navigation.navigate('EditTrip')}>
          <RouteIcon size={20} color="#1B2733" />
          <Text style={styles.bottomActionText}>{getJourneyStatus(routeStops.length)}</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function RouteScreen({ navigation }: RouteScreenProps) {
  const { routeStops, setRouteStops, accent } = useAppState();

  const moveStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= routeStops.length) return;
    setRouteStops((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const editStop = (index: number) => {
    const replacement = destinations.find((destination) => !routeStops.some((stop) => stop.id === destination.id));
    if (!replacement) return;
    setRouteStops((current) => current.map((stop, stopIndex) => (stopIndex === index ? replacement : stop)));
  };

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader
        title="Your Journey"
        label={getJourneyStatus(routeStops.length)}
        onBack={() => navigation.goBack()}
        action={<Text style={[styles.routeDuration, { color: accent }]}>{routeStops.length * 45} min</Text>}
      />
      <ScrollView contentContainerStyle={styles.detailScroll}>
        {routeStops.length === 0 ? (
          <View style={styles.emptyCard}>
            <RouteIcon size={32} color="#7B6E63" />
            <Text style={styles.emptyTitle}>Your Journey is waiting</Text>
            <Text style={styles.emptyText}>Add map pins or AI suggestions to build one complete experience.</Text>
          </View>
        ) : (
          routeStops.map((stop, index) => (
            <View key={stop.id} style={styles.routeStopCard}>
              <View style={[styles.stopNumber, { backgroundColor: accent }]}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <RNImage source={{ uri: stop.image }} style={styles.routeStopImage} />
              <Pressable style={styles.routeStopCopy} onPress={() => navigation.navigate('Destination', { destinationId: stop.id })}>
                <Text style={styles.routeStopTitle}>{stop.name}</Text>
                <Text style={styles.destinationMeta}>{stop.duration} · {stop.routeInfo.split('·')[0]}</Text>
                <View style={styles.routeControls}>
                  <Pressable style={styles.miniButton} onPress={() => moveStop(index, -1)}><ArrowUp size={16} color="#2D2D2D" /></Pressable>
                  <Pressable style={styles.miniButton} onPress={() => moveStop(index, 1)}><ArrowDown size={16} color="#2D2D2D" /></Pressable>
                  <Pressable style={styles.editButton} onPress={() => editStop(index)}><Text style={styles.editButtonText}>Edit</Text></Pressable>
                  <Pressable style={styles.miniButton} onPress={() => setRouteStops((current) => current.filter((item) => item.id !== stop.id))}>
                    <Trash2 size={16} color="#D3544A" />
                  </Pressable>
                </View>
              </Pressable>
              <GripVertical size={20} color="#C4B79F" />
            </View>
          ))
        )}
        <Text style={styles.routeHint}>Use the arrow controls to reorder stops. Edit swaps in the next matching local destination.</Text>
      </ScrollView>
      <View style={styles.routeBottomActions}>
        <Pressable style={styles.routeEditAction} onPress={() => navigation.navigate('EditTrip')}>
          <RouteIcon size={19} color="#625D57" />
          <Text style={styles.routeEditActionText}>Edit Trip</Text>
        </Pressable>
        <Pressable
          style={[styles.routeStartAction, { backgroundColor: routeStops.length ? accent : '#D8D1C8' }]}
          disabled={routeStops.length === 0}
          onPress={() => navigation.navigate('JourneyMode')}
        >
          <Play size={19} color="#1B2733" />
          <Text style={styles.bottomActionText}>Start Journey</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function JourneyDragHandle({
  index,
  onMove
}: {
  index: number;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy < -24) onMove(index, -1);
          if (gesture.dy > 24) onMove(index, 1);
        }
      }),
    [index, onMove]
  );

  return (
    <View style={styles.dragHandle} {...responder.panHandlers}>
      <GripVertical size={20} color="#8D806F" />
      <Text style={styles.dragHandleText}>Drag</Text>
    </View>
  );
}

function EditTripScreen({ navigation }: EditTripScreenProps) {
  const { routeStops, setRouteStops, filters, accent } = useAppState();
  const estimatedMinutes = routeStops.reduce((total, stop) => {
    const durationMinutes: Record<HikeLength, number> = {
      '30 min': 30,
      '1 hr': 60,
      '2 hr': 120,
      '3 hr': 180,
      '4 hr+': 240
    };
    return total + durationMinutes[stop.duration];
  }, 0);
  const journeyDifficulty = getJourneyDifficulty(routeStops, filters.difficulty);
  const journeyDistance = calculateJourneyDistance(routeStops);

  const moveJourneyStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= routeStops.length) return;
    setRouteStops((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const replaceJourneyStop = (index: number) => {
    const currentStop = routeStops[index];
    const replacement = destinations.find(
      (destination) =>
        destination.category === currentStop.category &&
        !routeStops.some((stop) => stop.id === destination.id)
    );
    if (!replacement) return;
    setRouteStops((current) => current.map((stop, stopIndex) => (stopIndex === index ? replacement : stop)));
  };

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader
        title="Your Journey"
        label={getJourneyStatus(routeStops.length)}
        onBack={() => navigation.goBack()}
        action={
          <Pressable style={styles.headerMapButton} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.headerMapButtonText}>Map</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.editTripScroll}>
        <View style={styles.journeySummaryCard}>
          <View style={styles.journeySummaryHeader}>
            <View>
              <Text style={styles.profileHeaderLabel}>Journey summary</Text>
              <Text style={styles.journeySummaryTitle}>{routeStops.length ? 'Ready to organize' : 'Start building your Journey'}</Text>
            </View>
            <RouteIcon size={24} color="#2D2D2D" />
          </View>
          <View style={styles.journeySummaryStats}>
            <View style={styles.journeySummaryStat}>
              <Text style={styles.journeySummaryValue}>{routeStops.length}</Text>
              <Text style={styles.journeySummaryLabel}>Stops</Text>
            </View>
            <View style={styles.journeySummaryStat}>
              <Text style={styles.journeySummaryValue}>{Math.round(estimatedMinutes / 60 * 10) / 10}h</Text>
              <Text style={styles.journeySummaryLabel}>Estimated</Text>
            </View>
            <View style={styles.journeySummaryStat}>
              <Text style={[styles.journeySummaryValue, { color: difficultyColors[journeyDifficulty] }]}>{journeyDifficulty}</Text>
              <Text style={styles.journeySummaryLabel}>Difficulty</Text>
            </View>
            <View style={styles.journeySummaryStat}>
              <Text style={styles.journeySummaryValue}>{Math.round(journeyDistance)} km</Text>
              <Text style={styles.journeySummaryLabel}>Distance</Text>
            </View>
          </View>
        </View>
        <View style={styles.journeyAddSources}>
          <Pressable style={styles.journeySourceButton} onPress={() => navigation.navigate('Map')}>
            <MapPin size={17} color="#625D57" />
            <Text style={styles.journeySourceText}>Add from Map</Text>
          </Pressable>
          <Pressable style={styles.journeySourceButton} onPress={() => navigation.navigate('Recommendations')}>
            <Sparkles size={17} color="#625D57" />
            <Text style={styles.journeySourceText}>Add with AI</Text>
          </Pressable>
        </View>
        <View style={[styles.routeStateLegend, { borderColor: accent }]}>
          <View style={[styles.mapFeedbackDot, { backgroundColor: accent }]} />
          <Text style={styles.routeStateLegendText}>Map pins and AI suggestions both update this Journey instantly.</Text>
        </View>
        {routeStops.length === 0 ? (
          <View style={styles.emptyCard}>
            <RouteIcon size={32} color="#7B6E63" />
            <Text style={styles.emptyTitle}>No stops selected</Text>
            <Text style={styles.emptyText}>Return to the map or use AI planning to add places.</Text>
          </View>
        ) : (
          routeStops.map((stop, index) => (
            <View key={stop.id} style={[styles.routeStopCard, { borderColor: accent, borderWidth: 1 }]}>
              <View style={[styles.stopNumber, { backgroundColor: accent }]}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <RNImage source={{ uri: stop.image }} style={styles.routeStopImage} />
              <View style={styles.routeStopCopy}>
                <Text style={styles.routeStopTitle}>{stop.name}</Text>
                <Text style={styles.destinationMeta}>{stop.category} · {stop.difficulty} · {stop.region}</Text>
                <View style={styles.routeControls}>
                  <Pressable style={styles.miniButton} onPress={() => moveJourneyStop(index, -1)}>
                    <ArrowUp size={16} color="#2D2D2D" />
                  </Pressable>
                  <Pressable style={styles.miniButton} onPress={() => moveJourneyStop(index, 1)}>
                    <ArrowDown size={16} color="#2D2D2D" />
                  </Pressable>
                  <Pressable style={styles.editButton} onPress={() => replaceJourneyStop(index)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.removeStopButton}
                    onPress={() => setRouteStops((current) => current.filter((item) => item.id !== stop.id))}
                  >
                    <Trash2 size={15} color="#D3544A" />
                    <Text style={styles.removeStopText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
              <JourneyDragHandle index={index} onMove={moveJourneyStop} />
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.editTripActions}>
        <Pressable style={styles.editTripMapAction} onPress={() => navigation.navigate('Map')}>
          <MapPin size={19} color="#625D57" />
          <Text style={styles.editTripMapActionText}>Add More Stops</Text>
        </Pressable>
        <Pressable
          style={[styles.editTripSaveAction, { backgroundColor: routeStops.length ? accent : '#D8D1C8' }]}
          disabled={routeStops.length === 0}
          onPress={() => navigation.navigate('JourneyMode')}
        >
          <Play size={19} color="#1B2733" />
          <Text style={styles.bottomActionText}>START JOURNEY</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function JourneyModeScreen({ navigation }: JourneyModeScreenProps) {
  const { routeStops, accent } = useAppState();
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const currentStop = routeStops[currentStopIndex];
  const nextStop = routeStops[currentStopIndex + 1];
  const progress = routeStops.length ? ((currentStopIndex + 1) / routeStops.length) * 100 : 0;

  if (!currentStop) {
    return (
      <SafeAreaView style={styles.detailScreen}>
        <ScreenHeader title="Journey Mode" label="No Journey selected" onBack={() => navigation.goBack()} />
        <View style={styles.emptyCard}>
          <RouteIcon size={32} color="#7B6E63" />
          <Text style={styles.emptyTitle}>Add stops before starting</Text>
          <Text style={styles.emptyText}>Add map pins or AI suggestions to your Journey first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader title="Journey Mode" label={`Stop ${currentStopIndex + 1} of ${routeStops.length}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.journeyModeScroll}>
        <View style={styles.journeyProgressTrack}>
          <View style={[styles.journeyProgressFill, { width: `${progress}%`, backgroundColor: accent }]} />
        </View>
        <Text style={styles.journeyProgressLabel}>{Math.round(progress)}% of your Journey</Text>
        <View style={[styles.journeyNowNext, { borderColor: accent }]}>
          <View style={styles.journeyNowNextItem}>
            <Text style={styles.journeyNowNextLabel}>CURRENT</Text>
            <Text style={styles.journeyNowNextValue}>{currentStop.name}</Text>
          </View>
          <View style={styles.journeyNowNextDivider} />
          <View style={styles.journeyNowNextItem}>
            <Text style={styles.journeyNowNextLabel}>NEXT</Text>
            <Text style={styles.journeyNowNextValue}>{nextStop?.name || 'Finish Journey'}</Text>
          </View>
        </View>

        <View style={[styles.currentStopCard, { borderColor: accent }]}>
          <RNImage source={{ uri: currentStop.image }} style={styles.currentStopImage} />
          <View style={styles.currentStopBody}>
            <View style={[styles.currentStopBadge, { backgroundColor: accent }]}>
              <MapPin size={15} color="#1B2733" />
              <Text style={styles.currentStopBadgeText}>Current Stop</Text>
            </View>
            <Text style={styles.currentStopTitle}>{currentStop.name}</Text>
            <Text style={styles.currentStopMeta}>
              {currentStop.category} · {currentStop.difficulty} · {currentStop.region}
            </Text>
            <Text style={styles.currentStopDescription}>{currentStop.description}</Text>
            <Text style={styles.currentStopRoute}>{currentStop.routeInfo}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Your journey</Text>
        {routeStops.map((stop, index) => {
          const completed = index < currentStopIndex;
          const active = index === currentStopIndex;
          return (
            <Pressable
              key={stop.id}
              style={[styles.journeyStopRow, active && { borderColor: accent, borderWidth: 2 }]}
              onPress={() => setCurrentStopIndex(index)}
            >
              <View style={[styles.journeyStopNumber, completed && { backgroundColor: '#67A66A' }, active && { backgroundColor: accent }]}>
                {completed ? <Check size={15} color="#FFFFFF" /> : <Text style={styles.stopNumberText}>{index + 1}</Text>}
              </View>
              <View style={styles.journeyStopCopy}>
                <Text style={styles.journeyStopTitle}>{stop.name}</Text>
                <Text style={styles.destinationMeta}>{index + 1 === currentStopIndex + 1 ? 'Current stop' : completed ? 'Completed' : 'Coming up'}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.journeyModeActions}>
        <Pressable
          style={[styles.journeyNavButton, currentStopIndex === 0 && styles.journeyNavButtonDisabled]}
          disabled={currentStopIndex === 0}
          onPress={() => setCurrentStopIndex((index) => Math.max(0, index - 1))}
        >
          <ChevronLeft size={19} color="#625D57" />
          <Text style={styles.journeyNavText}>Previous Stop</Text>
        </Pressable>
        {currentStopIndex < routeStops.length - 1 ? (
          <Pressable
            style={[styles.journeyNextButton, { backgroundColor: accent }]}
            onPress={() => setCurrentStopIndex((index) => Math.min(routeStops.length - 1, index + 1))}
          >
            <Text style={styles.bottomActionText}>Next Stop</Text>
            <ChevronLeft size={19} color="#1B2733" style={{ transform: [{ rotate: '180deg' }] }} />
          </Pressable>
        ) : (
          <Pressable style={[styles.journeyNextButton, { backgroundColor: accent }]} onPress={() => navigation.replace('JourneyComplete')}>
            <Flag size={19} color="#1B2733" />
            <Text style={styles.bottomActionText}>Finish Journey</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function JourneyCompleteScreen({ navigation }: JourneyCompleteScreenProps) {
  const {
    routeStops,
    filters,
    selectedCategory,
    selectedCategories,
    accent,
    setMemories,
    setRouteStops,
    setRecommendations
  } = useAppState();
  const [saved, setSaved] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const categoryLabels = selectedCategories.map(
    (key) => activityIcons.find((item) => item.key === key)?.label || key
  );
  const vibeLabel = categoryLabels.length ? categoryLabels.join(' + ') : selectedCategory;
  const tripTitle = `${categoryLabels[0] || selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Day Journey`;
  const journeyDifficulty = getJourneyDifficulty(routeStops, filters.difficulty);
  const mockPhotos = useMemo(
    () => [
      ...routeStops.slice(0, 3).map((stop) => stop.image),
      'https://picsum.photos/800/620?random=151',
      'https://picsum.photos/800/620?random=152',
      'https://picsum.photos/800/620?random=153'
    ].filter((photo, index, photos) => photos.indexOf(photo) === index),
    [routeStops]
  );

  const togglePhoto = (photo: string) => {
    if (saved) return;
    setSelectedPhotos((current) =>
      current.includes(photo) ? current.filter((item) => item !== photo) : [...current, photo]
    );
  };

  const saveMemory = () => {
    if (saved || routeStops.length === 0) return;
    const memory: Memory = {
      id: `journey-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      note: `Completed a ${routeStops.length}-stop ${vibeLabel} journey with Trippin.`,
      image: selectedPhotos[0] || routeStops[0].image,
      photos: selectedPhotos.length ? selectedPhotos : [routeStops[0].image],
      tripTitle,
      vibe: vibeLabel,
      categories: selectedCategories,
      stopCount: routeStops.length,
      difficulty: journeyDifficulty
    };
    setMemories((current) => [memory, ...current]);
    setSaved(true);
  };

  const backToMap = () => {
    setRouteStops([]);
    setRecommendations([]);
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  return (
    <SafeAreaView style={styles.completionScreen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.completionContent}>
        <View style={[styles.completionIcon, { backgroundColor: accent }]}>
          <Flag size={34} color="#1B2733" />
        </View>
        <Text style={styles.completionEyebrow}>Journey complete</Text>
        <Text style={styles.completionTitle}>You made a memory.</Text>
        <View style={styles.completionMemoryCard}>
          {routeStops[0] && <RNImage source={{ uri: routeStops[0].image }} style={styles.completionImage} />}
          <View style={styles.completionCardBody}>
            <Text style={styles.completionTripTitle}>{tripTitle}</Text>
            <Text style={styles.completionTripMeta}>{vibeLabel}</Text>
            <View style={styles.completionStats}>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{routeStops.length}</Text>
                <Text style={styles.completionStatLabel}>Stops</Text>
              </View>
              <View style={styles.completionStat}>
                <Text style={[styles.completionStatValue, { color: difficultyColors[journeyDifficulty] }]}>
                  {journeyDifficulty}
                </Text>
                <Text style={styles.completionStatLabel}>Difficulty</Text>
              </View>
            </View>
          </View>
        </View>
        <Pressable
          style={[styles.addPhotosButton, { borderColor: accent }]}
          onPress={() => setShowPhotoPicker((current) => !current)}
        >
          <LucideImage size={19} color="#625D57" />
          <Text style={styles.addPhotosText}>
            {selectedPhotos.length ? `${selectedPhotos.length} Photos Added` : 'Add Photos'}
          </Text>
          <ChevronLeft
            size={18}
            color="#625D57"
            style={{ transform: [{ rotate: showPhotoPicker ? '90deg' : '-90deg' }] }}
          />
        </Pressable>
        {showPhotoPicker && (
          <View style={styles.photoPickerCard}>
            <Text style={styles.photoPickerTitle}>Choose mock journey photos</Text>
            <Text style={styles.photoPickerDescription}>Tap photos to attach them to this memory.</Text>
            <View style={styles.photoPickerGrid}>
              {mockPhotos.map((photo) => {
                const selected = selectedPhotos.includes(photo);
                return (
                  <Pressable key={photo} style={styles.photoPickerItem} onPress={() => togglePhoto(photo)}>
                    <RNImage source={{ uri: photo }} style={styles.photoPickerImage} />
                    {selected && (
                      <View style={[styles.photoSelectedBadge, { backgroundColor: accent }]}>
                        <Check size={15} color="#1B2733" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        {saved && (
          <View style={styles.memorySavedNotice}>
            <Check size={17} color="#67A66A" />
            <Text style={styles.memorySavedText}>Memory saved to your profile</Text>
          </View>
        )}
        <Pressable style={styles.planSimilarInline} onPress={() => navigation.replace('Recommendations')}>
          <RotateCcw size={17} color="#625D57" />
          <Text style={styles.planSimilarInlineText}>Plan Similar Trip</Text>
        </Pressable>
      </ScrollView>
      <View style={styles.completionActions}>
        <Pressable
          style={[styles.completionSecondaryAction, saved && styles.journeyNavButtonDisabled]}
          disabled={saved}
          onPress={saveMemory}
        >
          <LucideImage size={19} color="#625D57" />
          <Text style={styles.routeEditActionText}>{saved ? 'Memory Saved' : 'Save Memory'}</Text>
        </Pressable>
        <Pressable style={[styles.completionPrimaryAction, { backgroundColor: accent }]} onPress={backToMap}>
          <MapPin size={19} color="#1B2733" />
          <Text style={styles.bottomActionText}>Back to Map</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DestinationScreen({ navigation, route }: DestinationScreenProps) {
  const { savedIds, toggleSaved, routeStops, toggleJourneyStop, accent } = useAppState();
  const destination = destinations.find((item) => item.id === route.params.destinationId);
  if (!destination) return null;
  const saved = savedIds.includes(destination.id);
  const added = routeStops.some((stop) => stop.id === destination.id);

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader
        title={destination.name}
        label={getJourneyStatus(routeStops.length)}
        onBack={() => navigation.goBack()}
        action={
          <Pressable style={styles.backButton} onPress={() => toggleSaved(destination.id)}>
            <Heart size={22} color={saved ? '#D3544A' : '#2D2D2D'} fill={saved ? '#D3544A' : 'transparent'} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.destinationScroll}>
        <RNImage source={{ uri: destination.image }} style={styles.destinationHero} />
        <View style={styles.destinationDetailCard}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#7B6E63" />
            <Text style={styles.infoText}>{destination.distanceKm} km from you</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color="#7B6E63" />
            <Text style={styles.infoText}>{destination.hours}</Text>
          </View>
          <Text style={styles.detailDescription}>{destination.description}</Text>
          <Text style={styles.sectionLabel}>Route information</Text>
          <Text style={styles.infoText}>{destination.routeInfo}</Text>
          <View style={styles.tagRow}>
            {[destination.category, destination.difficulty, ...destination.tags].map((tag) => (
              <View key={tag} style={[styles.smallTag, { borderColor: accent }]}>
                <Text style={styles.smallTagText}>{tag.replace(/([A-Z])/g, ' $1')}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <Pressable
        style={[styles.bottomAction, { backgroundColor: added ? '#E8E1D7' : accent }]}
        onPress={() => toggleJourneyStop(destination)}
      >
        {added ? <Trash2 size={20} color="#1B2733" /> : <Plus size={20} color="#1B2733" />}
        <Text style={styles.bottomActionText}>{added ? 'Remove from Journey' : 'Add to Journey'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function MemoryScreen({ navigation, route }: MemoryScreenProps) {
  const { memories, accent } = useAppState();
  const memory = memories.find((item) => item.id === route.params.memoryId);
  const destination = destinations.find((item) => item.id === memory?.destinationId);
  if (!memory) return null;

  return (
    <SafeAreaView style={styles.detailScreen}>
      <ScreenHeader title={memory.tripTitle || destination?.name || 'Trip Memory'} label={memory.date} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.destinationScroll}>
        <RNImage source={{ uri: memory.image }} style={styles.memoryHero} />
        {memory.photos && memory.photos.length > 1 && (
          <View style={styles.memoryPhotoSection}>
            <Text style={styles.sectionLabel}>Journey photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {memory.photos.map((photo, index) => (
                <RNImage key={`${photo}-${index}`} source={{ uri: photo }} style={styles.memoryGalleryPhoto} />
              ))}
            </ScrollView>
          </View>
        )}
        <View style={[styles.destinationDetailCard, { borderTopColor: accent, borderTopWidth: 4 }]}>
          <Text style={styles.memoryQuote}>“{memory.note}”</Text>
          <Text style={styles.sectionLabel}>Trip details</Text>
          {destination ? (
            <>
              <Text style={styles.infoText}>{destination.routeInfo}</Text>
              <Pressable style={[styles.inlineAction, { backgroundColor: accent }]} onPress={() => navigation.navigate('Destination', { destinationId: destination.id })}>
                <Text style={styles.inlineActionText}>View destination</Text>
                <MapPin size={18} color="#1B2733" />
              </Pressable>
            </>
          ) : (
            <View style={styles.completionStats}>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{memory.stopCount}</Text>
                <Text style={styles.completionStatLabel}>Stops</Text>
              </View>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{memory.vibe}</Text>
                <Text style={styles.completionStatLabel}>Vibe</Text>
              </View>
              <View style={styles.completionStat}>
                <Text style={styles.completionStatValue}>{memory.difficulty}</Text>
                <Text style={styles.completionStatLabel}>Difficulty</Text>
              </View>
            </View>
          )}
          <Pressable style={styles.memoryMapAction} onPress={() => navigation.navigate('Map')}>
            <MapPin size={18} color="#625D57" />
            <Text style={styles.memoryMapActionText}>Back to Map</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { memories, savedIds, selectedCategory, routeStops, accent } = useAppState();
  const highlightTags = ['Water hikes', 'Pet friendly', 'City cafés', 'Sunset views'];

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container}>
        <View style={styles.mapBackground} />
        {isWebPlatform && <WebMap center={[32.0868, 34.8090]} />}
        <View style={styles.profileBackdrop} />

        <View style={styles.profileTopOverlay} pointerEvents="box-none">
          <View style={styles.profileTopBar}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <ChevronLeft size={22} color="#2D2D2D" />
            </Pressable>
            <View>
              <Text style={styles.profileHeaderLabel}>Profile</Text>
              <Text style={styles.profileHeaderTitle}>Your travel story</Text>
            </View>
            <View style={{ width: 48 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.profileScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatarWrapper}>
              <RNImage source={{ uri: 'https://i.pravatar.cc/150?img=47' }} style={styles.profileAvatar} />
            </View>
            <Text style={styles.profileName}>Sarah Cohen</Text>
            <Text style={styles.profileSubtitle}>Based in Jerusalem</Text>

            <View style={styles.profileBadgeRow}>
              {highlightTags.map((tag) => (
                <View key={tag} style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatTile}>
                <Text style={styles.profileStatNumber}>{memories.length}</Text>
                <Text style={styles.profileStatLabel}>Trips</Text>
              </View>
              <View style={styles.profileStatTile}>
                <Text style={styles.profileStatNumber}>{savedIds.length}</Text>
                <Text style={styles.profileStatLabel}>Saved</Text>
              </View>
              <View style={styles.profileStatTile}>
                <Text style={[styles.profileStatNumber, { color: accent }]}>{selectedCategory}</Text>
                <Text style={styles.profileStatLabel}>Vibe</Text>
              </View>
            </View>
          </View>

          <View style={styles.profileSectionCard}>
            <View style={styles.profileSectionHeader}>
              <Text style={styles.profileSectionTitle}>Based on Your Trips</Text>
              <Sparkles size={22} color="#2D2D2D" />
            </View>
            <Text style={styles.profileSectionText}>
              Sarah loves water hikes, especially waterfalls and lakes in northern Israel, and averages about one hike a week.
            </Text>
          </View>

          <View style={styles.profileSectionCard}>
            <View style={styles.profileSectionHeader}>
              <Text style={styles.profileSectionTitle}>Recent Trip Memories</Text>
              <LucideImage size={22} color="#2D2D2D" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilePhotosRow}>
              {memories.map((memory) => (
                <Pressable key={memory.id} onPress={() => navigation.navigate('Memory', { memoryId: memory.id })}>
                  <RNImage source={{ uri: memory.image }} style={styles.profilePhoto} />
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.profileSectionCard}>
            <View style={styles.profileSectionHeader}>
              <View>
                <Text style={styles.profileSectionTitle}>Current Journey</Text>
                <Text style={styles.destinationMeta}>{getJourneyStatus(routeStops.length)}</Text>
              </View>
              <RouteIcon size={22} color="#2D2D2D" />
            </View>
            <Pressable style={[styles.inlineAction, { backgroundColor: accent }]} onPress={() => navigation.navigate('EditTrip')}>
              <Text style={styles.inlineActionText}>Open Journey Hub</Text>
              <ChevronLeft size={18} color="#1B2733" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>

          <View style={styles.profileSectionCard}>
            <View style={styles.profileSectionHeader}>
              <Text style={styles.profileSectionTitle}>Help & Information</Text>
              <CircleQuestionMark size={22} color="#2D2D2D" />
            </View>
            <Pressable style={styles.helpMenuRow} onPress={() => navigation.navigate('Instructions')}>
              <BookOpen size={20} color="#625D57" />
              <Text style={styles.helpMenuText}>How to Use Trippin</Text>
              <ChevronLeft size={18} color="#9A938B" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            <Pressable style={styles.helpMenuRow} onPress={() => navigation.navigate('About')}>
              <Info size={20} color="#625D57" />
              <Text style={styles.helpMenuText}>About the Project</Text>
              <ChevronLeft size={18} color="#9A938B" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
            <Pressable style={styles.helpMenuRow} onPress={() => navigation.navigate('Map')}>
              <MapPin size={20} color="#625D57" />
              <Text style={styles.helpMenuText}>Return to Main Map</Text>
              <ChevronLeft size={18} color="#9A938B" style={{ transform: [{ rotate: '180deg' }] }} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const { width: viewportWidth } = useWindowDimensions();
  const showDesktopPhoneFrame = isWebPlatform && viewportWidth > 520;
  const [filters, setFilters] = useState<FilterState>({
    activityTypes: {
      nature: false,
      water: true,
      mountain: false,
      add: false,
      cafe: false,
      family: false,
      city: false,
      bar: false
    },
    difficulty: 'Medium',
    distanceKm: 100,
    hikeLength: '2 hr',
    mustHaves: {
      accessible: false,
      freeEntry: false,
      dogFriendly: false,
      kidFriendly: false,
      publicTransit: false,
      campsite: false,
      picnic: false
    }
  });
  const [recommendations, setRecommendations] = useState<Destination[]>([]);
  const [routeStops, setRouteStops] = useState<Destination[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>(['banias', 'jaffa']);
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const selectedCategories = Object.keys(filters.activityTypes).filter(
    (key) => filters.activityTypes[key] && key !== 'add'
  );
  const selectedCategory = selectedCategories[0] || 'city';
  const accent = vibeAccents[selectedCategory] || vibeAccents.city;
  const addToJourney = (destination: Destination) =>
    setRouteStops((current) =>
      current.some((stop) => stop.id === destination.id) ? current : [...current, destination]
    );
  const removeFromJourney = (destinationId: string) =>
    setRouteStops((current) => current.filter((stop) => stop.id !== destinationId));
  const toggleJourneyStop = (destination: Destination) =>
    setRouteStops((current) =>
      current.some((stop) => stop.id === destination.id)
        ? current.filter((stop) => stop.id !== destination.id)
        : [...current, destination]
    );

  const stateValue = useMemo<AppStateValue>(
    () => ({
      filters,
      setFilters,
      recommendations,
      setRecommendations,
      routeStops,
      setRouteStops,
      addToJourney,
      removeFromJourney,
      toggleJourneyStop,
      savedIds,
      toggleSaved: (id) =>
        setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
      memories,
      setMemories,
      selectedCategory,
      selectedCategories,
      accent
    }),
    [filters, recommendations, routeStops, savedIds, memories, selectedCategory, selectedCategories, accent]
  );

  return (
    <AppStateContext.Provider value={stateValue}>
      <View style={[styles.appViewport, showDesktopPhoneFrame && styles.appViewportDesktop]}>
        <View style={[styles.appPhone, showDesktopPhoneFrame && styles.appPhoneDesktop]}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right'
              }}
            >
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Instructions" component={InstructionsScreen} />
              <Stack.Screen name="About" component={AboutScreen} />
              <Stack.Screen name="Map" component={MapScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
              <Stack.Screen name="Route" component={RouteScreen} />
              <Stack.Screen name="EditTrip" component={EditTripScreen} />
              <Stack.Screen name="JourneyMode" component={JourneyModeScreen} />
              <Stack.Screen name="JourneyComplete" component={JourneyCompleteScreen} />
              <Stack.Screen name="Destination" component={DestinationScreen} />
              <Stack.Screen name="Memory" component={MemoryScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      </View>
    </AppStateContext.Provider>
  );
}

const styles = StyleSheet.create({
  appViewport: {
    flex: 1,
    width: '100%'
  },
  appViewportDesktop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#E8E1D8'
  },
  appPhone: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5EFE6'
  },
  appPhoneDesktop: {
    maxWidth: 420,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45, 45, 45, 0.16)',
    shadowColor: '#2D2D2D',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12
  },
  root: {
    flex: 1,
    backgroundColor: '#F5EFE6'
  },
  container: {
    flex: 1
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E7F1FB'
  },
  sheetBackground: {
    backgroundColor: '#F5EFE6',
    borderRadius: 24
  },
  webSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F5EFE6',
    paddingTop: 10,
    // Soft shadow above the sheet
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 6,
    overflow: 'hidden'
  },
  handleBar: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center'
  },
  handleLine: {
    width: 60,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#C4B79F'
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  planButton: {
    marginTop: 6,
    backgroundColor: '#B8E1FF',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center'
  },
  planButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  planButtonText: {
    color: '#1B2733',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8
  },
  statusOverlay: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5
  },
  mapWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0
  },
  mapContainer: {
    width: '100%',
    height: '100%'
  },
  mapFeedback: {
    position: 'absolute',
    top: 132,
    left: 18,
    maxWidth: '72%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  mapFeedbackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  mapFeedbackText: {
    flexShrink: 1,
    color: '#4C4C4C',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  editTripMapPill: {
    position: 'absolute',
    top: 174,
    right: 18,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 7,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5
  },
  editTripMapPillText: {
    color: '#1B2733',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 6
  },
  mapPreviewCard: {
    position: 'absolute',
    left: 16,
    right: 76,
    bottom: 194,
    minHeight: 142,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    zIndex: 8,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9
  },
  mapPreviewImage: {
    width: 92,
    minHeight: 122,
    borderRadius: 18
  },
  mapPreviewBody: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 3
  },
  mapPreviewTitle: {
    flex: 1,
    color: '#1B2733',
    fontSize: 15,
    fontWeight: '800',
    marginRight: 6
  },
  difficultyBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4
  },
  difficultyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800'
  },
  mapPreviewMeta: {
    color: '#7B6E63',
    fontSize: 10,
    marginTop: 4,
    textTransform: 'capitalize'
  },
  mapPreviewDescription: {
    color: '#4C4C4C',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6
  },
  mapPreviewActions: {
    flexDirection: 'row',
    marginTop: 9
  },
  previewSecondaryButton: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7
  },
  previewSecondaryText: {
    color: '#625D57',
    fontSize: 10,
    fontWeight: '800'
  },
  previewPrimaryButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewPrimaryText: {
    color: '#1B2733',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B2733',
    marginBottom: 6
  },
  headerSubtitle: {
    color: '#4C4C4C',
    fontSize: 14,
    marginBottom: 4
  },
  headerHint: {
    color: '#7B6E63',
    fontSize: 12
  },
  overlayContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
    paddingHorizontal: 16,
    pointerEvents: 'box-none'
  },
  logoBadgeWrapper: {
    marginTop: 8,
    alignItems: 'center'
  },
  logoBadge: {
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  logoText: {
    fontSize: 22,
    color: '#1B2733',
    fontWeight: '700',
    fontFamily: 'Rye, serif'
  },
  searchWrapper: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center'
  },
  searchBar: {
    width: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    color: '#1B2733'
  },
  rightButtonsContainer: {
    position: 'absolute',
    right: 12,
    top: '28%',
    zIndex: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  circleButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  circleIcon: {
    fontSize: 18
  },
  section: {
    marginTop: 24
  },
  sectionLabel: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2733'
  },
  flowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  activityButton: {
    width: '23%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C4B79F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
  },
  activityLabel: {
    marginTop: 3,
    color: '#1B2733',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center'
  },
  activityCheck: {
    position: 'absolute',
    top: 7,
    right: 7
  },
  activityIcon: {
    fontSize: 20,
    color: '#1B2733'
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    overflow: 'hidden'
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1E8'
  },
  segmentButtonSelected: {
    backgroundColor: '#D6C4A8'
  },
  segmentText: {
    color: '#66615C',
    fontWeight: '600'
  },
  segmentTextSelected: {
    color: '#1B2733'
  },
  difficultySelectedText: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  slider: {
    width: '100%'
  },
  sliderValue: {
    marginTop: 10,
    color: '#1B2733',
    fontWeight: '600'
  },
  locationText: {
    marginTop: 8,
    color: '#7B6E63',
    fontSize: 12
  },
  lengthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  lengthButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#F5EFE6',
    marginRight: 10,
    marginBottom: 10
  },
  lengthButtonSelected: {
    backgroundColor: '#E3D8C0'
  },
  lengthText: {
    color: '#7B6E63'
  },
  lengthTextSelected: {
    color: '#1B2733',
    fontWeight: '700'
  },
  mustHaveButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FAF6F0',
    marginBottom: 12
  },
  mustHaveText: {
    color: '#7B6E63',
    fontWeight: '600'
  },
  profileTopOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 6,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  profileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E0D8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  },
  backButtonText: {
    fontSize: 24,
    color: '#1B2733'
  },
  profileScroll: {
    paddingTop: 140,
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  profileAvatarWrapper: {
    position: 'absolute',
    top: -50,
    left: '50%',
    marginLeft: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  profileAvatar: {
    width: '100%',
    height: '100%'
  },
  profileName: {
    marginTop: 60,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: '#1B2733'
  },
  profileSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#7B6E63',
    fontSize: 14
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  profileStatTile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4
  },
  profileStatNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B2733'
  },
  profileStatLabel: {
    marginTop: 6,
    color: '#7B6E63',
    fontSize: 12
  },
  profileSection: {
    marginTop: 24
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2733'
  },
  profileSectionEmoji: {
    fontSize: 18
  },
  profileSectionText: {
    marginTop: 12,
    color: '#7B6E63',
    lineHeight: 20,
    fontSize: 14
  },
  profilePhotosRow: {
    marginTop: 16
  },
  profilePhoto: {
    width: 120,
    height: 150,
    borderRadius: 20,
    marginRight: 12
  },
  profileBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 239, 230, 0.7)'
  },
  profileHeaderLabel: {
    color: '#7B6E63',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  profileHeaderTitle: {
    color: '#1B2733',
    fontSize: 20,
    fontWeight: '800'
  },
  profileBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16
  },
  profileBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0D8',
    marginHorizontal: 4,
    marginBottom: 8
  },
  profileBadgeText: {
    fontSize: 12,
    color: '#7B6E63',
    fontWeight: '700'
  },
  profileSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  detailScreen: {
    flex: 1,
    backgroundColor: '#F5EFE6'
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#F5EFE6',
    zIndex: 3
  },
  detailHeaderCopy: {
    flex: 1,
    marginHorizontal: 14
  },
  headerAction: {
    width: 48,
    alignItems: 'flex-end'
  },
  detailScroll: {
    paddingHorizontal: 16,
    paddingBottom: 110
  },
  loadingCard: {
    margin: 20,
    padding: 26,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  loadingOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 9
  },
  loadingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  loadingText: {
    color: '#9A938B',
    fontSize: 15,
    fontWeight: '600'
  },
  loadingTextActive: {
    color: '#1B2733'
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FAF6F0'
  },
  aiSummaryText: {
    flex: 1,
    marginLeft: 12,
    color: '#4C4C4C',
    lineHeight: 20
  },
  destinationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5
  },
  destinationCardImage: {
    width: '100%',
    height: 170
  },
  destinationCardBody: {
    padding: 18
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  destinationCardTitle: {
    flex: 1,
    color: '#1B2733',
    fontSize: 18,
    fontWeight: '800'
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 10
  },
  destinationMeta: {
    marginTop: 7,
    color: '#7B6E63',
    fontSize: 13
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14
  },
  smallTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 7,
    marginBottom: 7,
    backgroundColor: '#FAF6F0'
  },
  smallTagText: {
    color: '#625D57',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  inlineAction: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inlineActionText: {
    color: '#1B2733',
    fontWeight: '800'
  },
  recommendationActions: {
    flexDirection: 'row',
    marginTop: 12
  },
  recommendationDetailsButton: {
    flex: 0.8,
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  recommendationJourneyButton: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  recommendationJourneyText: {
    color: '#1B2733',
    fontSize: 12,
    fontWeight: '800'
  },
  bottomAction: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    minHeight: 58,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8
  },
  bottomActionText: {
    color: '#1B2733',
    fontWeight: '800',
    marginLeft: 9
  },
  routeDuration: {
    fontSize: 13,
    fontWeight: '800'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    marginTop: 20
  },
  emptyTitle: {
    marginTop: 16,
    color: '#1B2733',
    fontSize: 18,
    fontWeight: '800'
  },
  emptyText: {
    marginTop: 8,
    color: '#7B6E63',
    textAlign: 'center'
  },
  routeStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 14
  },
  stopNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  stopNumberText: {
    color: '#1B2733',
    fontWeight: '800'
  },
  routeStopImage: {
    width: 72,
    height: 82,
    borderRadius: 18
  },
  routeStopCopy: {
    flex: 1,
    marginHorizontal: 12
  },
  routeStopTitle: {
    color: '#1B2733',
    fontSize: 15,
    fontWeight: '800'
  },
  routeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10
  },
  dragHandle: {
    width: 38,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dragHandleText: {
    marginTop: 2,
    color: '#8D806F',
    fontSize: 8,
    fontWeight: '800'
  },
  miniButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  editButton: {
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6E0D8',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 6
  },
  editButtonText: {
    color: '#625D57',
    fontSize: 12,
    fontWeight: '700'
  },
  routeHint: {
    color: '#8B8177',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 6
  },
  headerMapButton: {
    minWidth: 48,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerMapButtonText: {
    color: '#625D57',
    fontSize: 12,
    fontWeight: '800'
  },
  editTripScroll: {
    paddingHorizontal: 16,
    paddingBottom: 120
  },
  journeySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5
  },
  journeySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  journeySummaryTitle: {
    color: '#1B2733',
    fontSize: 17,
    fontWeight: '800'
  },
  journeySummaryStats: {
    flexDirection: 'row',
    marginTop: 20
  },
  journeySummaryStat: {
    flex: 1,
    alignItems: 'center'
  },
  journeySummaryValue: {
    color: '#1B2733',
    fontSize: 19,
    fontWeight: '800'
  },
  journeySummaryLabel: {
    marginTop: 5,
    color: '#7B6E63',
    fontSize: 11
  },
  journeyAddSources: {
    flexDirection: 'row',
    marginBottom: 14
  },
  journeySourceButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4
  },
  journeySourceText: {
    marginLeft: 6,
    color: '#625D57',
    fontSize: 12,
    fontWeight: '800'
  },
  routeStateLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16
  },
  routeStateLegendText: {
    flex: 1,
    color: '#625D57',
    fontSize: 12,
    fontWeight: '700'
  },
  removeStopButton: {
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6C7C3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginRight: 6
  },
  removeStopText: {
    color: '#D3544A',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4
  },
  editTripActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row'
  },
  editTripMapAction: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  editTripMapActionText: {
    color: '#625D57',
    fontWeight: '800',
    marginLeft: 7
  },
  editTripSaveAction: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  destinationScroll: {
    paddingBottom: 110
  },
  destinationHero: {
    width: '100%',
    height: 260
  },
  memoryHero: {
    width: '100%',
    height: 360
  },
  memoryPhotoSection: {
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 30
  },
  memoryGalleryPhoto: {
    width: 132,
    height: 104,
    borderRadius: 18,
    marginRight: 10
  },
  memoryMapAction: {
    alignSelf: 'flex-start',
    marginTop: 24,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  memoryMapActionText: {
    marginLeft: 7,
    color: '#625D57',
    fontWeight: '800'
  },
  destinationDetailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    padding: 24,
    minHeight: 330
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    color: '#625D57',
    lineHeight: 20,
    marginLeft: 10
  },
  detailDescription: {
    color: '#4C4C4C',
    fontSize: 15,
    lineHeight: 23,
    marginVertical: 14
  },
  memoryQuote: {
    color: '#1B2733',
    fontSize: 20,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 28
  },
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#F5EFE6',
    paddingHorizontal: 24
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomeLogoCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#FFF7E8',
    borderWidth: 2,
    borderColor: '#2D2D2D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  welcomeLogoText: {
    marginTop: 12,
    color: '#2D2D2D',
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Rye, serif'
  },
  welcomeLogoSince: {
    marginTop: 7,
    color: '#4C4C4C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 5
  },
  welcomeTitle: {
    marginTop: 34,
    color: '#1B2733',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center'
  },
  welcomeSubtitle: {
    marginTop: 12,
    maxWidth: 360,
    color: '#7B6E63',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  welcomeActions: {
    paddingBottom: 26
  },
  welcomeSecondaryButton: {
    minHeight: 54,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  welcomeSecondaryText: {
    color: '#625D57',
    fontWeight: '800',
    marginLeft: 8
  },
  welcomePrimaryButton: {
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: '#B8E1FF',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7
  },
  welcomePrimaryText: {
    color: '#1B2733',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8
  },
  instructionsCard: {
    marginHorizontal: 18,
    marginTop: 20,
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5
  },
  instructionsDescription: {
    color: '#625D57',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10
  },
  instructionNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#B8E1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  instructionNumberText: {
    color: '#1B2733',
    fontWeight: '800'
  },
  instructionText: {
    flex: 1,
    color: '#4C4C4C',
    fontSize: 15,
    lineHeight: 21
  },
  welcomePrimaryButtonFloating: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: '#B8E1FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  instructionsActions: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 20,
    flexDirection: 'row'
  },
  instructionsBackButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  instructionsStartButton: {
    flex: 1.15,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: '#B8E1FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  aboutScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110
  },
  aboutLead: {
    color: '#4C4C4C',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24
  },
  aboutListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  aboutBullet: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B8E1FF',
    marginRight: 11
  },
  aboutListText: {
    color: '#625D57',
    fontSize: 14,
    fontWeight: '700'
  },
  aboutTeamName: {
    color: '#4C4C4C',
    fontSize: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE2'
  },
  helpMenuRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE2'
  },
  helpMenuText: {
    flex: 1,
    color: '#4C4C4C',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12
  },
  routeBottomActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row'
  },
  routeEditAction: {
    flex: 1,
    minHeight: 58,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  routeEditActionText: {
    color: '#625D57',
    fontWeight: '800',
    marginLeft: 7
  },
  routeStartAction: {
    flex: 1.25,
    minHeight: 58,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  journeyModeScroll: {
    paddingHorizontal: 16,
    paddingBottom: 120
  },
  journeyProgressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#E7E0D7',
    overflow: 'hidden',
    marginTop: 8
  },
  journeyProgressFill: {
    height: '100%',
    borderRadius: 999
  },
  journeyProgressLabel: {
    marginTop: 8,
    marginBottom: 18,
    color: '#7B6E63',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right'
  },
  journeyNowNext: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16
  },
  journeyNowNextItem: {
    flex: 1
  },
  journeyNowNextLabel: {
    color: '#8D806F',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  journeyNowNextValue: {
    marginTop: 4,
    color: '#1B2733',
    fontSize: 12,
    fontWeight: '800'
  },
  journeyNowNextDivider: {
    width: 1,
    backgroundColor: '#E7E0D7',
    marginHorizontal: 12
  },
  currentStopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  currentStopImage: {
    width: '100%',
    height: 210
  },
  currentStopBody: {
    padding: 20
  },
  currentStopBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center'
  },
  currentStopBadgeText: {
    marginLeft: 5,
    color: '#1B2733',
    fontSize: 11,
    fontWeight: '800'
  },
  currentStopTitle: {
    marginTop: 14,
    color: '#1B2733',
    fontSize: 23,
    fontWeight: '800'
  },
  currentStopMeta: {
    marginTop: 7,
    color: '#7B6E63',
    fontSize: 13,
    textTransform: 'capitalize'
  },
  currentStopDescription: {
    marginTop: 14,
    color: '#4C4C4C',
    fontSize: 14,
    lineHeight: 21
  },
  currentStopRoute: {
    marginTop: 14,
    color: '#625D57',
    fontSize: 12,
    fontWeight: '700'
  },
  journeyStopRow: {
    minHeight: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E0D8'
  },
  journeyStopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E7E0D7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  journeyStopCopy: {
    flex: 1,
    marginLeft: 12
  },
  journeyStopTitle: {
    color: '#1B2733',
    fontSize: 14,
    fontWeight: '800'
  },
  journeyModeActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row'
  },
  journeyNavButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  journeyNavButtonDisabled: {
    opacity: 0.45
  },
  journeyNavText: {
    color: '#625D57',
    fontWeight: '800',
    marginLeft: 4
  },
  journeyNextButton: {
    flex: 1.15,
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  completionScreen: {
    flex: 1,
    backgroundColor: '#F5EFE6'
  },
  completionContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 120,
    alignItems: 'center'
  },
  completionIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center'
  },
  completionEyebrow: {
    marginTop: 18,
    color: '#7B6E63',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  completionTitle: {
    marginTop: 8,
    color: '#1B2733',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  completionMemoryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 26,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 7
  },
  completionImage: {
    width: '100%',
    height: 220
  },
  completionCardBody: {
    padding: 22
  },
  completionTripTitle: {
    color: '#1B2733',
    fontSize: 21,
    fontWeight: '800'
  },
  completionTripMeta: {
    marginTop: 6,
    color: '#7B6E63',
    fontSize: 13,
    textTransform: 'capitalize'
  },
  completionStats: {
    flexDirection: 'row',
    marginTop: 20
  },
  addPhotosButton: {
    width: '100%',
    minHeight: 54,
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  addPhotosText: {
    flex: 1,
    marginLeft: 9,
    color: '#625D57',
    fontWeight: '800'
  },
  photoPickerCard: {
    width: '100%',
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16
  },
  photoPickerTitle: {
    color: '#1B2733',
    fontSize: 15,
    fontWeight: '800'
  },
  photoPickerDescription: {
    marginTop: 4,
    color: '#7B6E63',
    fontSize: 12
  },
  photoPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12
  },
  photoPickerItem: {
    width: '31.5%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  photoPickerImage: {
    width: '100%',
    height: '100%'
  },
  photoSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  completionStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4
  },
  completionStatValue: {
    color: '#1B2733',
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  completionStatLabel: {
    marginTop: 5,
    color: '#7B6E63',
    fontSize: 11
  },
  memorySavedNotice: {
    marginTop: 18,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  memorySavedText: {
    marginLeft: 7,
    color: '#4C4C4C',
    fontSize: 12,
    fontWeight: '700'
  },
  planSimilarInline: {
    marginTop: 14,
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center'
  },
  planSimilarInlineText: {
    marginLeft: 7,
    color: '#625D57',
    fontSize: 12,
    fontWeight: '800'
  },
  completionActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row'
  },
  completionSecondaryAction: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1C2AC',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  completionPrimaryAction: {
    flex: 1.15,
    minHeight: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
