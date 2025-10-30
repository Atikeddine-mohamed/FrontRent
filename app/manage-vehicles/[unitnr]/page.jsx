"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Pencil,
  X,
  Trash2,
  Save,
  Ban,
  Loader2,
  Car,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const unitnr = params?.unitnr;
  const [vehicle, setVehicle] = useState(null);
  const [lockups, setLockups] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [loading, setLoading] = useState(true);

  // Memoized filtered lists for brand/model/version selection
  const brands = useMemo(() => {
    if (!lockups?.models) return [];
    return [...new Set(lockups.models.map((m) => m.Brand))];
  }, [lockups?.models]);

  const models = useMemo(() => {
    if (!lockups?.models || !selectedBrand) return [];
    return [
      ...new Set(
        lockups.models
          .filter((m) => m.Brand === selectedBrand)
          .map((m) => m.Model)
      ),
    ];
  }, [lockups?.models, selectedBrand]);

  const versions = useMemo(() => {
    if (!lockups?.models || !selectedModel) return [];
    return lockups.models
      .filter((m) => m.Model === selectedModel && m.Brand === selectedBrand)
      .map((m) => ({ id: m.ModelID, version: m.Version }));
  }, [lockups?.models, selectedBrand, selectedModel]);

  // Calculate tax amounts
  const calculateTaxAmount = (baseAmount, taxId) => {
    if (!baseAmount || !taxId || !lockups?.taxes) return 0;
    const taxRate = lockups.taxes.find((t) => t.TaxID === taxId)?.TaxValue || 0;
    return (baseAmount * taxRate) / 100;
  };

  useEffect(() => {
    fetchVehicleData();
  }, [unitnr]);

  // Effect to set initial brand/model when data is loaded
  useEffect(() => {
    if (vehicle && lockups?.models) {
      const model = lockups.models.find((m) => m.ModelID === vehicle.ModelID);
      if (model) {
        setSelectedBrand(model.Brand);
        setSelectedModel(model.Model);
      }
    }
  }, [vehicle, lockups?.models]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles/${unitnr}`
      );

      if (response.status === 404 || !response.ok) {
        setVehicle({ notFound: true });
        console.error(`HTTP error! status: ${response.status}`);
        return;
      }

      const data = await response.json();
      setVehicle(data.vehicle);

      const resLockups = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles/lockups`
      );
      const lockupData = await resLockups.json();
      setLockups({
        models: lockupData.models,
        colors: lockupData.colors,
        fuels: lockupData.fuels,
        stations: lockupData.stations,
        statuses: lockupData.statuses,
        groups: lockupData.groups,
        taxes: lockupData.taxes,
      });

      setEditedVehicle(data.vehicle);
    } catch (error) {
      console.error("Error fetching vehicle data:", error);
      setVehicle({ notFound: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchVehicleData();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles/${unitnr}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedVehicle),
        }
      );

      if (response.ok) {
        setIsEditing(false);
        fetchVehicleData();
      } else {
        console.error("Error updating vehicle");
      }
    } catch (error) {
      console.error("Error updating vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/manage_vehicles/${unitnr}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        router.push("/manage-vehicles");
      } else {
        console.error("Error deleting vehicle");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedVehicle((prev) => {
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

  if (vehicle.notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">
            Véhicule non trouvé
          </h2>
          <p className="text-lg text-muted-foreground">
            Le véhicule que vous recherchez n&apos;existe pas ou a été supprimé
          </p>
        </div>
        <Button
          onClick={() => router.push("/manage-vehicles")}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 pt-0">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center  gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/manage-vehicles")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-row gap-6">
              <h1 className="text-2xl font-bold">
                {vehicle.Brand} {vehicle.Model} {vehicle.Version}
              </h1>
              {vehicle?.IsBlocked && (
                <Badge
                  variant="destructive"
                  className="w-fit text-base py-1 px-3"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Bloqué
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button onClick={handleEdit} size="icon" className="h-9 w-9">
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
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
              </>
            )}
          </div>
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
                <Label>Numéro d'unité</Label>
                <Input value={editedVehicle.UnitNr || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Plaque d'immatriculation</Label>
                <Input
                  value={editedVehicle.PlateNr || ""}
                  onChange={(e) => handleInputChange("PlateNr", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Label>Marque</Label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => handleInputChange("Brand", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="w-[100px]">
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
                  disabled={!isEditing || !selectedBrand}
                >
                  <SelectTrigger className="w-[100px]">
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
                  value={editedVehicle.ModelID?.toString()}
                  onValueChange={(value) =>
                    handleInputChange("ModelID", parseInt(value))
                  }
                  disabled={!isEditing || !selectedModel}
                >
                  <SelectTrigger className="w-[200px]">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plaque WW</Label>
                <Input value={editedVehicle.PlateWW || ""} disabled={true} />
              </div>
              <div className="space-y-2">
                <Label>Date de mise en circulation</Label>
                <Input
                  type="date"
                  value={editedVehicle.PlateDate?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleInputChange("PlateDate", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro de document</Label>
                <Input
                  value={editedVehicle.DocumentNr || ""}
                  onChange={(e) =>
                    handleInputChange("DocumentNr", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de flotte</Label>
                <Input
                  value={editedVehicle.FleetType || ""}
                  onChange={(e) =>
                    handleInputChange("FleetType", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Numéro de châssis</Label>
              <Input
                value={editedVehicle.ChassiNr || ""}
                onChange={(e) => handleInputChange("ChassiNr", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select
                value={
                  editedVehicle.ColorCode ? editedVehicle.ColorCode : "none"
                }
                onValueChange={(value) => handleInputChange("ColorCode", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Couleur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value="none">Aucun</SelectItem>
                  {lockups.colors &&
                    lockups.colors.map((color) => (
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
                value={editedVehicle.CurrentKm || ""}
                onChange={(e) =>
                  handleInputChange("CurrentKm", parseInt(e.target.value))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Niveau de carburant</Label>
              <Input
                type="number"
                value={editedVehicle.CurrentFuel || ""}
                onChange={(e) =>
                  handleInputChange("CurrentFuel", parseInt(e.target.value))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Kilométrage d'achat</Label>
              <Input
                type="number"
                value={editedVehicle.KmsBuy || ""}
                onChange={(e) =>
                  handleInputChange("KmsBuy", parseInt(e.target.value))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Date de dernier mouvement</Label>
              <Input
                type="date"
                value={editedVehicle.DateLastMvt?.split("T")[0] || ""}
                onChange={(e) =>
                  handleInputChange("DateLastMvt", e.target.value)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de carburant</Label>
              <Select
                value={editedVehicle.FuelType ? editedVehicle.FuelType : "none"}
                onValueChange={(value) => handleInputChange("FuelType", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value="none">Aucun</SelectItem>
                  {lockups.fuels &&
                    lockups.fuels.map((fuel) => (
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
                value={
                  editedVehicle.StatusID
                    ? editedVehicle.StatusID.toString()
                    : "none"
                }
                onValueChange={(value) =>
                  handleInputChange(
                    "StatusID",
                    value === "none" ? null : parseInt(value)
                  )
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value="none">Aucun</SelectItem>
                  {lockups.statuses?.map((status) => (
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
                value={editedVehicle.PurchaseDate?.split("T")[0] || ""}
                onChange={(e) =>
                  handleInputChange("PurchaseDate", e.target.value)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix HT</Label>
                <Input
                  type="number"
                  value={editedVehicle.PurchaseHT || ""}
                  onChange={(e) =>
                    handleInputChange("PurchaseHT", parseFloat(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxe</Label>
                <Select
                  value={
                    editedVehicle.PurchaseTax
                      ? editedVehicle.PurchaseTax?.toString()
                      : "none"
                  }
                  onValueChange={(value) =>
                    handleInputChange("PurchaseTax", parseInt(value))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taxe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={"none"} value="none">Aucun</SelectItem>
                    {lockups.taxes &&
                      lockups.taxes.map((tax) => (
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
                  value={editedVehicle.PurchaseTVA?.toFixed(2) || ""}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <Input
                  type="number"
                  value={editedVehicle.PurchaseTTC?.toFixed(2) || ""}
                  disabled={true}
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
                value={editedVehicle.SalesDate?.split("T")[0] || ""}
                onChange={(e) => handleInputChange("SalesDate", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix HT</Label>
                <Input
                  type="number"
                  value={editedVehicle.SalesHT || ""}
                  onChange={(e) =>
                    handleInputChange("SalesHT", parseFloat(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxe</Label>
                <Select
                  value={
                    editedVehicle.SalesTax
                      ? editedVehicle.SalesTax.toString()
                      : "none"
                  }
                  onValueChange={(value) =>
                    handleInputChange("SalesTax", parseInt(value))
                  }
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Taxe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={"none"} value="none">Aucun</SelectItem>
                    {lockups.taxes &&
                      lockups.taxes.map((tax) => (
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
                  value={editedVehicle.SalesTVA?.toFixed(2) || ""}
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label>Total TTC</Label>
                <Input
                  type="number"
                  value={editedVehicle.SalesTTC?.toFixed(2) || ""}
                  disabled={true}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Input
                type="number"
                value={editedVehicle.SalesClient || ""}
                onChange={(e) =>
                  handleInputChange("SalesClient", parseInt(e.target.value))
                }
                disabled={!isEditing}
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
                value={editedVehicle.FinancingType || ""}
                onChange={(e) =>
                  handleInputChange("FinancingType", e.target.value)
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-4">
              <Label>État de blocage</Label>
              <RadioGroup
                value={editedVehicle.IsBlocked ? "1" : "0"}
                onValueChange={(value) => {
                  const isBlocked = value === "1";
                  const currentDate = isBlocked
                    ? new Date().toISOString()
                    : null;
                  setEditedVehicle((prev) => ({
                    ...prev,
                    IsBlocked: isBlocked,
                    BlockedDate: currentDate,
                  }));
                }}
                disabled={!isEditing}
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
            {editedVehicle.IsBlocked && (
              <div className="space-y-2">
                <Label>Date de blocage</Label>
                <Input
                  type="datetime-local"
                  value={editedVehicle.BlockedDate?.split(".")[0] || ""}
                  disabled={true}
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
                value={editedVehicle.RentalStation ? editedVehicle.RentalStation : "none"}
                onValueChange={(value) =>
                  handleInputChange("RentalStation", value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value="none">Aucun</SelectItem>
                  {lockups.stations &&
                    lockups.stations.map((station) => (
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
                value={editedVehicle.GroupCode ? editedVehicle.GroupCode : "none"}
                onValueChange={(value) => handleInputChange("GroupCode", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={"none"} value="none">Aucun</SelectItem>
                  {lockups.groups &&
                    lockups.groups.map((group) => (
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
              value={editedVehicle.Note || ""}
              onChange={(e) => handleInputChange("Note", e.target.value)}
              disabled={!isEditing}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
