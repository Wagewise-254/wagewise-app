import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Search, FileText, X, Loader2, Users, Calendar } from "lucide-react";
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

type SearchCategory = "all" | "employees" | "payroll" | "reports";

const categoryConfig = {
  all: { label: "All", icon: Search },
  employees: { label: "Employees", icon: Users },
  payroll: { label: "Payroll Runs", icon: Calendar },
  reports: { label: "Reports", icon: FileText },
};

const getBadgeColorClass = (color: string) => {
  const colors: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return colors[color] || colors.gray;
};

export default function GlobalSearch({ isOpen, onClose, onSearch }: GlobalSearchProps) {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const [results, setResults] = useState<{
    employees: SearchResult[];
    payrollRuns: SearchResult[];
    reports: SearchResult[];
  }>({
    employees: [],
    payrollRuns: [],
    reports: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten results based on category
  const flatResults = React.useMemo(() => {
    const all = [];
    if (category === "all" || category === "employees") {
      all.push(...results.employees.map(r => ({ ...r, section: "Employees" })));
    }
    if (category === "all" || category === "payroll") {
      all.push(...results.payrollRuns.map(r => ({ ...r, section: "Payroll Runs" })));
    }
    if (category === "all" || category === "reports") {
      all.push(...results.reports.map(r => ({ ...r, section: "Reports" })));
    }
    return all;
  }, [results, category]);

  const hasResults = flatResults.length > 0;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults({ employees: [], payrollRuns: [], reports: [] });
      setCategory("all");
      searchService.cancel();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (!query || query.length < 2 || !companyId) {
      setResults({ employees: [], payrollRuns: [], reports: [] });
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

  const totalResults = results.employees.length + results.payrollRuns.length + results.reports.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-lg border-slate-200 shadow-lg">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        
        {/* Search Input */}
        <div className="flex items-center px-5 py-4">
          <Search className="h-4 w-4 text-slate-400 mr-3 shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search employees, payroll runs, reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm shadow-none placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Category Tabs - Minimalist with border-bottom active state */}
        <div className="flex gap-0 px-5 border-b border-slate-100">
          {(Object.entries(categoryConfig) as [SearchCategory, typeof categoryConfig.all][]).map(([key, config]) => {
            const isActive = category === key;
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={cn(
                  "flex items-center gap-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-all relative",
                  isActive
                    ? "text-[#7F5EFD]"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {config.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7F5EFD] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search Results */}
        <div className="max-h-[55vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-5 w-5 text-[#7F5EFD] animate-spin" />
            </div>
          ) : query.length >= 2 ? (
            hasResults ? (
              <div className="divide-y divide-slate-50">
                {flatResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-5 py-3 transition-colors hover:bg-slate-50 flex items-center gap-3"
                  >
                    {item.type === "employee" ? (
                      <Avatar className="h-8 w-8 bg-[#7F5EFD]/10 shrink-0">
                        <AvatarFallback className="text-[#7F5EFD] text-xs font-medium">
                          {item.avatar || item.title.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                        {item.type === "payroll" ? (
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900">
                          {item.title}
                        </span>
                        {item.type === "employee" && (
                          <span className="text-xs text-slate-400 font-mono">
                            {item.subtitle}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", getBadgeColorClass(item.badgeColor))}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.type !== "employee" && (
                          <span className="text-xs text-slate-500 font-mono">
                            {item.subtitle}
                          </span>
                        )}
                        {item.extra && (
                          <span className="text-xs text-slate-400">{item.extra}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No results found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try searching by name, employee number, or month/year
                </p>
              </div>
            )
          ) : query.length === 1 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-400">Type at least 2 characters to search</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Search for anything</p>
              <p className="text-xs text-slate-400 mt-1">
                Employees • Payroll Runs • Reports
              </p>
            </div>
          )}
        </div>

        {/* Footer - Simple result count */}
        {hasResults && !isLoading && query.length >= 2 && (
          <div className="border-t border-slate-100 px-5 py-2.5 flex justify-end">
            <span className="text-xs text-slate-400">
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}