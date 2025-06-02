// src/pages/dashboard/tax/TaxPage.tsx

import React, { useState, useEffect } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { API_BASE_URL } from '@/config'; // Your API base URL
import useAuthStore from '@/store/authStore'; // For token if endpoint is protected
import { Loader2 } from 'lucide-react';

// Define interfaces for the fetched parameters
interface PayeBracket { limit: number | string; rate: number; }
interface PayeParameters {
    PERSONAL_RELIEF: number;
    INSURANCE_RELIEF_MAX: number;
    PENSION_CONTRIBUTION_LIMIT: number;
    OWNER_OCCUPIER_INTEREST_LIMIT: number;
    DISABILITY_EXEMPTION: number;
}
interface CalculationParams {
    PAYE_BRACKETS: PayeBracket[];
    PAYE_PARAMETERS: PayeParameters;
    SHIF_RATE: number;
    HOUSING_LEVY_RATE: number;
    NSSF_TIER_1_LIMIT_PRE_FEB2025: number;
    NSSF_TIER_2_UPPER_LIMIT_PRE_FEB2025: number;
    NSSF_RATE: number;
}

type TaxTab = 'overview' | 'paye' | 'statutoryDeductions' | 'otherItems';

const CardContainer = ({ children, title }: { children: React.ReactNode; title: string }) => ( /* ... same as before ... */ 
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">{title}</h2>
        {children}
    </div>
);

type RateTableColumn<T> = { header: string; accessor: keyof T };

