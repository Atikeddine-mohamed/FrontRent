"use client";

import { useEffect, useState, useRef } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { frenchLocale } from "@/lib/ag-grid-locales";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function BrandsPage() {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [colDefs] = useState([
    {
      field: "Brand",
      headerName: "Marque",
      flex: 1,
      sortable: true,
      filter: true,
      floatingFilter: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      maxWidth: 150,
      minWidth: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleEdit(params.data.Brand)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700"
            onClick={() => handleDeleteClick(params.data.Brand)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands`);
      if (!response.ok) throw new Error("Failed to fetch brands");
      const data = await response.json();
      setRowData(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      setErrorMessage("Error fetching brands. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setBrandName(brand);
    setIsEditing(true);
  };

  const handleDeleteClick = (brand) => {
    setSelectedBrand(brand);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/brands/${selectedBrand}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.status === 400) {
        setErrorMessage(data.message);
        setShowErrorDialog(true);
      } else if (!response.ok) {
        throw new Error(data.message);
      } else {
        await fetchBrands();
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
      setErrorMessage("Error deleting brand. Please try again.");
      setShowErrorDialog(true);
    } finally {
      setShowDeleteDialog(false);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!brandName.trim()) {
      setErrorMessage("Le nom de la marque ne peut pas être vide");
      setShowErrorDialog(true);
      return;
    }

    try {
      setLoading(true);
      const url = `${process.env.NEXT_PUBLIC_API_URL}/brands`;
      const method = isCreating ? "POST" : "PUT";
      const body = isCreating
        ? { brand: brandName }
        : { oldBrand: selectedBrand, newBrand: brandName };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      await fetchBrands();
      resetForm();
    } catch (error) {
      console.error("Error submitting brand:", error);
      setErrorMessage(
        `Error ${isEditing ? "updating" : "creating"} brand. Please try again.`
      );
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
      setIsCreating(false);
      setIsEditing(false);
    }
  };

  const resetForm = () => {
    setBrandName("");
    setSelectedBrand(null);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsEditing(true);
    setIsCreating(true);
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
    <div className="flex flex-col justify-around items-center lg:flex-row gap-6 p-6">
      {/* Table Section */}
      <Card className="w-full lg:w-[700px]">
        <CardHeader>
          <CardTitle>Gestion des Marques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] ag-theme-alpine">
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={colDefs}
              defaultColDef={{
                flex: 1,
                minWidth: 100,
                sortable: true,
                filter: true,
                resizable: true,
              }}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[15, 30, 50]}
              localeText={frenchLocale}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Section */}
      <div className="w-full lg:w-96">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing
                ? selectedBrand
                  ? "Modifier la marque"
                  : "Nouvelle marque"
                : "Ajouter une marque"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nom de la marque"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={!isEditing}
            />
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit}>
                    <Save className="h-4 w-4 mr-2" />
                    Valider
                  </Button>
                </>
              ) : (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette marque ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Erreur</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
