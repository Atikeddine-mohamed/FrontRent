"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, X, Trash2, Save, Loader2, Car } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params?.modelId;
  const [model, setModel] = useState(null);
  const [editedModel, setEditedModel] = useState(null);
  const [lockups, setLockups] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelData();
  }, [modelId]);

  const validateModel = () => {
    const newErrors = {};

    if (!editedModel.Brand?.trim()) {
      newErrors.Brand = "La marque est requise";
    }

    if (!editedModel.Model?.trim()) {
      newErrors.Model = "Le modèle est requis";
    }

    if (!editedModel.Version?.trim()) {
      newErrors.Version = "La version est requise";
    }

    // Numeric validations
    if (editedModel.FuelCapacity && editedModel.FuelCapacity < 0) {
      newErrors.FuelCapacity = "La capacité ne peut pas être négative";
    }

    if (editedModel.BatteryCapacityKWh && editedModel.BatteryCapacityKWh < 0) {
      newErrors.BatteryCapacityKWh = "La capacité ne peut pas être négative";
    }

    if (editedModel.BasePrice && editedModel.BasePrice < 0) {
      newErrors.BasePrice = "Le prix ne peut pas être négatif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchModelData = async () => {
    try {
      setLoading(true);
      const [modelResponse, lockupsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/models/${modelId}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/models/lockups`),
      ]);

      if (modelResponse.status === 404) {
        setModel({ notFound: true });
        return;
      } else if (!modelResponse.ok || !lockupsResponse.ok) {
        let message = "Il y a un problème avec le serveur.";

        if (!modelResponse.ok) {
          message = `Erreur du serveur lors du chargement du modèle (code: ${modelResponse.status})`;
        } else if (!lockupsResponse.ok) {
          message = `Erreur du serveur lors du chargement des données de référence (code: ${lockupsResponse.status})`;
        }

        setModel({ error: message, serverError: true });
        setLoading(false);
        return; // stop execution gracefully
      }

      const modelData = await modelResponse.json();
      const lockupsData = await lockupsResponse.json();

      setModel(modelData);
      setEditedModel(modelData);
      setLockups(lockupsData);
    } catch (error) {
      console.error("Error fetching model data:", error);
      setErrorMessage("Erreur lors du chargement des données");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedModel(model);
    setErrors({});
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
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedModel),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await fetchModelData();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating model:", error);
      setErrorMessage(error.message || "Erreur lors de la mise à jour");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/models/${modelId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.status === 400) {
        setShowDeleteDialog(false);
        setErrorMessage(data.message);
        setShowErrorDialog(true);
      } else if (!response.ok) {
        let message = "Il y a un problème avec le serveur.";
        setModel({ error: message, serverError: true });
        setLoading(false);
        return
      } else {
        router.push("/models");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      setErrorMessage("Erreur lors de la suppression");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const recalculatePrices = (basePrice, taxRate) => {
    const TVA = basePrice && taxRate ? (basePrice * taxRate) / 100 : 0;
    const TTC = basePrice ? basePrice + TVA : 0;
    return { TVA, TTC };
  };

  const handleInputChange = (field, value) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    setEditedModel((prev) => {
      let updated = { ...prev, [field]: value };

      // 🔄 Auto-calculate TVA & TTC
      if (field === "BasePrice" || field === "Tax") {
        const basePrice = field === "BasePrice" ? value : prev.BasePrice;
        const taxRate =
          field === "Tax"
            ? lockups?.taxes.find((t) => t.TaxID === parseInt(value))
                ?.TaxValue || 0
            : lockups?.taxes.find((t) => t.TaxID === prev.Tax)?.TaxValue || 0;

        const { TVA, TTC } = recalculatePrices(basePrice, taxRate);
        updated = { ...updated, TVA, TTC };
      }

      return updated;
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

  if (model?.notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">
            Modèle non trouvé
          </h2>
          <p className="text-lg text-muted-foreground">
            Le modèle que vous recherchez n&apos;existe pas ou a été supprimé
          </p>
        </div>
        <Button onClick={() => router.push("/models")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (model.serverError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <Car className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">
            Erreur de chargement du modèle
          </h2>
          <p className="text-lg text-muted-foreground">{model.error}</p>
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
          <h1 className="text-2xl font-bold">
            {model.Brand} {model.Model} {model.Version}
          </h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations principales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="space-y-2 w-1/2">
                <Label>ID du modèle</Label>
                <Input
                  value={editedModel.ModelID || ""}
                  disabled={true}
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Marque<span className="text-red-500">*</span>
                </Label>
                <Select
                  value={editedModel.Brand}
                  onValueChange={(value) => handleInputChange("Brand", value)}
                  disabled={!isEditing}
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
            </div>

            <div className="space-y-2">
              <Label>
                Modèle<span className="text-red-500">*</span>
              </Label>
              <Input
                value={editedModel.Model || ""}
                onChange={(e) => handleInputChange("Model", e.target.value)}
                disabled={!isEditing}
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
                value={editedModel.Version || ""}
                onChange={(e) => handleInputChange("Version", e.target.value)}
                disabled={!isEditing}
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
                value={editedModel.GroupCode || ""}
                onValueChange={(value) => handleInputChange("GroupCode", value)}
                disabled={!isEditing}
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
                  value={editedModel.FuelType || ""}
                  onValueChange={(value) =>
                    handleInputChange("FuelType", value)
                  }
                  disabled={!isEditing}
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
                  min={0}
                  value={editedModel.FuelCapacity || ""}
                  onChange={(e) =>
                    handleInputChange("FuelCapacity", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
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
                  min={0}
                  value={editedModel.BatteryCapacityKWh || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "BatteryCapacityKWh",
                      parseFloat(e.target.value)
                    )
                  }
                  disabled={!isEditing}
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
                  min={0}
                  value={editedModel.Cylinder || ""}
                  onChange={(e) =>
                    handleInputChange("Cylinder", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sièges</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.Seats || ""}
                  onChange={(e) =>
                    handleInputChange("Seats", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Portes</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.Doors || ""}
                  onChange={(e) =>
                    handleInputChange("Doors", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Poids (kg)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.Weight || ""}
                  onChange={(e) =>
                    handleInputChange("Weight", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
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
                  min={0}
                  value={editedModel.PowerCV || ""}
                  onChange={(e) =>
                    handleInputChange("PowerCV", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Puissance (kW)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.PowerKW || ""}
                  onChange={(e) =>
                    handleInputChange("PowerKW", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vitesse max (km/h)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.MaxSpeed || ""}
                  onChange={(e) =>
                    handleInputChange("MaxSpeed", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>CO2 (g/km)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.CO2 || ""}
                  onChange={(e) =>
                    handleInputChange("CO2", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type moteur</Label>
              <Input
                value={editedModel.TypeMotor || ""}
                onChange={(e) => handleInputChange("TypeMotor", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boîte de vitesses</Label>
                <Input
                  value={editedModel.BoiteVitesse || ""}
                  onChange={(e) =>
                    handleInputChange("BoiteVitesse", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Puissance fiscale</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.FiscalPower || ""}
                  onChange={(e) =>
                    handleInputChange("FiscalPower", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de pneus</Label>
                <Input
                  type="number"
                  min={0}
                  value={editedModel.NrTyres || ""}
                  onChange={(e) =>
                    handleInputChange("NrTyres", parseInt(e.target.value))
                  }
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Type de pneus</Label>
                <Select
                  value={editedModel.Tyres?.toString() || ""}
                  onValueChange={(value) =>
                    handleInputChange("Tyres", parseInt(value))
                  }
                  disabled={!isEditing}
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
                value={editedModel.CategoryID?.toString() || ""}
                onValueChange={(value) =>
                  handleInputChange("CategoryID", parseInt(value))
                }
                disabled={!isEditing}
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
                value={editedModel.SegmentID?.toString() || ""}
                onValueChange={(value) =>
                  handleInputChange("SegmentID", parseInt(value))
                }
                disabled={!isEditing}
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
                value={editedModel.Tax?.toString() || ""}
                onValueChange={(value) =>
                  handleInputChange("Tax", parseInt(value))
                }
                disabled={!isEditing}
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
                  min={0}
                  step="0.01"
                  value={editedModel.BasePrice || ""}
                  onChange={(e) =>
                    handleInputChange("BasePrice", parseFloat(e.target.value))
                  }
                  disabled={!isEditing}
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
                  min={0}
                  step="0.01"
                  value={editedModel.TVA?.toFixed(2) || ""}
                  disabled={true}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prix TTC</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={editedModel.TTC?.toFixed(2) || ""}
                onChange={(e) =>
                  handleInputChange("TTC", parseFloat(e.target.value))
                }
                disabled={!isEditing}
              />
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
              value={editedModel.Note || ""}
              onChange={(e) => handleInputChange("Note", e.target.value)}
              disabled={!isEditing}
            />
          </CardContent>
        </Card>

        {/* Historique */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Suivi et Historique</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Créé le</Label>
                <Input
                  type="datetime-local"
                  value={editedModel.CreatedAt?.split(".")[0] || ""}
                  disabled={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est
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

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
