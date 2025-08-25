// src/components/settings/TeamSettingsSection.tsx

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { toast } from 'sonner';

export default function TeamSettingsSection() {
  const { user } = useAuthStore();

  const handleInviteClick = () => {
    toast.info("Coming soon!", {
      description: "Team invite functionality is not yet available.",
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <Button onClick={handleInviteClick} className="cursor-pointer bg-[#7F5EFD]">
          Invite Member
        </Button>
      </div>

      <div className="bg-white border rounded-md shadow overflow-hidden p-2">
        <Table >
          <TableHeader >
            <TableRow className="font-extrabold">
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user && (
              <TableRow>
                <TableCell className="font-medium flex items-center">
                  {/* The "you" badge */}
                  {user.user_metadata.user_name || "Owner"}
                  <Badge variant="secondary" className="ml-2">You</Badge>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell className="text-right">
                  {/* The disabled action dots */}
                  <div className="relative inline-block text-left opacity-50 cursor-not-allowed">
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                      <span className="sr-only">Open menu</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}