const RateTable = <T extends Record<string, unknown>>({
    title,
    data,
    columns,
}: {
    title?: string;
    data: T[];
    columns: RateTableColumn<T>[];
}) => (
    <div className="mb-6">
        {title && <h3 className="text-md font-semibold text-gray-600 mb-2">{title}</h3>}
        <div className="overflow-x-auto rounded border">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th key={String(col.accessor)} scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm text-gray-700">
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((col) => {
                                const value = row[col.accessor];
                                return (
                                    <td key={String(col.accessor)} className="px-4 py-2.5 whitespace-nowrap">
                                        {typeof value === 'number' && (String(col.accessor).includes('limit') || String(col.accessor).includes('relief') || String(col.accessor).includes('max') || String(col.accessor).includes('LIMIT'))
                                            ? value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                            : (String(col.accessor).includes('rate') || String(col.accessor).includes('RATE')) ? `${(value as number * 100).toFixed(1)}%` : String(value)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const TaxPage = () => {
    const [currentTaxTab, setCurrentTaxTab] = useState<TaxTab>('overview');
    const [calcParams, setCalcParams] = useState<CalculationParams | null>(null);
    const [loadingParams, setLoadingParams] = useState(true);
    const [errorParams, setErrorParams] = useState<string | null>(null);
    const { accessToken } = useAuthStore();

    useEffect(() => {
        const fetchCalcParams = async () => {
            if (!accessToken) {
                setErrorParams("Authentication required to fetch calculation parameters.");
                setLoadingParams(false);
                return;
            }
            setLoadingParams(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/payroll/config/calculation-parameters`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setCalcParams(response.data);
                setErrorParams(null);
            } catch (err) {
                console.error("Error fetching calculation parameters:", err);
                setErrorParams("Could not load calculation parameters. Please try again later.");
            } finally {
                setLoadingParams(false);
            }
        };
        fetchCalcParams();
    }, [accessToken]);

    const renderTabContent = () => {
        if (loadingParams) {
            return (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-[#7F5EFD]" />
                    <span className="ml-2">Loading calculation info...</span>
                </div>
            );
        }
        if (errorParams || !calcParams) {
            return (
                <CardContainer title="Error">
                    <p className="text-red-600">{errorParams || "Calculation parameters are currently unavailable."}</p>
                </CardContainer>
            );
        }

        switch (currentTaxTab) {
            case 'overview':
                return ( /* ... same as before ... */ 
                     <CardContainer title="Tax & Deductions Overview">
                        <p className="text-gray-600 leading-relaxed">
                            This section provides a summary of how various tax and statutory deductions are calculated within the Wagewise system.
                            The calculations are based on the prevailing Kenyan regulatory guidelines. Understanding these components is crucial for accurate payroll processing and compliance.
                        </p>
                        <p className="text-gray-600 mt-3 leading-relaxed">
                            Select a tab above to learn more about specific calculations like PAYE, NSSF, SHIF (formerly NHIF), Housing Levy, and other payroll considerations.
                        </p>
                    </CardContainer>
                );
            case 'paye':
                return (
                    <CardContainer title="Pay As You Earn (PAYE) Calculation">
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            PAYE is calculated based on taxable income using a graduated scale. The following KRA tax brackets are applied (effective from 1st July 2023):
                        </p>
                        <RateTable 
                            data={calcParams.PAYE_BRACKETS.map(b => ({ ...b, limit: b.limit === Infinity ? `Above ${calcParams.PAYE_BRACKETS[calcParams.PAYE_BRACKETS.length - 2].limit.toLocaleString()}` : b.limit }))} 
                            columns={[
                                { header: 'Taxable Income (KSh per month)', accessor: 'limit' },
                                { header: 'Tax Rate', accessor: 'rate' }
                            ]}
                        />
                        <h3 className="text-md font-semibold text-gray-600 mt-6 mb-2">Tax Reliefs:</h3>
                        <ul className="list-disc list-inside text-gray-600 space-y-1 pl-4 mb-4 text-sm">
                            <li><strong>Personal Relief:</strong> KSh {calcParams.PAYE_PARAMETERS.PERSONAL_RELIEF.toLocaleString()}/= per month.</li>
                            <li><strong>Insurance Relief:</strong> 15% of premiums paid, up to a maximum of KSh {calcParams.PAYE_PARAMETERS.INSURANCE_RELIEF_MAX.toLocaleString()}/= per month. (Requires employee's insurance premium data).</li>
                            <li><strong>Disability Exemption:</strong> Individuals with a KRA disability exemption certificate have KSh {calcParams.PAYE_PARAMETERS.DISABILITY_EXEMPTION.toLocaleString()}/= of their monthly income exempted from tax.</li>
                        </ul>
                        <h3 className="text-md font-semibold text-gray-600 mt-6 mb-2">Taxable Income is derived after:</h3>
                         <ul className="list-disc list-inside text-gray-600 space-y-1 pl-4 text-sm">
                            <li>Deducting NSSF (employee portion).</li>
                            <li>Deducting SHIF (employee portion).</li>
                            <li>Deducting Housing Levy (employee portion).</li>
                            <li>Deducting approved employee pension contributions (up to KSh {calcParams.PAYE_PARAMETERS.PENSION_CONTRIBUTION_LIMIT.toLocaleString()}/= per month).</li>
                            <li>Deducting owner-occupier interest on a mortgage (up to KSh {calcParams.PAYE_PARAMETERS.OWNER_OCCUPIER_INTEREST_LIMIT.toLocaleString()}/= per month, if applicable).</li>
                            <li>Adding taxable value of non-cash benefits and Fringe Benefit Tax (FBT) if applicable.</li>
                        </ul>
                    </CardContainer>
                );
            case 'statutoryDeductions':
                return (
                    <CardContainer title="Statutory Deductions">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">NSSF (National Social Security Fund)</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Calculated at {(calcParams.NSSF_RATE * 100)}% for employee and {(calcParams.NSSF_RATE * 100)}% for employer on pensionable pay.
                                    Current Tiers (as of Oct 2024, pre-Feb 2025 changes):
                                </p>
                                <ul className="list-disc list-inside text-gray-600 space-y-1 pl-4 mt-2 text-sm">
                                    <li>Tier I: Up to KSh {calcParams.NSSF_TIER_1_LIMIT_PRE_FEB2025.toLocaleString()} pensionable pay.</li>
                                    <li>Tier II: On pensionable pay above KSh {calcParams.NSSF_TIER_1_LIMIT_PRE_FEB2025.toLocaleString()} up to KSh {calcParams.NSSF_TIER_2_UPPER_LIMIT_PRE_FEB2025.toLocaleString()}.</li>
                                </ul>
                                <p className="text-xs text-gray-500 mt-1">Note: The system uses date-based NSSF tier limits as per prevailing regulations.</p>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">SHIF (Social Health Insurance Fund)</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Effective 1st October 2024, SHIF is calculated at {(calcParams.SHIF_RATE * 100).toFixed(2)}% of the gross monthly salary for the employee.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">Housing Levy</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Calculated at {(calcParams.HOUSING_LEVY_RATE * 100).toFixed(1)}% of the gross monthly salary for the employee, and {(calcParams.HOUSING_LEVY_RATE * 100).toFixed(1)}% for the employer.
                                    The employee's contribution is deductible for PAYE calculation purposes.
                                </p>
                            </div>
                        </div>
                    </CardContainer>
                );
            case 'otherItems':
                 return ( /* ... same as before ... */ 
                    <CardContainer title="Other Payroll Items">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">Allowances & Benefits</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Taxable allowances and non-cash benefits (as defined per employee) are added to the basic salary to arrive at Gross Pay.
                                    Non-taxable benefits (if specified) are included in Gross Pay but excluded from Taxable Income.
                                </p>
                            </div>
                             <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">HELB (Higher Education Loans Board)</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    HELB deductions are based on the specific monthly amount provided for each employee in their profile. This amount is a direct post-tax deduction.
                                </p>
                            </div>
                             <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">Fringe Benefit Tax (FBT)</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    If an employee receives a loan from the employer at an interest rate lower than the KRA prescribed market rate, the benefit (difference in interest) is taxable.
                                    This calculated taxable benefit is added to the employee's taxable income for PAYE purposes.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-600 mb-1">Custom Deductions</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Any other custom deductions (e.g., Sacco, advances) defined for an employee are deducted from the Gross Pay after statutory deductions and PAYE to arrive at Net Pay.
                                </p>
                            </div>
                        </div>
                    </CardContainer>
                );
            default:
                return null;
        }
    };

    const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
    const inactiveTabClasses = "text-gray-500 hover:text-gray-700";

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'paye', label: 'PAYE Info' },
        { id: 'statutoryDeductions', label: 'Statutory Deductions' },
        { id: 'otherItems', label: 'Other Items' },
    ];

    return ( /* ... Page structure is the same ... */ 
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm py-4 px-6 border-b">
                     <h1 className="text-2xl font-bold text-gray-800">Tax Information & Calculation Guidelines</h1>
                </header>

                <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    <div className="flex space-x-1 md:space-x-2 border-b border-gray-200 mb-6 bg-white p-1 rounded-md shadow-sm">
                        {tabs.map((tab) => (
                            <Button
                                key={tab.id}
                                variant="ghost"
                                className={cn(
                                    "flex-1 md:flex-none justify-center px-3 py-2.5 md:px-4 md:py-3 rounded-md text-sm font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#7F5EFD] focus-visible:ring-offset-1",
                                    currentTaxTab === tab.id ? `${activeTabClasses} bg-purple-50/70` : `${inactiveTabClasses} hover:bg-gray-100`
                                )}
                                onClick={() => setCurrentTaxTab(tab.id as TaxTab)}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-transparent rounded-b-lg pb-6">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxPage;