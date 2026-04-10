// components/search/GlobalSearch.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, User, FileText, CreditCard, Building2, Briefcase, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { searchService, SearchResult } from "@/services/searchService";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

const getTypeIcon = (type: string, icon?: string, avatar?: string) => {
  if (avatar) {
    return (
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-[#7F5EFD]/10 text-[#7F5EFD] text-sm">
          {avatar}
        </AvatarFallback>
      </Avatar>
    );
  }
  
  if (icon) return <span className="text-lg">{icon}</span>;
  
  switch (type) {
    case "employee": return <User className="h-4 w-4 text-slate-400" />;
    case "payroll": return <CreditCard className="h-4 w-4 text-slate-400" />;
    case "report": return <FileText className="h-4 w-4 text-slate-400" />;
    case "department": return <Building2 className="h-4 w-4 text-slate-400" />;
    case "jobTitle": return <Briefcase className="h-4 w-4 text-slate-400" />;
    default: return <Search className="h-4 w-4 text-slate-400" />;
  }
};

const getBadgeColorClass = (color: string) => {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    red: "bg-red-100 text-red-700 border-red-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return colors[color] || colors.gray;
};

export default function GlobalSearch({ isOpen, onClose, onSearch }: GlobalSearchProps) {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    employees: SearchResult[];
    payrollRuns: SearchResult[];
    reports: SearchResult[];
    departments: SearchResult[];
    jobTitles: SearchResult[];
  }>({
    employees: [],
    payrollRuns: [],
    reports: [],
    departments: [],
    jobTitles: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Flatten results for keyboard navigation
  const flatResults = [
    ...results.employees.map(r => ({ ...r, section: "Employees" })),
    ...results.payrollRuns.map(r => ({ ...r, section: "Payroll Runs" })),
    ...results.reports.map(r => ({ ...r, section: "Reports" })),
    ...results.departments.map(r => ({ ...r, section: "Departments" })),
    ...results.jobTitles.map(r => ({ ...r, section: "Job Titles" })),
  ];

  const hasResults = flatResults.length > 0;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults({
        employees: [],
        payrollRuns: [],
        reports: [],
        departments: [],
        jobTitles: [],
      });
      setSelectedIndex(-1);
      searchService.cancel(); // Cancel any pending searches
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (!query || query.length < 2 || !companyId) {
      setResults({
        employees: [],
        payrollRuns: [],
        reports: [],
        departments: [],
        jobTitles: [],
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    searchService.debouncedSearch(companyId, query, (searchResults) => {
      if (searchResults) {
        setResults(searchResults);
      }
      setIsLoading(false);
    }, 300);

    return () => {
      searchService.cancel();
    };
  }, [query, companyId, isOpen]);

  const handleSelect = useCallback((result: SearchResult) => {
    if (onSearch) onSearch(query);
    navigate(result.url);
    onClose();
  }, [navigate, onClose, query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < flatResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex]);
        } else if (flatResults.length > 0) {
          handleSelect(flatResults[0]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const renderResultSection = (title: string, items: SearchResult[]) => {
    if (items.length === 0) return null;
    
    return (
      <div key={title} className="mb-4">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const globalIdx = flatResults.findIndex(r => r.id === item.id && r.type === item.type);
            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-3",
                  selectedIndex === globalIdx
                    ? "bg-[#7F5EFD]/10 ring-1 ring-[#7F5EFD]/30"
                    : "hover:bg-slate-50"
                )}
              >
                <div className="shrink-0 mt-0.5">
                  {getTypeIcon(item.type, item.icon, item.avatar)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        getBadgeColorClass(item.badgeColor)
                      )}
                    >
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>
                <kbd className="hidden sm:inline-flex text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  ↵
                </kbd>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center border-b border-slate-200 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search employees, payroll runs, reports... (e.g., 'John', 'Feb 2026', 'EMP-001')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base shadow-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Search Results */}
        <div 
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto p-3"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-[#7F5EFD] animate-spin" />
            </div>
          ) : query.length >= 2 ? (
            hasResults ? (
              <>
                {renderResultSection("Employees", results.employees)}
                {renderResultSection("Payroll Runs", results.payrollRuns)}
                {renderResultSection("Reports", results.reports)}
                {renderResultSection("Departments", results.departments)}
                {renderResultSection("Job Titles", results.jobTitles)}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No results found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by employee name, number, or month/year
                </p>
              </div>
            )
          ) : query.length === 1 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">Type at least 2 characters to search</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Search for anything</p>
              <p className="text-xs text-slate-400 mt-1">
                Employees • Payroll Runs • Reports • Departments
              </p>
              <div className="flex justify-center gap-3 mt-4 text-xs text-slate-400">
                <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">K</kbd></span>
                <span>to search anytime</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        {hasResults && !isLoading && (
          <div className="border-t border-slate-100 px-4 py-2 flex justify-between items-center text-xs text-slate-400">
            <div className="flex gap-3">
              <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↓</kbd> to navigate</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd> to select</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">ESC</kbd> to close</span>
            </div>
            <span>{flatResults.length} result{flatResults.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}