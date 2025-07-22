// src/components/dashboard/main/DashboardCalendar.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar'; // Assuming you have this component
//import { addMonths, format } from 'date-fns';

const DashboardCalendar: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="shadow-sm bg-white h-full flex flex-col"> {/* Added bg-white and flex-col for better layout */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-700">Current Pay Period</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border p-2"
          initialFocus
          captionLayout="dropdown"
          fromYear={2020}
          toYear={new Date().getFullYear() + 2}
          // You can add styles here to make it more like Screenshot (46)
          // e.g., weekNumberLabel="Week" showOutsideDays={false}
          // classNames={{
          //   months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          //   month: "space-y-4",
          //   caption: "flex justify-center pt-1 relative items-center",
          //   caption_label: "text-sm font-medium",
          //   nav: "space-x-1 flex items-center",
          //   nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          //   nav_button_previous: "absolute left-1",
          //   nav_button_next: "absolute right-1",
          //   table: "w-full border-collapse space-y-1",
          //   head_row: "flex",
          //   head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
          //   row: "flex w-full mt-2",
          //   cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          //   day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          //   day_range_end: "day-range-end",
          //   day_selected: "bg-[#7F5EFD] text-white hover:bg-[#7F5EFD] hover:text-white focus:bg-[#7F5EFD] focus:text-white",
          //   day_today: "bg-accent text-accent-foreground",
          //   day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          //   day_disabled: "text-muted-foreground opacity-50",
          //   day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          //   day_hidden: "invisible",
          //   caption_dropdowns: "flex gap-1",
          //   dropdown: "rdp-dropdown bg-card border-none shadow-sm",
          //   dropdown_month: "rdp-dropdown_month",
          //   dropdown_year: "rdp-dropdown_year",
          //   button: "rdp-button",
          //   button_reset: "rdp-button_reset",
          // }}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">Next payroll run due: </p>
          {/* Future: Display days left dynamically */}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;