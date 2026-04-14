import { LayoutDashboard, Upload, FileText, AlertTriangle, BookOpen, Settings, Scale } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Upload Document", url: "/dashboard/upload", icon: Upload },
  { title: "My Documents", url: "/dashboard/documents", icon: FileText },
  { title: "Risk Reports", url: "/dashboard/analytics", icon: AlertTriangle },
  { title: "Clause Library", url: "/dashboard/clauses", icon: BookOpen },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <div className="h-16 flex items-center px-4 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-primary shrink-0" />
          {!collapsed && <span className="text-lg font-bold">LexaAI</span>}
        </Link>
      </div>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-secondary/60 rounded-xl transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
