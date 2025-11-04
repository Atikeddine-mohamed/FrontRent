"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, X, Save, Loader2, Car, ServerCog } from "lucide-react";
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
import { Label } from "@/components/ui/label";

export default function CreateModelPage() {
  const router = useRouter();
  const [newModel, setNewModel] = useState({
    Brand: "",
    Model: "",
    Version: "",
    GroupCode: "",
    FuelType: "",
    FuelCapacity: "",
    BatteryCapacityKWh: "",
    Cylinder: "",
    Seats: "",
    Doors: "",
    Weight: "",
    CategoryID: "",
    SegmentID: "",
    PowerCV: "",
    PowerKW: "",
    TypeMotor: "",
    CO2: "",
    BoiteVitesse: "",
    FiscalPower: "",
    NrTyres: "",
    MaxSpeed: "",
    Tyres: "",
    Tax: "",
    BasePrice: "",
    TVA: "",
    TTC: "",
    Note: "",
  });
  const [lockups, setLockups] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorBackend, setErrorBackend] = useState(null);

  useEffect(() => {
    fetchLockups();
  }, []);

  // Calculate TVA and TTC when BasePrice or Tax changes
  useEffect(() => {
    if (newModel.BasePrice && newModel.Tax && lockups?.taxes) {
      const taxValue =
        lockups.taxes.find(
          (t) => t.TaxID.toString() === newModel.Tax.toString()
        )?.TaxValue || 0;

      const basePrice = parseFloat(newModel.BasePrice);
      const tva = basePrice * (taxValue / 100);
      const ttc = basePrice + tva;

      setNewModel((prev) => ({
        ...prev,
        TVA: tva.toFixed(2),
        TTC: ttc.toFixed(2),
      }));
    }
  }, [newModel.BasePrice, newModel.Tax, lockups?.taxes]);

  const fetchLockups = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/models/lockups`
      );
      if (response.status == 404) {
        let message = `Erreur lors du chargement des données de référence (code : ${response.status})`;
        setErrorBackend({ message: message, notFound: true, internal: false });
      } else if (!response.ok) {
        let message = `Erreur lors du chargement des données de référence (code : ${response.status})`;
        setErrorBackend({ message: message, notFound: false, internal: true });
      }
      const data = await response.json();
      setLockups(data);
    } catch (error) {
      console.error("Error fetching lookups:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateModel = () => {
    const newErrors = {};

    if (!newModel.Brand?.trim()) {
      newErrors.Brand = "La marque est requise";
    }

    if (!newModel.Model?.trim()) {
      newErrors.Model = "Le modèle est requis";
    }

    if (!newModel.Version?.trim()) {
      newErrors.Version = "La version est requise";
    }

    // Numeric validations
    if (newModel.FuelCapacity && parseFloat(newModel.FuelCapacity) < 0) {
      newErrors.FuelCapacity = "La capacité ne peut pas être négative";
    }

    if (
      newModel.BatteryCapacityKWh &&
      parseFloat(newModel.BatteryCapacityKWh) < 0
    ) {
      newErrors.BatteryCapacityKWh = "La capacité ne peut pas être négative";
    }

    if (newModel.BasePrice && parseFloat(newModel.BasePrice) < 0) {
      newErrors.BasePrice = "Le prix ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    setNewModel((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!validateModel()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/models`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newModel),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        let message = `Erreur lors de la création du modèle (code : ${response.status})`;
        setErrorBackend({ message: message, notFound: false, internal: true });
      }

      router.push("/models");
    } catch (error) {
      console.error("Error creating model:", error);
    } finally {
      setLoading(false);
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

  if (errorBackend?.notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">
            Modèle non trouvé
          </h2>
          <p className="text-lg text-muted-foreground">
            {errorBackend.message}
          </p>
        </div>
        <Button onClick={() => router.push("/models")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (errorBackend?.internal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <ServerCog className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">
            Erreur de chargement du modèle
          </h2>
          <p className="text-lg text-muted-foreground">
            {errorBackend.message}
          </p>
        </div>
        <Button onClick={() => router.push("/models")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
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
            onClick={() => router.push("/models")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Créer un modèle</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/models")}
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
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>
                Marque<span className="text-red-500">*</span>
              </Label>
              <Select
                value={newModel.Brand}
                onValueChange={(value) => handleInputChange("Brand", value)}
              >
                <SelectTrigger
                  className={
                    errors.Brand
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Sélectionner une marque" />
                </SelectTrigger>
                <SelectContent>
                  {lockups?.brands.map((brand) => (
                    <SelectItem key={brand.Brand} value={brand.Brand}>
                      {brand.Brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.Brand && (
                <p className="text-red-500 text-sm">{errors.Brand}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Modèle<span className="text-red-500">*</span>
              </Label>
              <Input
                value={newModel.Model}
                onChange={(e) => handleInputChange("Model", e.target.value)}
                className={
                  errors.Model
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.Model && (
                <p className="text-red-500 text-sm">{errors.Model}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Version<span className="text-red-500">*</span>
              </Label>
              <Input
                value={newModel.Version}
                onChange={(e) => handleInputChange("Version", e.target.value)}
                className={
                  errors.Version
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.Version && (
                <p className="text-red-500 text-sm">{errors.Version}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Groupe</Label>
              <Select
                value={newModel.GroupCode}
                onValueChange={(value) => handleInputChange("GroupCode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {lockups?.groups.map((group) => (
                    <SelectItem key={group.GroupCode} value={group.GroupCode}>
                      {group.GroupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de carburant</Label>
                <Select
                  value={newModel.FuelType}
                  onValueChange={(value) =>
                    handleInputChange("FuelType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {lockups?.fuels.map((fuel) => (
                      <SelectItem key={fuel.FuelCode} value={fuel.FuelCode}>
                        {fuel.FuelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Capacité carburant (L)</Label>
                <Input
                  type="number"
                  value={newModel.FuelCapacity}
                  onChange={(e) =>
                    handleInputChange("FuelCapacity", e.target.value)
                  }
                  className={
                    errors.FuelCapacity
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.FuelCapacity && (
                  <p className="text-red-500 text-sm">{errors.FuelCapacity}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacité batterie (kWh)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newModel.BatteryCapacityKWh}
                  onChange={(e) =>
                    handleInputChange("BatteryCapacityKWh", e.target.value)
                  }
                  className={
                    errors.BatteryCapacityKWh
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.BatteryCapacityKWh && (
                  <p className="text-red-500 text-sm">
                    {errors.BatteryCapacityKWh}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Cylindrée</Label>
                <Input
                  type="number"
                  value={newModel.Cylinder}
                  onChange={(e) =>
                    handleInputChange("Cylinder", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sièges</Label>
                <Input
                  type="number"
                  value={newModel.Seats}
                  onChange={(e) => handleInputChange("Seats", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Portes</Label>
                <Input
                  type="number"
                  value={newModel.Doors}
                  onChange={(e) => handleInputChange("Doors", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Poids (kg)</Label>
                <Input
                  type="number"
                  value={newModel.Weight}
                  onChange={(e) => handleInputChange("Weight", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performances */}
        <Card>
          <CardHeader>
            <CardTitle>Performances</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puissance (CV)</Label>
                <Input
                  type="number"
                  value={newModel.PowerCV}
                  onChange={(e) => handleInputChange("PowerCV", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Puissance (kW)</Label>
                <Input
                  type="number"
                  value={newModel.PowerKW}
                  onChange={(e) => handleInputChange("PowerKW", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vitesse max (km/h)</Label>
                <Input
                  type="number"
                  value={newModel.MaxSpeed}
                  onChange={(e) =>
                    handleInputChange("MaxSpeed", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>CO2 (g/km)</Label>
                <Input
                  type="number"
                  value={newModel.CO2}
                  onChange={(e) => handleInputChange("CO2", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type moteur</Label>
              <Input
                value={newModel.TypeMotor}
                onChange={(e) => handleInputChange("TypeMotor", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boîte de vitesses</Label>
                <Input
                  value={newModel.BoiteVitesse}
                  onChange={(e) =>
                    handleInputChange("BoiteVitesse", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Puissance fiscale</Label>
                <Input
                  type="number"
                  value={newModel.FiscalPower}
                  onChange={(e) =>
                    handleInputChange("FiscalPower", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de pneus</Label>
                <Input
                  type="number"
                  value={newModel.NrTyres}
                  onChange={(e) => handleInputChange("NrTyres", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de pneus</Label>
                <Select
                  value={newModel.Tyres?.toString()}
                  onValueChange={(value) => handleInputChange("Tyres", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de pneus" />
                  </SelectTrigger>
                  <SelectContent>
                    {lockups?.tyres.map((type) => (
                      <SelectItem
                        key={type.TypeID}
                        value={type.TypeID.toString()}
                      >
                        {type.TypeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Catégorie et Segment */}
        <Card>
          <CardHeader>
            <CardTitle>Catégorie et Segment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={newModel.CategoryID?.toString()}
                onValueChange={(value) =>
                  handleInputChange("CategoryID", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {lockups?.categories.map((category) => (
                    <SelectItem
                      key={category.CategoryID}
                      value={category.CategoryID.toString()}
                    >
                      {category.Category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Segment</Label>
              <Select
                value={newModel.SegmentID?.toString()}
                onValueChange={(value) => handleInputChange("SegmentID", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  {lockups?.segments.map((segment) => (
                    <SelectItem
                      key={segment.SegmentID}
                      value={segment.SegmentID.toString()}
                    >
                      {segment.Segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Fiscalité et Tarifs */}
        <Card>
          <CardHeader>
            <CardTitle>Fiscalité et Tarifs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label>Taxe</Label>
              <Select
                value={newModel.Tax?.toString()}
                onValueChange={(value) => handleInputChange("Tax", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Taxe" />
                </SelectTrigger>
                <SelectContent>
                  {lockups?.taxes.map((tax) => (
                    <SelectItem key={tax.TaxID} value={tax.TaxID.toString()}>
                      {tax.TaxValue}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix de base</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newModel.BasePrice}
                  onChange={(e) =>
                    handleInputChange("BasePrice", e.target.value)
                  }
                  className={
                    errors.BasePrice
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.BasePrice && (
                  <p className="text-red-500 text-sm">{errors.BasePrice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>TVA</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newModel.TVA}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prix TTC</Label>
              <Input type="number" step="0.01" value={newModel.TTC} disabled />
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
              value={newModel.Note}
              onChange={(e) => handleInputChange("Note", e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
