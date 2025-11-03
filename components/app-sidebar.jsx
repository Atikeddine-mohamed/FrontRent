"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Car,
  Command,
  FileUser,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  MapPinHouse,
  NotepadText,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
  },
  fleetManagment: [
    {
      title: "Flotte",
      url: "#",
      icon: Car,
      isActive: true,
      items: [
        {
          title: "Véhicules",
          url: "/manage-vehicles",
        },
        {
          title: "Marques",
          url: "/brands",
        },
        {
          title: "Modèles",
          url: "/models",
        },
        {
          title: "Groupes",
          url: "#",
        },
        {
          title: "Caractéristiques",
          url: "#",
        },
      ],
    },
    {
      title: "Agences",
      url: "#",
      icon: MapPinHouse,
      items: [
        {
          title: "Gestion des agences",
          url: "#",
        },
        {
          title: "Zones",
          url: "#",
        },
        {
          title: "Types d'agences",
          url: "#",
        },
      ],
    },
  ],
  rentCar: [
    {
      title: "Reservations",
      url: "#",
      icon: NotepadText,
      items: [
        {
          title: "Gestion des reservations",
          url: "#",
        },
        {
          title: "Example",
          url: "#",
        },
        {
          title: "Example",
          url: "#",
        },
        {
          title: "Etc",
          url: "#",
        },
      ],
    },
    {
      title: "Contrats",
      url: "#",
      icon: FileUser,
      items: [
        {
          title: "Gestion des contrats",
          url: "#",
        },
        {
          title: "Example",
          url: "#",
        },
        {
          title: "Example",
          url: "#",
        },
        {
          title: "Etc",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-blue-100"
            >
              <Link href="/">
                <LayoutDashboard className="!size-5 text-blue-500 " />
                <span className="text-base font-semibold text-blue-500">Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.fleetManagment} title={"Gestion de flotte"} />
        <NavMain items={data.rentCar} title={"Location de voiture"} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
