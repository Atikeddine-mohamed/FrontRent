"use client";
import React, { useEffect, useState, useRef } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Eye, FunnelX, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { frenchLocale } from "@/lib/ag-grid-locales";

// Register all Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export default function page() {
  const router = useRouter();
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colDefs, setColDefs] = useState([
    // Action Column
    {
      field: "actions",
      headerName: "",
      sortable: false,
      filter: false,
      width: 60,
      minWidth: 60,
      maxWidth: 60,
      floatingFilter: false,
      pinned: "left",
      cellClass: "flex items-center justify-center cursor-pointer",
      onCellClicked: (params) =>
        router.push(`/manage-vehicles/${params.data.UnitNr}`),
      cellRenderer: () =>
        React.createElement(Eye, {
          className: "w-4 h-4 text-muted-foreground",
        }),
    },
    // Backend-provided columns
    {
      field: "UnitNr",
      headerName: "Numéro d'Unité",
      sortable: true,
      filter: true,
      width: 110,
    },
    {
      field: "PlateNr",
      headerName: "Numéro d'Immatriculation",
      sortable: true,
      filter: true,
      width: 130,
    },
    {
      field: "Brand",
      headerName: "Marque",
      sortable: true,
      filter: true,
    },
    {
      field: "Model",
      headerName: "Modèle",
      sortable: true,
      filter: true,
    },
    {
      field: "Version",
      headerName: "Version",
      sortable: true,
      filter: true,
    },
    {
      field: "ChassiNr",
      headerName: "Numéro de Châssis",
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: "GroupCode",
      headerName: "Code Groupe",
      sortable: true,
      filter: true,
    },
  ]);

  const clearFilters = () => {
    gridRef.current.api.setFilterModel(null);
  };

  useEffect((_) => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/manage_vehicles"
        );
        const data = await response.json();
        setRowData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 50,
    paginationPageSizeSelector: [10, 25, 50, 100],
    animateRows: true,
    enableCellTextSelection: true,
    copyHeadersToClipboard: true,
    suppressCopyRowsToClipboard: false,
    localeText: frenchLocale,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex justify-between items-center">
        <h2 className="mt-10 scroll-m-20 pb-2 ml-2 text-3xl text-muted-foreground  font-semibold tracking-tight transition-colors first:mt-0">
          Gestion des Véhicules
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>
            <FunnelX className="w-4 h-4 mr-2" />
            <span>Effacer les filtres</span>
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/manage-vehicles/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Nouveau</span>
          </Button>
        </div>
      </div>

      <div className="w-full h-[80vh]">
        <AgGridReact
          ref={gridRef}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          rowData={rowData}
          {...gridOptions}
          rowSelection="multiple"
          animateRows={true}
        />
      </div>
    </div>
  );
}
