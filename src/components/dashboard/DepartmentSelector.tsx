import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

export function DepartmentSelector() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between h-14 rounded-xl"
        >
          Select Department
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-full">
        <Command>
          <CommandList>
            <CommandItem>Finance</CommandItem>
            <CommandItem>Human Resources</CommandItem>
            <CommandItem>Engineering</CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
