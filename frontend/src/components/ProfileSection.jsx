

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutGrid, LogOutIcon, User2Icon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { setClear } from "../app/AuthSlice";
import api from "@/app/api/apislice";

const MainHeader = () => {
  const { token, user } = useSelector((state) => state.auth);
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const handlelogout = () => {
    dispatch(setClear())
    navigate('/')
  }
 

  const { data } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;

    },


    enabled: !!token, // Only run this query if token exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  // Prefer populated role from server response; fallback to stored user role
  const roleSource = data?.user?.role || user?.role;
  let roleLabel = "";
  if (roleSource && typeof roleSource === "object") {
    roleLabel = roleSource.role || roleSource.name || roleSource.title || "";
  } else if (typeof roleSource === "string") {
    roleLabel = roleSource;
  }

  // Avoid showing raw ObjectId strings; fall back to a friendly placeholder
  if (roleLabel && /^[a-f\d]{24}$/i.test(roleLabel)) {
    roleLabel = "Role";
  }
    


  return (
    <div className="flex items-center">
      {token ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer h-8 w-8">
              <AvatarImage
                src={
                  user.profile_picture
                }
                alt={user?.name}
              />
              <AvatarFallback>{user?.first_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-2">
           <DropdownMenuLabel className="p-2">
  <div className="flex items-center gap-3">
    {/* User Picture */}
    <Avatar className="h-10 w-10">
      <AvatarImage
        src={
          user?.profile_picture ||
          "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=1170&auto=format&fit=crop"
        }
        alt={user?.first_name}
      />
      <AvatarFallback>
        {user?.first_name?.charAt(0)}
      </AvatarFallback>
    </Avatar>

    {/* Name + Role */}
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {user?.first_name} {user?.last_name}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {roleLabel || "Role"}
      </span>
    </div>
  </div>
</DropdownMenuLabel>

            <DropdownMenuSeparator />

    
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2 py-1.5 text-sm">
                  <LayoutGrid className="size-4 text-green-600" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
           

            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="flex items-center gap-2 py-1.5 text-sm">
                <User2Icon className="size-4 text-gray-600" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/chats" className="flex items-center gap-2 py-1.5 text-sm">
                <User2Icon className="size-4 text-gray-600" />
                Chat
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-red-600" asChild>
              <button className="flex items-center gap-2 py-1.5 w-full text-sm" onClick={handlelogout}>
                <LogOutIcon className="size-4" />
                Log out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Link to="/login" className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-sm">
          Sign Up
        </Link>
      )}
    </div>
  );
};

export default MainHeader;
