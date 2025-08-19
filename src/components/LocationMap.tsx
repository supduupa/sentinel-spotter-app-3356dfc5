import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationMapProps {
  searchLocation: string;
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
}

const LocationMap = ({ searchLocation, onLocationSelect }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [needsToken, setNeedsToken] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  // Check for Mapbox token on mount
  useEffect(() => {
    // In a real Supabase project, you would get this from edge function secrets
    // For now, we'll ask user to input their token
    const token = localStorage.getItem('mapbox_token');
    if (token) {
      setMapboxToken(token);
      setNeedsToken(false);
    }
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || needsToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40],
      zoom: 9
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, needsToken]);

  // Handle search location changes
  useEffect(() => {
    if (!map.current || !searchLocation.trim() || !mapboxToken) return;

    const searchForLocation = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchLocation)}.json?access_token=${mapboxToken}&limit=1`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const [lng, lat] = feature.center;
          const address = feature.place_name;

          // Update map center
          map.current?.flyTo({
            center: [lng, lat],
            zoom: 14
          });

          // Add or update marker
          if (marker.current) {
            marker.current.remove();
          }
          
          marker.current = new mapboxgl.Marker({
            color: '#3B82F6'
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          // Call callback with location data
          onLocationSelect?.([lng, lat], address);

          toast({
            title: "Location found",
            description: address,
          });
        } else {
          toast({
            title: "Location not found",
            description: "Please try a different search term",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        toast({
          title: "Search error",
          description: "Unable to search for location",
          variant: "destructive",
        });
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchForLocation, 500);
    return () => clearTimeout(timeoutId);
  }, [searchLocation, mapboxToken, onLocationSelect, toast]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([longitude, latitude]);

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 16
          });

          // Add current location marker
          if (marker.current) {
            marker.current.remove();
          }
          
          marker.current = new mapboxgl.Marker({
            color: '#10B981'
          })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          onLocationSelect?.([longitude, latitude], 'Current Location');
        }

        toast({
          title: "Location found",
          description: "Using your current GPS location",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "GPS error",
          description: "Unable to get your current location",
          variant: "destructive",
        });
      }
    );
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setNeedsToken(false);
      toast({
        title: "Token saved",
        description: "Mapbox token has been saved",
      });
    }
  };

  if (needsToken) {
    return (
      <div className="bg-muted rounded-lg p-6 text-center space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please enter your Mapbox public token to enable map functionality.
            Get your token from <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter your Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
            <Button onClick={handleTokenSubmit} size="sm">
              Save Token
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-lg h-64 relative overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      
      <Button
        variant="outline"
        onClick={getCurrentLocation}
        className="w-full flex items-center gap-2"
      >
        <Navigation className="w-4 h-4" />
        Use Current GPS Location
      </Button>
    </div>
  );
};

export default LocationMap;