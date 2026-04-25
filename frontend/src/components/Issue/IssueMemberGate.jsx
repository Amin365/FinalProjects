import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import api from "@/app/api/apislice";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserSearch } from "lucide-react";

const IssueMemberGate = () => {
  const navigate = useNavigate();
  const [memberCode, setMemberCode] = useState("");

  const lookup = useMutation({
    mutationFn: async (code) => {
      const resp = await api.get(`/members/by-code/${encodeURIComponent(code)}`);
      return resp.data?.data ?? resp.data;
    },
    onSuccess: (member) => {

      navigate(`/dashboard/issue/new?member=${member._id}`);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        "Before requesting book you must be member the Club";
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-[calc(100vh-64px)] p-4   flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-sm py-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch size={18} /> Request a Book
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-200 mb-4">
              Please enter your MemberId
            </label>
            <Input
              className="mt-2 mb-5"
              placeholder="e.g MBR123456AB"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
            />
          </div>

          <Button
            className="w-full  dark:bg-orange-600"
            onClick={() => lookup.mutate(memberCode.trim())}
            disabled={!memberCode.trim() || lookup.isPending}
          >
            {lookup.isPending ? "Checking..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IssueMemberGate;