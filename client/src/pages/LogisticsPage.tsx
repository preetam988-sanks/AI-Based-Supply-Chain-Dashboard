import React, { useEffect, useState, useRef, useMemo } from "react";
import { getVehicles, createVehicle } from "@/services/api";
import {
  Truck,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleStatus } from "@/types";

import Map, { Marker } from "react-map-gl";
import type { MapRef } from "react-map-gl";
import useSupercluster from "use-supercluster";
import GeocoderControl from "@/components/GeocoderControl";
import { mapStyles } from "@/components/MapControls";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const LogisticsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
      useState<VehicleStatus | "All">("All");

  const [formData, setFormData] = useState({
    vehicle_number: "",
    driver_name: "",
    latitude: 18.5204,
    longitude: 73.8567,
  });

  const isAdmin = true;

  const [viewState, setViewState] = useState({
    longitude: 73.8567,
    latitude: 18.5204,
    zoom: 11,
    pitch: 30,
    bearing: 0,
  });

  const mapRef = useRef<MapRef>(null);
  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || "";

  // -----------------------
  // FETCH VEHICLES
  // -----------------------
  const fetchVehicles = async () => {
    try {
      const res = await getVehicles();
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    const i = setInterval(fetchVehicles, 30000);
    return () => clearInterval(i);
  }, []);

  // -----------------------
  // FILTER
  // -----------------------
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(
        (v) =>
            (statusFilter === "All" || v.status === statusFilter) &&
            (v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.driver_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vehicles, searchTerm, statusFilter]);

  // -----------------------
  // MAP POINTS
  // -----------------------
  const points = useMemo(
      () =>
          filteredVehicles.map((v) => ({
            type: "Feature",
            properties: {
              cluster: false,
              vehicleId: v.id,
              vehicle: v,
            },
            geometry: {
              type: "Point",
              coordinates: [v.longitude, v.latitude],
            },
          })),
      [filteredVehicles]
  );

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapRef.current?.getMap().getBounds().toArray().flat() as any,
    zoom: viewState.zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] gap-4 bg-zinc-950 p-4">

        {/* ---------------- MAP ---------------- */}
        <div className="flex-1 bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800">
          <Map
              ref={mapRef}
              {...viewState}
              onMove={(e) => setViewState(e.viewState)}
              mapStyle={mapStyles["Default"]}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
          >
            <div className="absolute top-4 left-4 z-10 w-64">
              <GeocoderControl mapboxAccessToken={MAPBOX_TOKEN} />
            </div>

            {clusters.map((cluster: any) => {
              const [lng, lat] = cluster.geometry.coordinates;

              if (cluster.properties.cluster) {
                return (
                    <Marker key={cluster.id} longitude={lng} latitude={lat}>
                      <div
                          className="w-9 h-9 bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer"
                          onClick={() =>
                              setViewState({
                                ...viewState,
                                longitude: lng,
                                latitude: lat,
                                zoom: supercluster.getClusterExpansionZoom(cluster.id),
                              })
                          }
                      >
                        {cluster.properties.point_count}
                      </div>
                    </Marker>
                );
              }

              return (
                  <Marker
                      key={cluster.properties.vehicleId}
                      longitude={lng}
                      latitude={lat}
                  >
                    <Truck
                        className={cn(
                            "h-7 w-7 cursor-pointer",
                            selectedVehicle?.id === cluster.properties.vehicleId
                                ? "text-cyan-400 scale-125"
                                : "text-zinc-400 hover:text-white"
                        )}
                        onClick={() =>
                            setSelectedVehicle(cluster.properties.vehicle)
                        }
                    />
                  </Marker>
              );
            })}
          </Map>
        </div>

        {/* ---------------- SIDEBAR ---------------- */}
        <aside className="w-full md:w-[380px] bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col">

          <div className="p-5 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Fleet Monitoring</h2>
              {isAdmin && (
                  <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="p-2 bg-cyan-600 text-white rounded-lg"
                  >
                    <Plus size={18} />
                  </button>
              )}
            </div>

            <input
                placeholder="Search fleet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white"
            />
          </div>

          {/* VEHICLE LIST (THIS WAS MISSING BEFORE) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredVehicles.map((v) => (
                <div
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={cn(
                        "p-4 rounded-lg cursor-pointer border",
                        selectedVehicle?.id === v.id
                            ? "bg-zinc-800 border-cyan-500"
                            : "bg-zinc-800/40 border-transparent"
                    )}
                >
                  <div className="flex justify-between text-white font-bold">
                    <span>{v.vehicle_number}</span>
                    <span className="text-xs text-cyan-400">{v.status}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{v.driver_name}</p>
                </div>
            ))}
          </div>
        </aside>

        {/* ---------------- MODAL ---------------- */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="bg-zinc-900 w-full max-w-md rounded-xl p-6">
                <div className="flex justify-between mb-6 text-white font-bold">
                  <span>Deploy New Vehicle</span>
                  <button onClick={() => setIsAddModalOpen(false)}>
                    <X />
                  </button>
                </div>

                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();

                      await createVehicle({
                        vehicle_number: formData.vehicle_number,
                        driver_name: formData.driver_name,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        status: "Idle",
                        live_temp: 25,
                        orders_count: 0,
                        fuel_level: 100,
                      });

                      await fetchVehicles();
                      setIsAddModalOpen(false);
                    }}
                >
                  <input
                      placeholder="Vehicle Number"
                      value={formData.vehicle_number}
                      onChange={(e) =>
                          setFormData({ ...formData, vehicle_number: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-white"
                  />

                  <input
                      placeholder="Driver Name"
                      value={formData.driver_name}
                      onChange={(e) =>
                          setFormData({ ...formData, driver_name: e.target.value })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-lg text-white"
                  />

                  <button
                      type="submit"
                      className="w-full bg-cyan-600 py-3 rounded-lg text-white font-bold"
                  >
                    Register Vehicle
                  </button>
                </form>
              </div>
            </div>
        )}
      </div>
  );
};

export default LogisticsPage;
