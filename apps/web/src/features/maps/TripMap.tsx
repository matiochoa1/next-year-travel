import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef } from 'react'
import { PLACES, type PlaceKind, type Route } from '../../data/routes'
import { routeBounds, routeGeoJson } from './legGeometry'

// MapLibre 6 ships its worker as a sibling file, which bundlers cannot locate on their own.
setWorkerUrl(workerUrl)

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const SOURCE = 'route-legs'

// Inline paths: react-dom/server just to stringify five icons would outweigh the whole feature.
const KIND_ICONS: Record<PlaceKind, string> = {
  city: '<path d="M4 21V7l6-3v17M10 21V10l10 3v8M3 21h18"/>',
  temple: '<path d="M12 3l9 6H3zM5 9v9M10 9v9M14 9v9M19 9v9M3 21h18"/>',
  island: '<path d="M12 10c-2-3-5-3-7-1 2 0 4 1 5 2M12 10c2-3 5-3 7-1-2 0-4 1-5 2M12 10c-1 4-2 7-3 11M4 21h16"/>',
  nature: '<path d="M12 3l6 8h-3l4 6H5l4-6H6zM12 17v4"/>',
  transfer: '<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 4-4 2 2-4z"/>',
}

const iconHtml = (kind: PlaceKind) =>
  `<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${KIND_ICONS[kind]}</svg>`

function applyBrand(map: MapLibreMap) {
  if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', '#f3ecdc')
  if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', '#a6dcd9')
  if (map.getLayer('park')) map.setPaintProperty('park', 'fill-color', '#dfe6cf')
  // Spanish place names where the tiles carry them.
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field')) {
      map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name:latin'], ['get', 'name']])
    }
  }
}

function addRouteLayers(map: MapLibreMap) {
  map.addSource(SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  const layers: Array<{ mode: string; color: string; width: number; dash?: number[] }> = [
    { mode: 'road', color: '#0a2536', width: 2.5 },
    { mode: 'rail', color: '#0d6650', width: 2.5 },
    { mode: 'ferry', color: '#0e8c8c', width: 3, dash: [1.5, 1.2] },
    { mode: 'boat', color: '#0e8c8c', width: 2, dash: [0.6, 1.4] },
    { mode: 'flight', color: '#765711', width: 2, dash: [3, 2] },
  ]
  for (const { mode, color, width, dash } of layers) {
    map.addLayer({
      id: `leg-${mode}`,
      type: 'line',
      source: SOURCE,
      filter: ['==', ['get', 'mode'], mode],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': color, 'line-width': width, ...(dash ? { 'line-dasharray': dash } : {}) },
    })
  }
}

interface TripMapProps {
  route: Route
  activePlace: string | null
  onSelectPlace: (placeId: string) => void
  onError: () => void
}

export default function TripMap({ route, activePlace, onSelectPlace, onError }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const readyRef = useRef(false)
  const markersRef = useRef<Map<string, { marker: Marker; button: HTMLButtonElement }>>(new Map())
  const latest = useRef({ route, onSelectPlace, onError })
  latest.current = { route, onSelectPlace, onError }

  const fit = (map: MapLibreMap, target: Route, duration: number) => {
    const narrow = (containerRef.current?.clientWidth ?? 0) < 640
    map.fitBounds(routeBounds(target), { padding: narrow ? 56 : 90, maxZoom: 9, duration })
  }

  const drawRoute = (map: MapLibreMap, target: Route) => {
    ;(map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(routeGeoJson(target))
    for (const { marker } of markersRef.current.values()) marker.remove()
    markersRef.current.clear()

    target.stops.forEach((stop) => {
      const place = PLACES[stop.place]
      if (!place) return
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'map-marker'
      button.dataset.daytrip = String(Boolean(stop.dayTrip))
      button.setAttribute('aria-label', `${stop.label}${stop.dayTrip ? ', excursión de un día' : ''}`)
      button.innerHTML = `${iconHtml(place.kind)}<span class="map-label">${place.name}</span>`
      button.addEventListener('click', (event) => {
        event.stopPropagation()
        latest.current.onSelectPlace(stop.place)
      })
      const marker = new Marker({ element: button }).setLngLat([place.lng, place.lat]).addTo(map)
      markersRef.current.set(stop.place, { marker, button })
    })
  }

  useEffect(() => {
    if (!containerRef.current) return
    let map: MapLibreMap
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: STYLE_URL,
        center: [101, 10],
        zoom: 4,
        attributionControl: { compact: true },
        cooperativeGestures: window.matchMedia('(pointer: coarse)').matches,
        pitchWithRotate: false,
        dragRotate: false,
      })
    } catch {
      latest.current.onError()
      return
    }
    mapRef.current = map
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      applyBrand(map)
      addRouteLayers(map)
      readyRef.current = true
      drawRoute(map, latest.current.route)
      fit(map, latest.current.route, 0)
    })
    map.on('error', (event) => {
      // Tile hiccups are recoverable; only an unusable style means the map cannot be shown.
      if (!readyRef.current && !map.isStyleLoaded() && event.error?.message?.includes('style')) latest.current.onError()
    })
    return () => {
      readyRef.current = false
      mapRef.current = null
      map.remove()
    }
    // The map instance lives for the component's lifetime; updates go through the effects below.
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    drawRoute(map, route)
    fit(map, route, 900)
  }, [route])

  useEffect(() => {
    for (const [placeId, { button }] of markersRef.current) {
      button.dataset.active = String(placeId === activePlace)
    }
    const place = activePlace ? PLACES[activePlace] : null
    if (place && mapRef.current && readyRef.current) {
      // Close enough to separate neighbours such as Koh Tao and Nang Yuan.
      mapRef.current.easeTo({ center: [place.lng, place.lat], zoom: Math.max(mapRef.current.getZoom(), 10), duration: 800 })
    }
  }, [activePlace, route])

  return (
    <div
      ref={containerRef}
      data-testid="trip-map"
      role="region"
      aria-label={`Mapa de la ruta ${route.name}. Tienes la misma información en la lista de paradas.`}
      className="size-full"
    />
  )
}
