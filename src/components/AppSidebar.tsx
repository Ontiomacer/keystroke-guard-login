
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Shield, 
  MapPin, 
  Phone, 
  Users, 
  Settings,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    description: 'Main dashboard overview'
  },
  {
    title: 'Security Analytics',
    url: '/security',
    icon: Shield,
    description: 'Security monitoring and alerts'
  },
  {
    title: 'Location Tracking',
    url: '/geolocation',
    icon: MapPin,
    description: 'Geographic location monitoring'
  },
  {
    title: 'Phone Verification',
    url: '/phone-verification',
    icon: Phone,
    description: 'Phone number validation system'
  },
  {
    title: 'Admin Panel',
    url: '/admin',
    icon: Users,
    description: 'Administrative controls'
  }
];

const securityItems = [
  {
    title: 'Risk Analytics',
    url: '/risk-analytics',
    icon: Activity,
    description: 'Risk assessment dashboard'
  },
  {
    title: 'Fraud Detection',
    url: '/fraud-detection',
    icon: AlertTriangle,
    description: 'Fraud monitoring system'
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-foreground">SecureBank</h2>
              <p className="text-xs text-muted-foreground">Security Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center space-x-2 w-full"
                      title={item.description}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Security Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center space-x-2 w-full"
                      title={item.description}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p>© 2024 SecureBank</p>
            <p>Security Platform v1.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
