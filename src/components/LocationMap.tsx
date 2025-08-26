import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  searchLocation: string;
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
}

const LocationMap = ({ searchLocation, onLocationSelect }: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = L.map(mapContainer.current).setView([40.7128, -74.0060], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, []);

  // Handle search location changes using free Nominatim geocoding
  useEffect(() => {
    if (!map.current || !searchLocation.trim()) return;

    const searchForLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const address = result.display_name;

          // Update map center
          map.current?.setView([lat, lon], 16);

          // Add or update marker
          if (marker.current) {
            map.current?.removeLayer(marker.current);
          }
          
          marker.current = L.marker([lat, lon]).addTo(map.current!);

          // Call callback with location data
          onLocationSelect?.([lon, lat], address);

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
  }, [searchLocation, onLocationSelect, toast]);

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
          map.current.setView([latitude, longitude], 16);

          // Add current location marker
          if (marker.current) {
            map.current.removeLayer(marker.current);
          }
          
          marker.current = L.marker([latitude, longitude]).addTo(map.current);

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