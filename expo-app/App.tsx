import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Animated, Dimensions, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Image as RNImage } from 'react-native';
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
  Sun,
  Building2,
  Beer,
  ChevronLeft,
  Sparkles,
  Image as LucideImage
} from 'lucide-react-native';

const activityIcons = [
  { key: 'nature', label: 'Nature', color: '#A7C48B', Icon: Trees },
  { key: 'water', label: 'Water', color: '#8CC9F3', Icon: Droplets },
  { key: 'mountain', label: 'Mountains', color: '#E9D8C8', Icon: Mountain },
  { key: 'add', label: 'Add', color: '#F7D95C', Icon: Plus },
  { key: 'cafe', label: 'Café', color: '#F1E6DD', Icon: Coffee },
  { key: 'desert', label: 'Desert', color: '#E8D3AE', Icon: Sun },
  { key: 'city', label: 'City', color: '#F1E6DD', Icon: Building2 },
  { key: 'bar', label: 'Bar', color: '#F1E6DD', Icon: Beer }
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
  } catch (e) {
    // ignore when document is not available
  }
}

type WebMapProps = {
  center: [number, number];
  pins?: Array<{ id: string; position: [number, number]; title?: string; type?: string }>;
};

function WebMap({ center, pins }: WebMapProps) {
  if (!isWebPlatform) {
    return null;
  }

  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');

  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#E04F50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  `;

  const pinIcon = L.divIcon({
    className: '',
    html: pinSvg,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });

  return (
    <View style={styles.mapWrapper}>
      <MapContainer center={center} zoom={12} style={styles.mapContainer} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} icon={pinIcon} />
        {/* Render optional pins passed in via props */}
        {Array.isArray(pins) && pins.map((p) => (
          <Marker key={p.id} position={p.position} icon={pinIcon} />
        ))}
      </MapContainer>
    </View>
  );
}

type RootStackParamList = {
  Map: undefined;
  Profile: undefined;
};

type MapScreenProps = NativeStackScreenProps<RootStackParamList, 'Map'>;
type ProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const Stack = createNativeStackNavigator<RootStackParamList>();

function MapScreen({ navigation }: MapScreenProps) {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Requesting location permission...');
  const sheetRef = useRef<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetProgress = useRef(new Animated.Value(1)).current;
  const [sheetIndex, setSheetIndex] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    activityTypes: {
      nature: false,
      water: false,
      mountain: false,
      add: false,
      cafe: false,
      desert: false,
      city: false,
      bar: false
    },
    difficulty: 'Medium',
    distanceKm: 20,
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

  const [searchText, setSearchText] = useState('');

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
    setFilters((current) => ({
      ...current,
      activityTypes: {
        ...current.activityTypes,
        [key]: !current.activityTypes[key]
      }
    }));
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
    console.log('Selected filters:', filters);
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container}>
        <View style={styles.mapBackground} />
        {isWeb && <WebMap center={userLocation ? [userLocation.latitude, userLocation.longitude] : [32.0868, 34.8090]} pins={samplePins} />}

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
            <Pressable style={styles.circleButton} onPress={() => console.log('Navigate pressed')}>
              <Navigation size={22} color="#2D2D2D" />
            </Pressable>
            <Pressable style={styles.circleButton} onPress={() => console.log('Weather pressed')}>
              <Thermometer size={22} color="#2D2D2D" />
            </Pressable>
          </View>
        </View>

        {isWeb ? (
          <Animated.View style={[styles.webSheet, { transform: [{ translateY: sheetTranslate }] }]}> 
            <Pressable style={styles.handleBar} onPress={toggleWebSheet}>
              <View style={styles.handleLine} />
            </Pressable>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <Pressable style={styles.planButton} onPress={handlePlan}>
                <View style={styles.planButtonContent}>
                  <Sparkles size={22} color="#2D2D2D" />
                  <Text style={styles.planButtonText}>Plan my trip</Text>
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
                          selected && { backgroundColor: item.color, borderColor: item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
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
                          selected && { backgroundColor: item.color, borderColor: item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
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
                        style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                        onPress={() => setFilters((current) => ({ ...current, difficulty: option }))}
                      >
                        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option}</Text>
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
              <Pressable style={styles.planButton} onPress={handlePlan}>
                <View style={styles.planButtonContent}>
                  <Sparkles size={22} color="#2D2D2D" />
                  <Text style={styles.planButtonText}>Plan my trip</Text>
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
                          selected && { backgroundColor: item.color, borderColor: item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
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
                          selected && { backgroundColor: item.color, borderColor: item.color }
                        ]}
                        onPress={() => toggleActivity(item.key)}
                      >
                        <item.Icon size={22} color={selected ? '#1F1B18' : '#2D2D2D'} />
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
                        style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                        onPress={() => setFilters((current) => ({ ...current, difficulty: option }))}
                      >
                        <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option}</Text>
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

function ProfileScreen({ navigation }: ProfileScreenProps) {
  const photos = [1, 2, 3, 4, 5];
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
                <Text style={styles.profileStatNumber}>16</Text>
                <Text style={styles.profileStatLabel}>Trips</Text>
              </View>
              <View style={styles.profileStatTile}>
                <Text style={styles.profileStatNumber}>3</Text>
                <Text style={styles.profileStatLabel}>Saved</Text>
              </View>
              <View style={styles.profileStatTile}>
                <Text style={styles.profileStatNumber}>7</Text>
                <Text style={styles.profileStatLabel}>Vibes</Text>
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
              {photos.map((photo) => (
                <RNImage
                  key={photo}
                  source={{ uri: `https://picsum.photos/120/150?random=${photo}` }}
                  style={styles.profilePhoto}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C4B79F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF'
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
  }
});
