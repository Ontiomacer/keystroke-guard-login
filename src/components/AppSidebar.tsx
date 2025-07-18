
import { Home, Shield, MapPin, Phone, Settings, Brain, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
      },
      {
        title: "Security Analytics",
        url: "/security",
        icon: Shield,
      },
    ],
  },
  {
    title: "Detection Services",
    items: [
      {
        title: "Location Tracking",
        url: "/location",
        icon: MapPin,
      },
      {
        title: "Phone Verification",
        url: "/phone",
        icon: Phone,
      },
      {
        title: "ML Risk Analysis",
        url: "/ml-dashboard",
        icon: Brain,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Admin Panel",
        url: "/admin",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
