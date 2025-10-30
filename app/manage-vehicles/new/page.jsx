"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function NewVehiclePage() {
  const router = useRouter();
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);
  const [lockups, setLockups] = useState({
    models: [],
    colors: [],
    fuels: [],
    statuses: [],
    stations: [],
    groups: [],
    taxes: [],
  });
  const [vehicle, setVehicle] = useState({
    PlateNr: "",
    PlateWW: "",
    PlateDate: "",
    ModelID: null,
    ColorCode: "",
    ChassiNr: "",
    CurrentKm: 0,
    CurrentFuel: 0,
    KmsBuy: 0,
    FuelType: "",
    StatusID: null,
    GroupCode: "",
    RentalStation: "",
    DocumentNr: "",
    FleetType: "",
    PurchaseDate: "",
    PurchaseHT: 0,
    PurchaseTax: null,
    PurchaseTVA: 0,
    PurchaseTTC: 0,
    SalesDate: "",
    SalesHT: 0,
    SalesTax: null,
    SalesTVA: 0,
    SalesTTC: 0,
    SalesClient: null,
    Note: "",
    FinancingType: "",
    IsBlocked: false,
    BlockedDate: null,
  });

  // Memoized filtered lists for brand/model/version selection
  const brands = useMemo(() => {
    if (!lockups?.models) return [];
    return [...new Set(lockups?.models.map((m) => m.Brand))].sort();
  }, [lockups?.models]);

  const models = useMemo(() => {
    if (!lockups?.models || !selectedBrand) return [];
    return [
      ...new Set(
        lockups?.models
          .filter((m) => m.Brand === selectedBrand)
          .map((m) => m.Model)
      ),
    ].sort();
  }, [lockups?.models, selectedBrand]);

  const versions = useMemo(() => {
    if (!lockups?.models || !selectedModel) return [];
    return lockups?.models
      .filter((m) => m.Model === selectedModel && m.Brand === selectedBrand)
      .map((m) => ({ id: m.ModelID, version: m.Version }))
      .sort((a, b) => a.version.localeCompare(b.version));
  }, [lockups?.models, selectedBrand, selectedModel]);

  // Calculate tax amounts
  const calculateTaxAmount = (baseAmount, taxId) => {
    if (!baseAmount || !taxId || !lockups?.taxes) return 0;
    const taxRate =
      lockups?.taxes.find((t) => t.TaxID === taxId)?.TaxValue || 0;
    return (baseAmount * taxRate) / 100;
  };

  useEffect(() => {
    fetchLockups();
  }, []);

  const fetchLockups = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles/lockups`
      );
      if (!response.ok) {
        // throw new Error(`HTTP error! status: ${response.status}`);
        return;
      }
      const data = await response.json();
      setLockups(data);
    } catch (error) {
      console.error("Error fetching lockups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setVehicle((prev) => {
      const newData = { ...prev, [field]: value };

      // Handle tax calculations for Purchase
      if (field === "PurchaseHT" || field === "PurchaseTax") {
        const baseAmount = field === "PurchaseHT" ? value : prev.PurchaseHT;
        const taxId = field === "PurchaseTax" ? value : prev.PurchaseTax;
        const tva = calculateTaxAmount(baseAmount, taxId);
        newData.PurchaseTVA = tva;
        newData.PurchaseTTC = (parseFloat(baseAmount) || 0) + tva;
      }

      // Handle tax calculations for Sales
      if (field === "SalesHT" || field === "SalesTax") {
        const baseAmount = field === "SalesHT" ? value : prev.SalesHT;
        const taxId = field === "SalesTax" ? value : prev.SalesTax;
        const tva = calculateTaxAmount(baseAmount, taxId);
        newData.SalesTVA = tva;
        newData.SalesTTC = (parseFloat(baseAmount) || 0) + tva;
      }

      // Handle brand/model/version selection
      if (field === "Brand") {
        setSelectedBrand(value);
        setSelectedModel("");
        newData.ModelID = null;
      } else if (field === "Model") {
        setSelectedModel(value);
        newData.ModelID = null;
      }

      return newData;
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vehicle),
        }
      );

      if (response.ok) {
        router.push("/manage-vehicles");
      } else {
        console.error("Error creating vehicle");
      }
    } catch (error) {
      console.error("Error creating vehicle:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/manage-vehicles")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Nouveau véhicule</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/manage-vehicles")}
            size="icon"
            className="h-9 w-9"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
          <Button
            onClick={handleSave}
            size="icon"
            variant="default"
            className="h-9 w-9"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plaque d'immatriculation</Label>
                <Input
                  value={vehicle.PlateNr}
                  onChange={(e) => handleInputChange("PlateNr", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Plaque WW</Label>
                <Input
                  value={vehicle.PlateWW}
                  onChange={(e) => handleInputChange("PlateWW", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Marque</Label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => handleInputChange("Brand", value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands &&
                      brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Modèle</Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => handleInputChange("Model", value)}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {models &&
                      models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Select
                  value={vehicle.ModelID?.toString()}
                  onValueChange={(value) =>
                    handleInputChange("ModelID", parseInt(value))
                  }
                  disabled={!selectedModel}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions &&
                      versions.map((v) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.version}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date de plaque</Label>
              <Input
                type="date"
                value={vehicle.PlateDate}
                onChange={(e) => handleInputChange("PlateDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro de document</Label>
                <Input
                  value={vehicle.DocumentNr}
                  onChange={(e) =>
                    handleInputChange("DocumentNr", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Type de flotte</Label>
                <Input
                  value={vehicle.FleetType}
                  onChange={(e) =>
                    handleInputChange("FleetType", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Numéro de châssis</Label>
              <Input
                value={vehicle.ChassiNr}
                onChange={(e) => handleInputChange("ChassiNr", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select
                value={vehicle.ColorCode}
                onValueChange={(value) => handleInputChange("ColorCode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Couleur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value={null}>
                    Aucun
                  </SelectItem>
                  {lockups.colors &&
                    lockups?.colors.map((color) => (
                      <SelectItem key={color.ColorCode} value={color.ColorCode}>
                        {color.Color}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* État */}
        <Card>
          <CardHeader>
            <CardTitle>État</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Kilométrage actuel</Label>
              <Input
                type="number"
                value={vehicle.CurrentKm}
                onChange={(e) =>
                  handleInputChange("CurrentKm", parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Niveau de carburant</Label>
              <Input
                type="number"
                value={vehicle.CurrentFuel}
                onChange={(e) =>
                  handleInputChange("CurrentFuel", parseInt(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type de carburant</Label>
              <Select
                value={vehicle.FuelType}
                onValueChange={(value) => handleInputChange("FuelType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                  {lockups.fuels &&
                    lockups?.fuels.map((fuel) => (
                      <SelectItem key={fuel.FuelCode} value={fuel.FuelCode}>
                        {fuel.FuelName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={vehicle.StatusID ? vehicle.StatusID.toString() : null}
                onValueChange={(value) =>
                  handleInputChange("StatusID", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                  {lockups.statuses &&
                    lockups?.statuses.map((status) => (
                      <SelectItem
                        key={status.StatusID}
                        value={status.StatusID.toString()}
                      >
                        {status.Status}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informations financières d'achat */}
        <Card>
          <CardHeader>
            <CardTitle>Informations d'achat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Date d'achat</Label>
              <Input
                type="date"
                value={vehicle.PurchaseDate}
                onChange={(e) =>
                  handleInputChange("PurchaseDate", e.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix HT</Label>
                <Input
                  type="number"
                  value={vehicle.PurchaseHT}
                  onChange={(e) =>
                    handleInputChange("PurchaseHT", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Taxe</Label>
                <Select
                  value={vehicle.PurchaseTax ? vehicle.PurchaseTax.toString() : null}
                  onValueChange={(value) =>
                    handleInputChange("PurchaseTax", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taxe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                    {lockups.taxes &&
                      lockups?.taxes.map((tax) => (
                        <SelectItem
                          key={tax.TaxID}
                          value={tax.TaxID.toString()}
                        >
                          {tax.TaxValue}%
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TVA</Label>
                <Input
                  type="number"
                  value={vehicle.PurchaseTVA?.toFixed(2)}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <Input
                  type="number"
                  value={vehicle.PurchaseTTC?.toFixed(2)}
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations financières de vente */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de vente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Date de vente</Label>
              <Input
                type="date"
                value={vehicle.SalesDate}
                onChange={(e) => handleInputChange("SalesDate", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix HT</Label>
                <Input
                  type="number"
                  value={vehicle.SalesHT}
                  onChange={(e) =>
                    handleInputChange("SalesHT", parseFloat(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Taxe</Label>
                <Select
                  value={vehicle.SalesTax ? vehicle.SalesTax.toString() : null}
                  onValueChange={(value) =>
                    handleInputChange("SalesTax", parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taxe" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                    {lockups.taxes &&
                      lockups?.taxes.map((tax) => (
                        <SelectItem
                          key={tax.TaxID}
                          value={tax.TaxID.toString()}
                        >
                          {tax.TaxValue}%
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TVA</Label>
                <Input
                  type="number"
                  value={vehicle.SalesTVA?.toFixed(2)}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <Input
                  type="number"
                  value={vehicle.SalesTTC?.toFixed(2)}
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Input
                type="number"
                value={vehicle.SalesClient || ""}
                onChange={(e) =>
                  handleInputChange("SalesClient", parseInt(e.target.value))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Financement et blocage */}
        <Card>
          <CardHeader>
            <CardTitle>Financement et État</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Type de financement</Label>
              <Input
                value={vehicle.FinancingType}
                onChange={(e) =>
                  handleInputChange("FinancingType", e.target.value)
                }
              />
            </div>
            <div className="space-y-4">
              <Label>État de blocage</Label>
              <RadioGroup
                value={vehicle.IsBlocked ? "1" : "0"}
                onValueChange={(value) => {
                  const isBlocked = value === "1";
                  const currentDate = isBlocked
                    ? new Date().toISOString()
                    : null;
                  setVehicle((prev) => ({
                    ...prev,
                    IsBlocked: isBlocked,
                    BlockedDate: currentDate,
                  }));
                }}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="nonblocked" />
                  <Label htmlFor="nonblocked">Non bloqué</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="blocked" />
                  <Label htmlFor="blocked">Bloqué</Label>
                </div>
              </RadioGroup>
            </div>
            {vehicle.IsBlocked && (
              <div className="space-y-2">
                <Label>Date de blocage</Label>
                <Input
                  type="datetime-local"
                  value={vehicle.BlockedDate?.split(".")[0] || ""}
                  disabled
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Localisation */}
        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Station</Label>
              <Select
                value={vehicle.RentalStation}
                onValueChange={(value) =>
                  handleInputChange("RentalStation", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                  {lockups.stations &&
                    lockups?.stations.map((station) => (
                      <SelectItem
                        key={station.StationCode}
                        value={station.StationCode}
                      >
                        {station.Station}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select
                value={vehicle.GroupCode}
                onValueChange={(value) => handleInputChange("GroupCode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value={null}>Aucun</SelectItem>
                  {lockups.groups &&
                    lockups?.groups.map((group) => (
                      <SelectItem key={group.GroupCode} value={group.GroupCode}>
                        {group.GroupName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={vehicle.Note}
              onChange={(e) => handleInputChange("Note", e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
