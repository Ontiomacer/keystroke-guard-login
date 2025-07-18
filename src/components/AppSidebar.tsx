import React from "react";
import {
  LayoutDashboard,
  Shield,
  MapPin,
  Phone,
  TrendingUp,
  AlertTriangle,
  Brain,
  Settings,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const { isOpen, onOpen, onClose } = useSidebar();

  const menuItems = [
    {
      title: "Main",
      items: [
        { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { name: "Security Analytics", url: "/security", icon: Shield },
        { name: "Location Tracking", url: "/geolocation", icon: MapPin },
        { name: "Phone Verification", url: "/phone-verification", icon: Phone },
      ]
    },
    {
      title: "AI & Risk Management",
      items: [
        { name: "Risk Analytics", url: "/risk-analytics", icon: TrendingUp },
        { name: "Fraud Detection", url: "/fraud-detection", icon: AlertTriangle },
        { name: "ML Model Dashboard", url: "/ml-admin", icon: Brain },
      ]
    },
    {
      title: "Administration",
      items: [
        { name: "Admin Panel", url: "/admin", icon: Settings },
      ]
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onOpen}>
          <LayoutDashboard className="h-[1.2rem] w-[1.2rem] rotate-0 sm:rotate-0" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 pt-0 w-[280px]">
        <div className="h-full pb-4">
          <div className="flex px-4 py-6">
            Security Dashboard
          </div>
          <Separator className="mx-4" />
          <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-1">
            <div className="mt-2 space-y-1">
              {menuItems.map((section, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm font-semibold text-foreground px-2">{section.title}</div>
                  {section.items.map((item, itemIndex) => (
                    <Link to={item.url} key={itemIndex}>
                      <Button variant="ghost" className="justify-start gap-2 w-full hover:bg-secondary">
                        <item.icon className="h-[1.2rem] w-[1.2rem]" />
                        <span>{item.name}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
