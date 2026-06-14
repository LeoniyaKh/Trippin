import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

type Page = 'splash' | 'map' | 'profile';

type MapPin = {
  id: string;
  position: [number, number];
  label: string;
};

const pins: MapPin[] = [
  { id: 'north', position: [32.839, 35.628], label: 'Golan Heights' },
  { id: 'coast', position: [32.794, 34.989], label: 'Haifa Shore' },
  { id: 'lake', position: [32.906, 35.506], label: 'Sea of Galilee' },
  { id: 'forest', position: [32.994, 35.450], label: 'Galil Trails' },
  { id: 'river', position: [32.421, 35.565], label: 'Jordan Valley' },
];

function App() {
  const [page, setPage] = useState<Page>('splash');

  useEffect(() => {
    const timeout = window.setTimeout(() => setPage('map'), 1600);
    return () => window.clearTimeout(timeout);
  }, []);

  if (page === 'splash') {
    return (
      <div className="splash-shell">
        <span className="splash-index">0</span>
        <div className="splash-card">
          <div className="logo-plate">
            <svg viewBox="0 0 240 240" aria-hidden="true" className="logo-icon">
              <circle cx="120" cy="120" r="108" fill="#f3e5cd" stroke="#201f1a" strokeWidth="2" />
              <path d="M62 150 L96 84 L130 126 L166 70 L186 104 L190 118 L150 158 L126 146 L106 168 Z" fill="#201f1a" opacity="0.95" />
              <path d="M110 82 C110 70 118 60 130 60 C142 60 150 70 150 82" fill="none" stroke="#201f1a" strokeWidth="4" />
              <path d="M118 132 L120 148 L132 148 L134 132" fill="#201f1a" />
              <path d="M107 134 C107 122 115 114 127 114 C139 114 147 122 147 134" fill="none" stroke="#201f1a" strokeWidth="3" />
            </svg>
            <div className="logo-copy">
              <div className="logo-title">TRIPPIN'</div>
              <div className="logo-subtitle">SINCE 2026</div>
            </div>
          </div>

          <div className="loading-label">loading...</div>
        </div>
      </div>
    );
  }

  if (page === 'profile') {
    return (
      <div className="profile-shell">
        <button className="back-button" onClick={() => setPage('map')} aria-label="Back to map">
          <span className="arrow-left" />
        </button>

        <div className="profile-panel">
          <div className="profile-avatar" aria-hidden="true">
            <div className="avatar-fade" />
          </div>
          <div className="profile-name">Sarah Cohen</div>
          <div className="profile-subtitle">Based in Jerusalem</div>

          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">16</div>
              <div className="stat-label">Trips</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">3</div>
              <div className="stat-label">Saved</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">7</div>
              <div className="stat-label">Vibes</div>
            </div>
          </div>

          <div className="profile-section">
            <div className="section-heading">Based on Your Trips <span className="sparkle">✨</span></div>
            <p className="profile-copy">
              Sarah loves water hikes, especially waterfalls and lakes in northern Israel, and averages about one hike a week!
            </p>
          </div>

          <div className="profile-section">
            <div className="section-heading">Recent Trip Memories <span className="section-icon">🖼️</span></div>
            <div className="memory-row">
              <div className="memory-card memory-1" />
              <div className="memory-card memory-2" />
              <div className="memory-card memory-3" />
              <div className="memory-card memory-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-shell">
      <div className="map-scene">
        <div className="map-topbar">
          <div className="brand-pill">TRIPPIN'</div>
          <div className="search-card">
            <span className="search-icon">🔍</span>
            <input className="search-input" type="search" placeholder="Search destination" aria-label="Search destination" />
          </div>
        </div>

        <div className="map-card">
          <MapContainer
            center={[31.8, 34.9]}
            zoom={8}
            scrollWheelZoom={false}
            className="leaflet-map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {pins.map((pin) => (
              <CircleMarker
                key={pin.id}
                center={pin.position}
                radius={12}
                pathOptions={{ color: '#ffffff', fillColor: '#f43c3c', fillOpacity: 1, weight: 3 }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent>
                  {pin.label}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="sidebar-actions">
            <button className="icon-button" type="button" onClick={() => setPage('profile')} aria-label="Open profile">
              <span className="icon-person">👤</span>
            </button>
            <button className="icon-button" type="button" aria-label="Navigate">
              <span className="icon-arrow">➤</span>
            </button>
            <button className="icon-button" type="button" aria-label="Trip weather">
              <span className="icon-temp">☀️</span>
            </button>
          </div>
        </div>

        <div className="bottom-sheet">
          <button className="plan-button" type="button">
            Plan my trip <span className="plan-sparkle">✨</span>
          </button>
          <div className="bottom-actions">
            <button className="round-action" type="button" aria-label="Forest highlights">🌲</button>
            <button className="round-action" type="button" aria-label="Water places">💧</button>
            <button className="round-action" type="button" aria-label="Mountain spots">⛰️</button>
            <button className="round-action" type="button" aria-label="Add new">＋</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
